"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Setup date-fns localizer for react-big-calendar
const locales = {
    "en-US": enUS,
};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface Booking {
    id: number;
    customer_name: string;
    customer_email: string;
    service_id: number;
    notes: string | null;
    preferred_time: string;
    status: string;
}

interface ExternalEvent {
    id: string;
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
}

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: "internal" | "external";
    details: string;
    status: string;
    contact: string | null;
}

export default function CalendarAdminPage() {
    const { currentBusiness, loading: bizLoading } = useBusiness();

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<View>(Views.WEEK);

    // Data State
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load preferred view from local storage on mount
    useEffect(() => {
        const savedView = localStorage.getItem("crewlink_calendar_view") as View;
        if (savedView && Object.values(Views).includes(savedView)) {
            setCurrentView(savedView);
        }
    }, []);

    const fetchEventsForRange = async (start: Date, end: Date) => {
        if (!currentBusiness) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch internal Supabase bookings for the range
            const { data: dbData, error: dbError } = await supabase
                .from("bookings")
                .select("*")
                .eq("business_slug", currentBusiness.slug)
                .gte("preferred_time", start.toISOString())
                .lte("preferred_time", end.toISOString());

            if (dbError) throw dbError;

            // 2. Check Google connection
            const { data: tokenData } = await supabase
                .from("google_tokens")
                .select("business_slug")
                .eq("business_slug", currentBusiness.slug)
                .maybeSingle();

            setGoogleConnected(!!tokenData);

            let gEvents: ExternalEvent[] = [];

            // 3. Fetch Google Events for the range
            if (tokenData) {
                const resp = await fetch(
                    `/api/google-calendar/events?slug=${currentBusiness.slug}&start=${start.toISOString()}&end=${end.toISOString()}`
                );
                const googleData = await resp.json();
                if (googleData.events) {
                    gEvents = googleData.events;
                }
            }

            // 4. Map and Combine
            const formattedInternal: CalendarEvent[] = (dbData as Booking[] || []).map(b => {
                const startDate = new Date(b.preferred_time);
                // Default 1 hour duration
                const endDate = new Date(startDate.getTime() + 60 * 60000);
                return {
                    id: `internal-${b.id}`,
                    title: b.customer_name,
                    start: startDate,
                    end: endDate,
                    type: "internal",
                    details: b.notes || "No details",
                    status: b.status || "NEW",
                    contact: b.customer_email
                };
            });

            const formattedExternal: CalendarEvent[] = gEvents.map(ev => {
                // Fallback for all-day events which might only have a 'date' field instead of 'dateTime'
                const startStr = ev.start?.dateTime || (ev.start as any)?.date;
                const endStr = ev.end?.dateTime || (ev.end as any)?.date;

                return {
                    id: `external-${ev.id}`,
                    title: ev.summary || "Busy",
                    start: new Date(startStr),
                    end: endStr ? new Date(endStr) : new Date(new Date(startStr).getTime() + 60 * 60000), // fallback 1hr
                    type: "external",
                    details: ev.description || "Synced from Google Calendar",
                    status: "EXTERNAL",
                    contact: null
                };
            });

            setEvents([...formattedInternal, ...formattedExternal]);

        } catch (err: any) {
            console.error(err);
            setError("Failed to fetch calendar data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate the active date range based on view and current date
    const loadData = useCallback(() => {
        if (!currentBusiness) return;

        let start = new Date(currentDate);
        let end = new Date(currentDate);

        if (currentView === Views.MONTH) {
            start.setDate(1); // Start of month
            start.setDate(start.getDate() - start.getDay()); // Back to start of week view
            end.setMonth(end.getMonth() + 1, 0); // End of month
            end.setDate(end.getDate() + (6 - end.getDay())); // Forward to end of week view
        } else if (currentView === Views.WEEK || currentView === Views.WORK_WEEK) {
            start.setDate(start.getDate() - start.getDay());
            end.setDate(end.getDate() + (6 - end.getDay()));
        }

        // Add padding to ensure we don't truncate timezone edges
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        // Add single day padding to be safe
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() + 1);

        fetchEventsForRange(start, end);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentBusiness, currentDate, currentView]);

    useEffect(() => {
        if (bizLoading) return;
        loadData();
    }, [bizLoading, loadData]);

    // Calendar Handlers
    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const handleViewChange = (newView: View) => {
        setCurrentView(newView);
        localStorage.setItem("crewlink_calendar_view", newView);
    };

    // Custom Event Styling
    const eventPropGetter = (event: CalendarEvent) => {
        const isInternal = event.type === 'internal';

        // Crewlink Red Theme vs Google Gray/Blue Theme
        const bgClass = isInternal
            ? 'bg-red-600 border-red-700'
            : 'bg-zinc-500 border-zinc-600 dark:bg-zinc-700 dark:border-zinc-800';

        return {
            className: `${bgClass} text-white text-xs border rounded-md shadow-sm opacity-90 hover:opacity-100 transition-opacity`
        };
    };

    // Custom Toolbar/Components can be added here if needed to style Big Calendar

    return (
        <main className="max-w-7xl mx-auto py-8 lg:px-8">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-6 px-4 lg:px-0">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Calendar</h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Manage your schedule and prevent double-booking.
                    </p>
                </div>
                {/* Status Badges */}
                <div className="flex gap-4">
                    {!googleConnected && !loading && (
                        <a href="/admin/settings" className="flex items-center gap-2 px-3 py-1.5 bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold rounded-xl hover:bg-red-600/20 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Connect Google
                        </a>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Synced</span>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mx-4 lg:mx-0 mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3">
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl mx-4 lg:mx-0">
                {/* 
                   We use custom CSS overrides in globals.css (or inline) to make 
                   react-big-calendar match our dark theme. 
                 */}
                <div className="h-[700px] md:h-[800px] p-4 rbc-theme-wrapper">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        view={currentView}
                        views={[Views.MONTH, Views.WEEK, Views.WORK_WEEK, Views.DAY]}
                        date={currentDate}
                        onNavigate={handleNavigate}
                        onView={handleViewChange}
                        eventPropGetter={eventPropGetter}
                        tooltipAccessor={(event) => `${event.title}\n${event.details}`}
                        popup={true}
                        selectable={false}
                    // We style the calendar wrapper via CSS to match the app theme
                    />
                </div>
            </div>
        </main>
    );
}
