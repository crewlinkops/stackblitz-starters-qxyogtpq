import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/app/lib/google-calendar";
import { GOOGLE_CLIENT_ID } from "@/app/lib/env";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const businessSlug = searchParams.get("slug");

    const origin = request.headers.get("origin") || request.headers.get("referer") || "https://gocrewlink.com";
    const dynamicRedirectUri = `${new URL(origin).origin}/api/google-calendar/callback`;

    console.log("OAuth Redirect Triggered:", {
        businessSlug,
        origin,
        dynamicRedirectUri,
        hasClientId: !!GOOGLE_CLIENT_ID,
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

    // Pass the dynamic redirect URI to the auth URL generator
    const url = getAuthUrl(businessSlug, dynamicRedirectUri);

    return NextResponse.redirect(url);
}
