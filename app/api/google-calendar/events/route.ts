import { NextRequest, NextResponse } from "next/server";
import { createEvent, listEvents } from "@/app/lib/google-calendar";
import { supabase } from "@/app/lib/supabaseClient";
import { sendSMS } from "@/app/lib/sms";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const businessSlug = searchParams.get("slug");

    if (!businessSlug) {
        return NextResponse.json({ error: "Missing business slug" }, { status: 400 });
    }

    const result = await listEvents(businessSlug);

    if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ events: result.data });
}

export async function POST(request: NextRequest) {
    try {
        const { bookingId, businessSlug } = await request.json();

        if (!bookingId || !businessSlug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Fetch booking details to ensure validity and get content
        // We use the service role key or ensure RLS allows reading this booking
        // For now, assuming the public client (anon) can read the booking it just created, 
        // OR we use a service role client here if we want to be strict.
        // Since this is a Next.js API route, we are server-side.
        // If supabaseClient exports a client with anon key, RLS rules apply.
        // 'bookings' table has "policy 'Authenticated users can view all bookings'" 
        // and "Anyone can create bookings".
        // "Authenticated" usually means logged in. 
        // Is the user logged in? The customer is likely anon.
        // If RLS prevents anon reading, this fetch might fail if we use the default client 
        // AND don't have a session.
        // However, the booking page just inserted it and got it back.
        // Let's assume we can fetch it, or we rely on the passed data (less secure).
        // BETTER: Use a service role client for this background task to ensure access.
        // But I don't want to introduce a new client file if not needed.
        // app/lib/supabaseClient.ts exports 'supabase' with anon key.
        // I'll try fetching. If it fails due to RLS, I'll need to use Service Role.
        // env.ts DOES export SUPABASE_SERVICE_ROLE_KEY. 
        // So I should create a service client here to be safe and bypass RLS.

        const { createClient } = require("@supabase/supabase-js");
        const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = require("@/app/lib/env");

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
        const startTime = new Date(booking.preferred_time); // or start_time if set
        // Calculate end time
        const durationMin = booking.services?.duration_min || 60;
        const endTime = new Date(startTime.getTime() + durationMin * 60000);

        const event = {
            summary: `Booking: ${booking.customer_name} - ${booking.services?.name}`,
            description: `Service: ${booking.services?.name}\nCustomer: ${booking.customer_name}\nEmail: ${booking.customer_email}\nPhone: ${booking.customer_phone || "N/A"}\nNotes: ${booking.notes || ""}`,
            start: { dateTime: startTime.toISOString() },
            end: { dateTime: endTime.toISOString() },
            attendees: [
                { email: booking.customer_email },
                // Add technician if available?
            ],
        };

        // 3. Create Google Calendar Event
        const result = await createEvent(businessSlug, event);

        if (!result.success) {
            // Log error but return 200 with warning as per requirements (non-blocking)
            console.warn("Google Calendar Sync Failed:", result.error);
            return NextResponse.json({
                success: true,
                warning: "Booking created but Calendar sync failed",
                details: result.error
            });
        }

        // 4. Send SMS Confirmation (Non-blocking)
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
