"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar as any);

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

interface Service {
    id: number;
    name: string;
    duration_min: number | null;
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
    const [services, setServices] = useState<Service[]>([]);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [slotStart, setSlotStart] = useState<Date | null>(null);

    // Form State
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [notes, setNotes] = useState("");
    const [savingOption, setSavingOption] = useState(false);

    // Load services
    useEffect(() => {
        if (!currentBusiness) return;
        const fetchServices = async () => {
            const { data } = await supabase
                .from("services")
                .select("id, name, duration_min")
                .eq("business_slug", currentBusiness.slug)
                .order("name");
            if (data) {
                setServices(data);
                if (data.length > 0) setSelectedServiceId(data[0].id);
            }
        };
        fetchServices();
    }, [currentBusiness]);

    // Load preferred view from local storage on mount
    useEffect(() => {
        const savedView = localStorage.getItem("crewlink_calendar_view") as View;
        if (savedView && Object.values(Views).includes(savedView)) {
            setCurrentView(savedView);
        }
    }, []);

    // Handle Drag and Drop
    const onEventDrop = async ({ event, start, end }: any) => {
        if (!currentBusiness?.slug) return;

        // Optimistically update local state
        const updatedEvents = events.map(e =>
            e.id === event.id ? { ...e, start, end } : e
        );
        setEvents(updatedEvents);

        if (event.type === "internal") {
            // Internal booking: update Supabase directly
            // Event ID for internal is typically a stringified number
            const bookingId = parseInt(event.id, 10);
            if (isNaN(bookingId)) {
                console.error("Invalid internal booking ID");
                return;
            }

            const { error: dbError } = await supabase
                .from("bookings")
                .update({ preferred_time: start.toISOString() })
                .eq("id", bookingId);

            if (dbError) {
                console.error("Failed to move internal booking", dbError);
                return;
            }

            // Sync to Google Calendar using our new PUT endpoint
            fetch("/api/google-calendar/events", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId,
                    type: "internal",
                    businessSlug: currentBusiness.slug,
                    start: start.toISOString(),
                    end: end.toISOString()
                })
            }).catch(e => console.error("Sync error:", e));

        } else if (event.type === "external") {
            // External event: update Google Calendar API
            fetch("/api/google-calendar/events", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: event.id,
                    type: "external",
                    businessSlug: currentBusiness.slug,
                    start: start.toISOString(),
                    end: end.toISOString()
                })
            }).catch(e => {
                console.error("Failed to move external event", e);
            });
        }
    };

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

    const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
        setSlotStart(slotInfo.start);

        // Reset form
        setCustomerName("");
        setCustomerEmail("");
        setCustomerPhone("");
        setNotes("");
        setError(null);

        setShowAddModal(true);
    };

    const handleAddBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentBusiness || !slotStart || !selectedServiceId || !customerName || !customerEmail) {
            setError("Please fill in all required fields.");
            return;
        }

        setSavingOption(true);
        setError(null);

        try {
            // 1. Insert Booking
            const { data: bookingRows, error: bookingError } = await supabase
                .from("bookings")
                .insert({
                    business_slug: currentBusiness.slug,
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                    service_id: selectedServiceId,
                    preferred_time: slotStart.toISOString(),
                    status: "new",
                    notes: notes,
                })
                .select()
                .limit(1);

            if (bookingError || !bookingRows || bookingRows.length === 0) {
                throw new Error(bookingError?.message || "Failed to create booking.");
            }

            const booking = bookingRows[0];

            // 2. Sync to Google Calendar
            if (googleConnected) {
                fetch("/api/google-calendar/events", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        bookingId: booking.id,
                        businessSlug: currentBusiness.slug,
                    }),
                }).catch((err) => console.error("Calendar sync error:", err));
            }

            // 3. Refresh calendar and close
            setShowAddModal(false);
            loadData(); // Re-fetch all events so the new one appears immediately
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSavingOption(false);
        }
    };

    // Custom Event Styling
    const eventPropGetter = (event: CalendarEvent) => {
        const isInternal = event.type === 'internal';

        // Crewlink Red Theme vs Google Gray/Blue Theme
        const bgClass = isInternal
            ? 'bg-brand-base border-brand-light'
            : 'bg-slate-500 border-slate-600 dark:bg-slate-700 dark:border-slate-800';

        return {
            className: `${bgClass} text-white text-xs border rounded-md shadow-sm opacity-90 hover:opacity-100 transition-opacity`
        };
    };

    // Custom Toolbar/Components can be added here if needed to style Big Calendar

    return (
        <main className="max-w-7xl mx-auto py-8 lg:px-8">
            <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-6 px-4 lg:px-0">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Calendar</h1>
                    <p className="text-slate-600 dark:text-slate-400">
                        Manage your schedule and prevent double-booking.
                    </p>
                </div>
                {/* Status Badges */}
                <div className="flex gap-4">
                    {!googleConnected && !loading && (
                        <a href="/admin/settings" className="flex items-center gap-2 px-3 py-1.5 bg-brand-base/10 border border-brand-base/20 text-brand-base text-xs font-bold rounded-xl hover:bg-brand-light/20 transition-colors">
                            <span className="w-2 h-2 rounded-full bg-brand-light animate-pulse"></span>
                            Connect Google
                        </a>
                    )}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl">
                        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Synced</span>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mx-4 lg:mx-0 mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-medium flex items-center gap-3">
                    <span>⚠️</span> {error}
                </div>
            )}

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl mx-4 lg:mx-0">
                {/* 
                   We use custom CSS overrides in globals.css (or inline) to make 
                   react-big-calendar match our dark theme. 
                 */}
                <div className="h-[700px] md:h-[800px] p-4 rbc-theme-wrapper">
                    <DnDCalendar
                        draggableAccessor={() => true}
                        onEventDrop={onEventDrop}
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
                        tooltipAccessor={(event: CalendarEvent) => `${event.title}\n${event.details}`}
                        popup={true}
                        selectable={true}
                        onSelectSlot={handleSelectSlot}
                        onSelectEvent={(event: CalendarEvent) => alert(`Event: ${event.title}\nDetails: ${event.details}`)}
                    // We style the calendar wrapper via CSS to match the app theme
                    />
                </div>
            </div>

            {/* Click-to-add Modal */}
            {showAddModal && slotStart && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">New Booking</h3>
                                <p className="text-sm text-slate-500">{slotStart.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddBooking} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/50"
                                        value={selectedServiceId || ""}
                                        onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                                        required
                                    >
                                        <option value="" disabled>Select a service...</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.duration_min}m)</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customer Name *</label>
                                    <input required className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/50 placeholder:text-slate-400 dark:placeholder:text-slate-600" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Jane Doe" />
                                </div>

                                <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                                    <input required type="email" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/50 placeholder:text-slate-400 dark:placeholder:text-slate-600" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="jane@example.com" />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                                    <input type="tel" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/50 placeholder:text-slate-400 dark:placeholder:text-slate-600" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(555) 123-4567" />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Internal Notes</label>
                                    <textarea className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/50 resize-none h-20 placeholder:text-slate-400 dark:placeholder:text-slate-600" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Job details..." />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors">Cancel</button>
                                <button type="submit" disabled={savingOption} className="flex-[2] py-3 px-4 bg-brand-base hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl flex justify-center items-center shadow-lg transition-transform active:scale-95">
                                    {savingOption ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Save Booking & Sync"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
