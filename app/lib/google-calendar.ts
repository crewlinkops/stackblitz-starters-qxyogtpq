import { google } from "googleapis";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } from "./env";

// Helper to get a fresh client every time - safer for serverless env vars
const getOAuthClient = (customRedirectUri?: string) => {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    customRedirectUri || GOOGLE_REDIRECT_URI
  );
};

export const getAuthUrl = (businessSlug: string, customRedirectUri?: string) => {
  const oauth2Client = getOAuthClient(customRedirectUri);
  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: businessSlug,
    prompt: "consent",
  });
};

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "./env";

export const getTokens = async (businessSlug: string) => {
  const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await adminSupabase
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
      return { success: false, error: "No tokens found" };
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      sendUpdates: "all",
    });

    return { success: true, data: response.data };

  } catch (error: any) {
    console.error("Failed to create Google Calendar event:", error);
    return { success: false, error: error.message };
  }
};

export const updateEvent = async (
  businessSlug: string,
  eventId: string,
  event: {
    start?: { dateTime: string };
    end?: { dateTime: string };
  }
) => {
  try {
    const tokens = await getTokens(businessSlug);

    if (!tokens) {
      return { success: false, error: "No tokens found" };
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Patch instead of update to only overwrite provided fields
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId: eventId,
      requestBody: event,
      sendUpdates: "all",
    });

    return { success: true, data: response.data };
  } catch (error: any) {
    console.error("Failed to update Google Calendar event:", error);
    return { success: false, error: error.message };
  }
};

export const listEvents = async (businessSlug: string, timeMin?: string, timeMax?: string) => {
  try {
    const tokens = await getTokens(businessSlug);

    if (!tokens) {
      return { success: false, error: "No tokens found" };
    }

    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const requestParams: any = {
      calendarId: "primary",
      maxResults: 250, // Fetch more events for broader views
      singleEvents: true,
      orderBy: "startTime",
    };

    if (timeMin) requestParams.timeMin = timeMin;
    else requestParams.timeMin = new Date().toISOString();

    if (timeMax) requestParams.timeMax = timeMax;

    const response = await calendar.events.list(requestParams);

    return { success: true, data: response.data.items };
  } catch (error: any) {
    console.error("Failed to list Google Calendar events:", error);
    return { success: false, error: error.message };
  }
};
