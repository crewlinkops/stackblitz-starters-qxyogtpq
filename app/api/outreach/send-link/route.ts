import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/app/lib/sms";

export async function POST(request: NextRequest) {
    try {
        const { to, businessSlug, type } = await request.json();

        if (!to || !businessSlug || !type) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const origin = request.nextUrl.origin;
        let link = "";
        let message = "";

        if (type === "direct") {
            link = `${origin}/b/${businessSlug}`;
            message = `Hi! You can book your appointment with us directly here: ${link}`;
        } else if (type === "wizard") {
            link = `${origin}/wizard/${businessSlug}`;
            message = `Hi! Please use our service wizard to book your appointment: ${link}`;
        } else {
            return NextResponse.json({ error: "Invalid link type" }, { status: 400 });
        }

        const result = await sendSMS(to, message);

        if (result.success) {
            return NextResponse.json({ success: true, sid: result.sid });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Outreach API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
