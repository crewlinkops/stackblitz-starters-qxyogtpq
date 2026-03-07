import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/app/lib/google-calendar";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const businessSlug = searchParams.get("slug");

    if (!businessSlug) {
        return NextResponse.json({ error: "Missing business slug" }, { status: 400 });
    }

    const url = getAuthUrl(businessSlug);

    // Redirect the user to Google's consent page
    return NextResponse.redirect(url);
}
