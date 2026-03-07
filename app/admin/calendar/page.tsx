"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";

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

export default function CalendarAdminPage() {
    const { currentBusiness, loading: bizLoading } = useBusiness();
    const [targetDate, setTargetDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split("T")[0];
    });

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [googleEvents, setGoogleEvents] = useState<ExternalEvent[]>([]);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!currentBusiness) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch internal Supabase bookings for the target date
            // We'll fetch for the whole day based on preferred_time
            const startOfDay = `${targetDate}T00:00:00Z`;
            const endOfDay = `${targetDate}T23:59:59Z`;

            const { data: dbData, error: dbError } = await supabase
                .from("bookings")
                .select("*")
                .eq("business_slug", currentBusiness.slug)
                .gte("preferred_time", startOfDay)
                .lte("preferred_time", endOfDay)
                .order("preferred_time", { ascending: true });

            if (dbError) throw dbError;
            setBookings((dbData as Booking[]) || []);

            // 2. Check if Google Calendar is connected
            const { data: tokenData } = await supabase
                .from("google_tokens")
                .select("business_slug")
                .eq("business_slug", currentBusiness.slug)
                .maybeSingle();

            setGoogleConnected(!!tokenData);

            // 3. If connected, fetch Google Events
            if (tokenData) {
                const resp = await fetch(`/api/google-calendar/events/list?slug=${currentBusiness.slug}`);
                const googleData = await resp.json();

                if (googleData.events) {
                    const filteredEvents = googleData.events.filter((ev: ExternalEvent) => {
                        if (!ev.start.dateTime) return false;
                        const eventDate = new Date(ev.start.dateTime).toISOString().split("T")[0];
                        return eventDate === targetDate;
                    });
                    setGoogleEvents(filteredEvents);
                } else {
                    setGoogleEvents([]);
                }
            } else {
                setGoogleEvents([]);
            }
        } catch (err: any) {
            console.error(err);
            setError("Failed to fetch calendar data: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (bizLoading) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentBusiness, bizLoading, targetDate]);

    // Combine and sort events for the daily view
    const combinedSchedule = [
        ...bookings.map((b) => {
            const dateObj = new Date(b.preferred_time);
            const hours = String(dateObj.getUTCHours()).padStart(2, '0');
            const minutes = String(dateObj.getUTCMinutes()).padStart(2, '0');

            return {
                type: "internal",
                id: `internal-${b.id}`,
                title: `${b.customer_name}`,
                timeSort: `${hours}:${minutes}:00`,
                timeDisplay: `${hours}:${minutes}`,
                details: b.notes || "No additional notes.",
                status: b.status || "NEW",
                contact: b.customer_email,
                duration: 60 // Default 60 for now since bookings doesn't store duration yet
            };
        }),
        ...googleEvents.map((ev) => {
            // Extract time from dateTime (e.g., 2026-03-07T14:30:00-05:00)
            const dateObj = new Date(ev.start.dateTime);
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');

            const endDateObj = new Date(ev.end.dateTime);
            const durationMs = endDateObj.getTime() - dateObj.getTime();
            const durationMin = Math.round(durationMs / 60000);

            return {
                type: "external",
                id: `external-${ev.id}`,
                title: ev.summary || "Busy (Google Calendar)",
                timeSort: `${hours}:${minutes}:00`,
                timeDisplay: `${hours}:${minutes}`,
                details: ev.description || "External synced event.",
                status: "EXTERNAL",
                contact: null,
                duration: durationMin
            };
        })
    ].sort((a, b) => a.timeSort.localeCompare(b.timeSort));

    const formatAMPM = (timeStr: string) => {
        const [h, m] = timeStr.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        return `${hours}:${m} ${ampm}`;
    };

    return (
        <main className="max-w-6xl mx-auto py-8">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-8">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Calendar</h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                        Manage your daily schedule and synced appointments.
                    </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 bg-zinc-100/40 dark:bg-zinc-900/40 p-2 rounded-xl border border-zinc-200 dark:border-white/5">
                    <div className="px-3 py-2 text-zinc-500 text-sm font-medium">
                        {currentBusiness?.slug}
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <input
                        type="date"
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-red-600/50"
                    />
                </div>
            </header>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-3">
                    <span>⚠️</span> {error}
                </div>
            )}

            {/* Connection Status Banner */}
            {!googleConnected && !loading && (
                <div className="mb-8 p-4 bg-red-600/10 border border-red-600/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 text-red-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="text-sm font-medium">Google Calendar is not connected. External events will not be synced.</span>
                    </div>
                    <a href="/admin/settings" className="text-xs font-bold bg-red-600/20 hover:bg-red-600/30 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors">Connect Now</a>
                </div>
            )}

            <div className="bg-zinc-100/40 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm min-h-[500px]">
                {/* Daily Schedule View */}
                <div className="p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            <span className="p-2 bg-zinc-500/10 rounded-lg text-zinc-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </span>
                            Schedule for {new Date(targetDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                        <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-500">
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span> Crewlink</span>
                            <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-600"></span> Google</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 dark:text-zinc-500 animate-pulse gap-4">
                            <div className="w-8 h-8 border-2 border-zinc-300 dark:border-zinc-700 border-t-red-600 rounded-full animate-spin"></div>
                            <p className="font-medium text-sm">Loading schedule...</p>
                        </div>
                    ) : combinedSchedule.length === 0 ? (
                        <div className="text-center py-24 bg-zinc-100 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-white/5 border-dashed">
                            <p className="text-zinc-600 dark:text-zinc-400 text-lg mb-2">No appointments scheduled.</p>
                            <p className="text-zinc-500 dark:text-zinc-500 text-sm">Enjoy your free time or check a different date.</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Time Line Guide */}
                            <div className="absolute left-16 sm:left-24 top-0 bottom-0 w-px bg-white/5"></div>

                            <div className="space-y-6">
                                {combinedSchedule.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="relative flex gap-4 sm:gap-8 group">
                                        {/* Time Column */}
                                        <div className="w-16 sm:w-24 flex-shrink-0 text-right pt-4">
                                            <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:text-white transition-colors">{formatAMPM(item.timeDisplay)}</span>
                                        </div>

                                        {/* Event Card */}
                                        <div className={`flex-1 rounded-2xl p-5 border shadow-lg transition-all hover:-tranzinc-y-1 ${item.type === 'internal'
                                            ? "bg-zinc-200/40 dark:bg-zinc-800/40 border-red-600/20 hover:border-red-600/40"
                                            : "bg-zinc-200/20 dark:bg-zinc-800/20 border-red-600/20 hover:border-red-600/40"
                                            }`}>
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                                <div>
                                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 group-hover:text-amber-400 transition-colors">{item.title}</h3>
                                                    <div className="flex items-center gap-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                        <span className="flex items-center gap-1.5">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            {item.duration} min
                                                        </span>
                                                        {item.contact && (
                                                            <span className="flex items-center gap-1.5">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                                                {item.contact}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-lg border flex-shrink-0 ${item.status === 'CONFIRMED' ? 'bg-red-600/10 text-red-500 border-red-600/20' :
                                                    item.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                        item.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                            'bg-red-600/10 text-red-500 border-red-600/20'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </div>

                                            <div className="bg-zinc-100/50 dark:bg-zinc-900/50 rounded-xl p-3 border border-zinc-200 dark:border-white/5 text-sm text-zinc-700 dark:text-zinc-300 italic">
                                                {item.details}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
