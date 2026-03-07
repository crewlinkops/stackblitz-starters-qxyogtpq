import { google } from "googleapis";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "./env";
import { supabase } from "@/app/lib/supabaseClient";

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

export const getAuthUrl = (businessSlug: string) => {
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: businessSlug, // Pass business slug as state to associate tokens on callback
    prompt: "consent", // Force consent to ensure we get a refresh token
  });
};

export const getTokens = async (businessSlug: string) => {
  const { data, error } = await supabase
    .from("google_tokens")
    .select("*")
    .eq("business_slug", businessSlug)
    .single();

  if (error) {
    console.error("Error fetching tokens:", error);
    return null;
  }

  return data;
};

export const createEvent = async (
  businessSlug: string,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string };
    end: { dateTime: string };
    attendees?: { email: string }[];
  }
) => {
  try {
    const tokens = await getTokens(businessSlug);

    if (!tokens) {
      console.warn(`No Google tokens found for business: ${businessSlug}`);
      // Non-blocking warning
      return { success: false, error: "No tokens found" };
    }

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    // Check if basic refresh is needed (client handles this but good to be explicit if expiry is close)
    // oauth2Client automatically refreshes if refresh_token is present

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return { success: true, data: response.data };

  } catch (error: any) {
    console.error("Failed to create Google Calendar event:", error);
    // Non-blocking error
    return { success: false, error: error.message };
  }
};
export const listEvents = async (businessSlug: string, timeMin?: string) => {
  try {
    const tokens = await getTokens(businessSlug);

    if (!tokens) {
      return { success: false, error: "No tokens found" };
    }

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    return { success: true, data: response.data.items };
  } catch (error: any) {
    console.error("Failed to list Google Calendar events:", error);
    return { success: false, error: error.message };
  }
};
