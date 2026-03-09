import { NextRequest, NextResponse } from "next/server";
import { createEvent, listEvents, updateEvent } from "@/app/lib/google-calendar";
import { supabase } from "@/app/lib/supabaseClient";
import { sendSMS } from "@/app/lib/sms";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const businessSlug = searchParams.get("slug");
    const startStr = searchParams.get("start");
    const endStr = searchParams.get("end");

    if (!businessSlug) {
        return NextResponse.json({ error: "Missing business slug" }, { status: 400 });
    }

    // Default to a wide range if not provided (e.g., current month)
    const timeMin = startStr ? new Date(startStr).toISOString() : new Date().toISOString();

    let timeMax: string | undefined;
    if (endStr) {
        timeMax = new Date(endStr).toISOString();
    } else {
        // If no end provided, fetch ~30 days out by default to be safe
        const d = new Date(timeMin);
        d.setDate(d.getDate() + 30);
        timeMax = d.toISOString();
    }

    const result = await listEvents(businessSlug, timeMin, timeMax);

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ events: result.data });
}

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/app/lib/env";

export async function POST(request: NextRequest) {
    try {
        const { bookingId, businessSlug } = await request.json();

        if (!bookingId || !businessSlug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: booking, error: bookingError } = await adminSupabase
            .from("bookings")
            .select("*, services(name, duration_min)")
            .eq("id", bookingId)
            .single();

        if (bookingError || !booking) {
            console.error("Booking fetch error:", bookingError);
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // 2. Prepare event data
        const startTime = new Date(booking.preferred_time);
        const durationMin = booking.services?.duration_min || 60;
        const endTime = new Date(startTime.getTime() + durationMin * 60000);

        const event = {
            summary: `Booking: ${booking.customer_name} - ${booking.services?.name}`,
            description: `Service: ${booking.services?.name}\nCustomer: ${booking.customer_name}\nEmail: ${booking.customer_email}\nPhone: ${booking.customer_phone || "N/A"}\nNotes: ${booking.notes || ""}`,
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            attendees: [
                { email: booking.customer_email },
            ],
        };

        const result = await createEvent(businessSlug, event);

        if (!result.success) {
            console.warn("Google Calendar Sync Failed:", result.error);
            return NextResponse.json({
                success: true,
                warning: "Booking created but Calendar sync failed",
                details: result.error
            });
        }

        if (result.success && result.data?.id) {
            await adminSupabase
                .from("bookings")
                .update({ google_event_id: result.data.id })
                .eq("id", bookingId);
        }

        if (booking.customer_phone) {
            const smsBody = `Hi ${booking.customer_name}, your booking for ${booking.services?.name} on ${startTime.toLocaleString()} is confirmed!`;
            sendSMS(booking.customer_phone, smsBody).catch(err => {
                console.error("SMS sending failed:", err);
            });
        }

        return NextResponse.json({ success: true, eventLink: result.data?.htmlLink });

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { bookingId, eventId, type, businessSlug, start, end } = body;

        if (!businessSlug || !start || !end) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        let googleEventId = eventId;

        if (type === "internal") {
            if (!bookingId) return NextResponse.json({ error: "Missing booking ID" }, { status: 400 });

            const { data: booking, error: bkError } = await adminSupabase
                .from("bookings")
                .select("google_event_id")
                .eq("id", bookingId)
                .single();

            if (bkError || !booking?.google_event_id) {
                console.warn(`No Google Event ID recorded for booking ${bookingId}`);
                return NextResponse.json({ success: true, warning: "Internal booking has no Google Event ID synced." });
            }
            googleEventId = booking.google_event_id;
        }

        if (!googleEventId) {
            return NextResponse.json({ error: "No Event ID provided" }, { status: 400 });
        }

        const result = await updateEvent(businessSlug, googleEventId, {
            start: { dateTime: start },
            end: { dateTime: end }
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, eventLink: result.data?.htmlLink });

    } catch (e: any) {
        console.error("PUT Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
