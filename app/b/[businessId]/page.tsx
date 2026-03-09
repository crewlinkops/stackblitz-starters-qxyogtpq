"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useParams } from "next/navigation";
import { Calendar, dateFnsLocalizer, View, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

export default function DirectBookingPage() {
  const params = useParams();
  const businessSlug = params.businessId as string;

  const [business, setBusiness] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const loadInitialData = async () => {
      if (!businessSlug) return;

      // 1. Fetch Business
      const { data: bData } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", businessSlug)
        .single();
      if (bData) setBusiness(bData);

      // 2. Fetch Services
      const { data: sData } = await supabase
        .from("services")
        .select("*")
        .eq("business_slug", businessSlug)
        .order("name");
      if (sData) {
        setServices(sData);
        if (sData.length > 0) setServiceId(sData[0].id.toString());
      }

      // 3. Fetch Events (Anonymized)
      // We fetch the next 30 days of standard bookings to block out availability.
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 30);

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, preferred_time, services(duration_min)")
        .eq("business_slug", businessSlug)
        .gte("preferred_time", start.toISOString())
        .lte("preferred_time", end.toISOString());

      let busyEvents: any[] = [];
      if (bookings) {
        busyEvents = bookings.map(b => {
          const st = new Date(b.preferred_time);
          const dur = (Array.isArray(b.services) ? b.services[0]?.duration_min : (b.services as any)?.duration_min) || 60;
          const et = new Date(st.getTime() + dur * 60000);
          return {
            id: b.id,
            title: "Busy",
            start: st,
            end: et,
            isBusy: true
          };
        });
      }

      // Note: We'd ideally merge Google Calendar events here too, 
      // but for simplicity we rely on local bookings. If we wanted 
      // to fetch Google Calendar, we'd hit /api/google-calendar/events?slug=${businessSlug}

      fetch(`/api/google-calendar/events?slug=${businessSlug}`)
        .then(res => res.json())
        .then(data => {
          if (data.events) {
            const gEvents = data.events.map((e: any) => ({
              id: e.id,
              title: "Busy", // Anonymize all Google events publicly
              start: new Date(e.start.dateTime || e.start.date),
              end: new Date(e.end.dateTime || e.end.date),
              isBusy: true
            }));
            setEvents(prev => [...prev, ...gEvents]);
          }
        }).catch(e => console.error("Could not load Google events", e));

      setEvents(busyEvents);
      setLoading(false);
    };
    loadInitialData();
  }, [businessSlug]);

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    // Prevent booking in the past
    if (start < new Date()) return;
    setSlotStart(start);
    setShowModal(true);
    setSuccessMessage("");
  };

  const handleNavigate = (newDate: Date) => setCurrentDate(newDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotStart) return;
    setIsSubmitting(true);

    const { data, error } = await supabase.from("bookings").insert({
      business_slug: businessSlug,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      customer_address: address, // Used for routing later
      service_id: parseInt(serviceId, 10),
      preferred_time: slotStart.toISOString(),
      status: "pending" // Admin can approve/confirm
    }).select().single();

    if (error) {
      console.error(error);
      alert("Failed to book appointment. Please try again.");
      setIsSubmitting(false);
      return;
    }

    // Ideally we also push to Google Calendar here to reserve the spot immediately
    await fetch("/api/google-calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId: data.id,
        businessSlug: businessSlug
      })
    });

    setIsSubmitting(false);
    setSuccessMessage("Your appointment has been successfully requested!");
    // Add optimistic event
    const selectedService = services.find(s => s.id.toString() === serviceId);
    const dur = selectedService?.duration_min || 60;
    setEvents(prev => [...prev, {
      id: data.id,
      title: "Your Booking",
      start: slotStart,
      end: new Date(slotStart.getTime() + dur * 60000),
      isBusy: false
    }]);

    setTimeout(() => setShowModal(false), 2000);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Calendar...</div>;
  }

  if (!business) {
    return <div className="min-h-screen flex items-center justify-center">Business not found.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1221] text-slate-900 dark:text-white pb-20">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {business.name}
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Direct Calendar Booking</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Book an Appointment</h2>
          <p className="text-slate-600 dark:text-slate-400">Select an open time slot on the calendar below to instantly request a booking.</p>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl p-4">
          <div className="h-[700px] rbc-theme-wrapper">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={[Views.WEEK, Views.MONTH, Views.DAY]}
              defaultView={Views.WEEK}
              date={currentDate}
              onNavigate={handleNavigate}
              selectable={true}
              onSelectSlot={handleSelectSlot}
              eventPropGetter={(event: any) => ({
                className: event.isBusy ? "!bg-slate-200 dark:!bg-slate-800 !border-slate-300 dark:!border-slate-700 !text-slate-500 !cursor-not-allowed" : "!bg-brand-base !border-brand-light !text-white"
              })}
              onSelectEvent={() => alert("This slot is already booked.")}
            />
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Confirm Booking</h3>
                {slotStart && (
                  <p className="text-brand-base font-semibold">{slotStart.toLocaleString(undefined, { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {successMessage ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-medium text-center">
                  {successMessage}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Service Required</label>
                    <select required className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-slate-900 dark:text-white" value={serviceId} onChange={e => setServiceId(e.target.value)}>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.duration_min} min)</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                      <input required type="text" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                      <input required type="tel" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <input required type="email" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Service Address</label>
                      <input required type="text" placeholder="123 Main St, City, Zip" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button disabled={isSubmitting} type="submit" className="w-full py-4 px-6 bg-brand-base hover:bg-brand-light text-white font-bold rounded-xl shadow-lg shadow-brand-base/20 transition-all disabled:opacity-50">
                      {isSubmitting ? "Booking..." : "Request Appointment"}
                    </button>
                    <p className="text-xs text-center text-slate-500 mt-4">By booking, you agree to receive SMS and email confirmations.</p>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
