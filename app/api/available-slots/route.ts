import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../lib/supabaseClient";
import { getDriveTime } from "../../lib/maps";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { businessSlug, serviceId, date, customerAddress } = body;

        if (!businessSlug || !serviceId || !date || !customerAddress) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch business and HQ
        const { data: business, error: bizError } = await supabase
            .from("businesses")
            .select("id, hq_address")
            .eq("slug", businessSlug)
            .single();

        if (bizError || !business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        const hqAddress = business.hq_address || "None";
        if (hqAddress === "None") {
            console.warn(`HQ Address not set for ${businessSlug}. Maps logic will fall back.`);
        }

        // 2. Fetch required service
        const { data: service, error: srvError } = await supabase
            .from("services")
            .select("duration_min")
            .eq("id", serviceId)
            .single();

        if (srvError || !service) {
            return NextResponse.json({ error: "Service not found" }, { status: 404 });
        }

        const durationMin = service.duration_min || 60;

        // 3. Fetch scheduling rules
        const { data: scheduling, error: schedError } = await supabase
            .from("business_scheduling")
            .select("work_start, work_end, lunch_start, lunch_end, buffer_min")
            .eq("business_slug", businessSlug)
            .single();

        if (schedError || !scheduling) {
            return NextResponse.json({ error: "Scheduling rules not found" }, { status: 404 });
        }

        // 4. Fetch all active technicians
        const { data: technicians, error: techError } = await supabase
            .from("technicians")
            .select("id, name")
            .eq("business_slug", businessSlug)
            .eq("active", true);

        if (techError || !technicians) {
            return NextResponse.json({ error: "No technicians found" }, { status: 404 });
        }

        // 5. Fetch all bookings for this date
        const startOfDay = new Date(`${date}T00:00:00`).toISOString();
        const endOfDay = new Date(`${date}T23:59:59`).toISOString();

        const { data: existingBookings, error: bookError } = await supabase
            .from("bookings")
            .select("assigned_technician_id, preferred_time, customer_address, services(duration_min)")
            .eq("business_slug", businessSlug)
            .gte("preferred_time", startOfDay)
            .lte("preferred_time", endOfDay)
            .in("status", ["new", "scheduled", "in_progress"]);

        const bookings = existingBookings || [];

        // Generate base slots based on work hours
        const parseTime = (timeStr: string) => {
            const [h, m] = timeStr.split(":");
            return parseInt(h) * 60 + parseInt(m);
        };

        const workStart = parseTime(scheduling.work_start);
        const workEnd = parseTime(scheduling.work_end);
        const lunchStart = scheduling.lunch_start ? parseTime(scheduling.lunch_start) : null;
        const lunchEnd = scheduling.lunch_end ? parseTime(scheduling.lunch_end) : null;
        const DEFAULT_BUFFER = scheduling.buffer_min || 15;

        let availableSlots = [];

        // Simple iteration per technician
        for (const tech of technicians) {
            let currentMin = workStart;
            const techBookings = bookings
                .filter(b => b.assigned_technician_id === tech.id)
                .map(b => {
                    const bt = new Date(b.preferred_time);
                    const startMin = bt.getHours() * 60 + bt.getMinutes();
                    const dur = (Array.isArray(b.services) ? b.services[0]?.duration_min : (b.services as any)?.duration_min) || 60;
                    return { start: startMin, end: startMin + dur, address: b.customer_address };
                })
                .sort((a, b) => a.start - b.start);

            while (currentMin + durationMin <= workEnd) {
                // Check lunch
                if (lunchStart && lunchEnd) {
                    if (currentMin >= lunchStart && currentMin < lunchEnd) {
                        currentMin = lunchEnd;
                        continue;
                    }
                    if (currentMin + durationMin > lunchStart && currentMin + durationMin <= lunchEnd) {
                        currentMin = lunchEnd;
                        continue;
                    }
                }

                // Check collisions with existing bookings
                const slotEnd = currentMin + durationMin;
                let collision = false;
                let prevJobAddress = hqAddress;
                let nextJobAddress = null;

                for (const b of techBookings) {
                    if ((currentMin >= b.start && currentMin < b.end) || (slotEnd > b.start && slotEnd <= b.end)) {
                        collision = true;
                        currentMin = b.end + DEFAULT_BUFFER; // skip past it
                        break;
                    }
                    if (b.end <= currentMin) {
                        prevJobAddress = b.address || hqAddress;
                    }
                    if (b.start >= slotEnd && !nextJobAddress) {
                        nextJobAddress = b.address;
                    }
                }

                if (collision) continue;

                // Drive Time Calculation
                // For performance, we'll only check the distance if the basic logic passes.
                // In a production environment with many slots, you'd batch this. For MVP, we'll do sequential checks, 
                // but we might only return the first 5 slots per technician or limit to prevent timeout.

                let valid = true;

                if (hqAddress !== "None") {
                    // Check time from previous job to here
                    const origin = prevJobAddress;
                    const dest = customerAddress;
                    const routeToJob = await getDriveTime(origin, dest);

                    const driveTimeFromLast = routeToJob.success && routeToJob.durationMins ? routeToJob.durationMins : DEFAULT_BUFFER;

                    // Does the tech have enough time to get here from previous job?
                    // Previous job end time is the starting point. 
                    const prevJobEnd = techBookings.filter(b => b.end <= currentMin).pop()?.end || workStart;
                    if (prevJobEnd + driveTimeFromLast > currentMin) {
                        valid = false;
                        currentMin = prevJobEnd + driveTimeFromLast; // Advance
                    }

                    // Check time from here to next job
                    if (valid && nextJobAddress) {
                        const routeToNext = await getDriveTime(customerAddress, nextJobAddress);
                        const driveTimeToNext = routeToNext.success && routeToNext.durationMins ? routeToNext.durationMins : DEFAULT_BUFFER;
                        const nextJobStart = techBookings.find(b => b.start >= slotEnd)?.start || workEnd;

                        if (slotEnd + driveTimeToNext > nextJobStart) {
                            valid = false;
                            currentMin += 30; // Jump ahead to test next block
                        }
                    }
                }

                if (valid) {
                    // It fits!
                    const formatToString = (mins: number) => {
                        const h = Math.floor(mins / 60).toString().padStart(2, '0');
                        const m = (mins % 60).toString().padStart(2, '0');
                        return `${date}T${h}:${m}:00`;
                    };

                    availableSlots.push({
                        id: Math.random() * 1000000, // Generate temporary ID for UI mapping
                        start_time: formatToString(currentMin),
                        end_time: formatToString(slotEnd),
                        technician_id: tech.id,
                        technician_name: tech.name,
                    });

                    currentMin += (durationMin + DEFAULT_BUFFER); // Step forward for next slot evaluation
                }
            }
        }

        // Sort globally by time
        availableSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

        return NextResponse.json({ slots: availableSlots });

    } catch (e: any) {
        console.error("Available Slots API Error:", e);
        return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
    }
}
