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
