import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/app/lib/google-calendar";
import { GOOGLE_CLIENT_ID } from "@/app/lib/env";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const businessSlug = searchParams.get("slug");

    console.log("OAuth Redirect Triggered:", {
        businessSlug,
        hasClientId: !!GOOGLE_CLIENT_ID,
        clientIdPrefix: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 10) : "missing"
    });

    if (!businessSlug) {
        return NextResponse.json({ error: "Missing business slug" }, { status: 400 });
    }

    if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json({
            error: "OAuth Client ID is missing on server",
            help: "Check Vercel Environment Variables for GOOGLE_CLIENT_ID"
        }, { status: 500 });
    }

    const url = getAuthUrl(businessSlug);

    // Redirect the user to Google's consent page
    return NextResponse.redirect(url);
}
