const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface DistanceResult {
    success: boolean;
    durationMins?: number;
    distanceText?: string;
    error?: string;
}

/**
 * Calculates the drive time between two addresses using Google Maps Distance Matrix API.
 * @param origin The starting address (e.g. HQ or previous job)
 * @param destination The ending address (e.g. next job)
 * @returns Object indicating success and duration in minutes
 */
export async function getDriveTime(origin: string, destination: string): Promise<DistanceResult> {
    if (!origin || !destination) {
        return { success: false, error: "Missing origin or destination address" };
    }

    if (!GOOGLE_MAPS_API_KEY) {
        console.warn("GOOGLE_MAPS_API_KEY is not set. Falling back to default 30-min buffer.");
        // Fallback for local development if no key is provided
        return { success: true, durationMins: 30, distanceText: "N/A" };
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK") {
            return { success: false, error: `Distance Matrix API Error: ${data.status} - ${data.error_message || ""}` };
        }

        const element = data.rows[0]?.elements[0];

        if (!element || element.status !== "OK") {
            return { success: false, error: `Route not found: ${element?.status || "Unknown"}` };
        }

        const durationSeconds = element.duration.value;
        const durationMins = Math.ceil(durationSeconds / 60);

        return {
            success: true,
            durationMins,
            distanceText: element.distance.text,
        };

    } catch (error: any) {
        console.error("Failed to fetch Google Maps Distance Matrix:", error);
        return { success: false, error: error.message };
    }
}
