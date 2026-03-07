import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ANON_KEY
} from "@/app/lib/env";

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
);

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const businessSlug = searchParams.get("state");

    if (!code || !businessSlug) {
        return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    // Use Service Role key for backend operations to bypass RLS
    // If missing, fall back to anon key (which will likely fail RLS)
    const supabaseAdmin = createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
    );

    try {
        const { tokens } = await oauth2Client.getToken(code);

        // Save tokens to Supabase
        const { error } = await supabaseAdmin
            .from("google_tokens")
            .upsert({
                business_slug: businessSlug,
                access_token: tokens.access_token,
                refresh_token: tokens.refresh_token,
                expiry_date: tokens.expiry_date,
                scope: tokens.scope,
                token_type: tokens.token_type,
                updated_at: new Date().toISOString(),
            }, { onConflict: "business_slug" });

        if (error) {
            console.error("Supabase upsert error:", error);
            return NextResponse.json({
                error: "Failed to save tokens",
                supabaseError: error,
                usingServiceRole: !!SUPABASE_SERVICE_ROLE_KEY
            }, { status: 500 });
        }

        const redirectUrl = new URL(`/admin/settings?success=google_connected`, request.url);
        if (redirectUrl.hostname === '0.0.0.0') {
            redirectUrl.hostname = 'localhost';
        }
        return NextResponse.redirect(redirectUrl);

    } catch (err: any) {
        console.error("OAuth error:", err);
        const errorData = err.response?.data || err;
        return NextResponse.json({
            error: err.message,
            details: errorData,
            timestamp: new Date().toISOString(),
            debug: {
                hasCode: !!code,
                hasBusinessSlug: !!businessSlug,
                redirectUri: GOOGLE_REDIRECT_URI,
                clientIdPrefix: GOOGLE_CLIENT_ID ? GOOGLE_CLIENT_ID.substring(0, 10) : "missing"
            }
        }, { status: 500 });
    }
}
