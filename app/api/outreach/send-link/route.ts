import { NextRequest, NextResponse } from "next/server";
import { sendSMS } from "@/app/lib/sms";

export async function POST(request: NextRequest) {
    try {
        const { to, businessSlug } = await request.json();

        if (!to || !businessSlug) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const origin = request.nextUrl.origin;
        const link = `${origin}/wizard/${businessSlug}`;
        const message = `Hi! Please use our service wizard to book your appointment: ${link}`;

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
