"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { formatTimeRange } from "../../lib/formatting";
import CalendlyWidget from "../../components/CalendlyWidget";

type Service = {
  id: number;
  name: string;
  duration_min: number | null;
  description: string | null;
};

type Slot = {
  id: number;
  start_time: string;
  end_time: string;
  technician_id: number | null;
  technician_name?: string | null;
  technician_email?: string | null;
  technician_notify_by_email?: boolean | null;
};

type PageProps = {
  params: { businessId: string };
};

export default function BookingPage({ params }: PageProps) {
  const businessSlug = params.businessId;
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(
    null
  );
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load services + open slots
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      // Check if business has Calendly URL configured
      const { data: businessData } = await supabase
        .from("businesses")
        .select("calendly_url")
        .eq("slug", businessSlug)
        .maybeSingle();

      if (businessData?.calendly_url) {
        setCalendlyUrl(businessData.calendly_url);
        setLoading(false);
        return;
      }

      // 1) Services for this business
      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("id, name, duration_min, description")
        .eq("business_slug", businessSlug)
        .order("name");

      if (servicesError) {
        console.error(servicesError);
        setError("Failed to load services.");
        setLoading(false);
        return;
      }

      // 2) Open time slots + technician names/emails/notify flag
      const { data: slotsData, error: slotsError } = await supabase
        .from("time_slots")
        .select(
          `
            id,
            start_time,
            end_time,
            technician_id,
            technicians (
              name,
              email,
              notify_by_email
            )
          `
        )
        .eq("business_slug", businessSlug)
        .eq("status", "open")
        .order("start_time", { ascending: true });

      if (slotsError) {
        console.error(slotsError);
        setError(
          "Failed to load available time slots: " + slotsError.message
        );
        setLoading(false);
        return;
      }

      const mappedSlots: Slot[] =
        slotsData?.map((row: any) => ({
          id: row.id,
          start_time: row.start_time,
          end_time: row.end_time,
          technician_id: row.technician_id,
          technician_name: row.technicians?.name ?? null,
          technician_email: row.technicians?.email ?? null,
          technician_notify_by_email: row.technicians?.notify_by_email ?? null,
        })) ?? [];

      setServices(servicesData ?? []);
      setSlots(mappedSlots);
      console.log("SLOTS LOADED", mappedSlots);
      setLoading(false);
    };

    loadData();
  }, [businessSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (!customerName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!customerEmail.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!selectedServiceId) {
      setError("Please select a service.");
      return;
    }
    if (!selectedSlotId) {
      setError("Please select an available time window.");
      return;
    }

    setSubmitting(true);

    // Find the chosen slot
    const slot = slots.find((s) => s.id === selectedSlotId);
    if (!slot) {
      setError("Selected time slot is no longer available.");
      setSubmitting(false);
      return;
    }

    // Find the chosen service (for email content)
    const selectedService = services.find(
      (svc) => svc.id === selectedServiceId
    );
    if (!selectedService) {
      setError("Selected service is no longer available.");
      setSubmitting(false);
      return;
    }

    // 1) Create booking (now including customer_email)
    const { data: bookingRows, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        business_slug: businessSlug,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        customer_phone: customerPhone.trim(),
        service_id: selectedServiceId,
        preferred_time: slot.start_time,
        assigned_technician_id: slot.technician_id,
        status: "new",
      })
      .select()
      .limit(1);

    if (bookingError || !bookingRows || bookingRows.length === 0) {
      console.error(bookingError);
      setError("Failed to create booking. Please try again.");
      setSubmitting(false);
      return;
    }

    const booking = bookingRows[0];

    // 2) Mark slot as booked and attach booking_id
    const { error: slotError } = await supabase
      .from("time_slots")
      .update({
        status: "booked",
        booking_id: booking.id,
      })
      .eq("id", slot.id)
      .eq("status", "open");

    if (slotError) {
      console.error(slotError);
      setError(
        "Booking was created but there was an issue reserving the time slot."
      );
      setSubmitting(false);
      return;
    }

    // Determine if tech should be notified
    const shouldNotifyTech =
      !!slot.technician_email && !!slot.technician_notify_by_email;

    // 3) Fire booking-email Edge Function (customer + optional tech)
    try {
      const { error: emailError } = await supabase.functions.invoke(
        "booking-email",
        {
          body: {
            customer: {
              name: customerName.trim(),
              email: customerEmail.trim(),
            },
            technician: shouldNotifyTech
              ? {
                name: slot.technician_name ?? undefined,
                email: slot.technician_email ?? undefined,
              }
              : {},
            booking: {
              serviceName: selectedService.name,
              startTimeISO: slot.start_time,
              businessName: businessSlug,
            },
          },
        }
      );

      if (emailError) {
        console.error("Error sending booking emails:", emailError);
        // Don't block success message on email failure
      }
    } catch (err) {
      console.error("Unexpected error calling booking-email:", err);
    }

    // 4) Trigger Google Calendar Sync (Non-blocking)
    try {
      fetch("/api/google-calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          businessSlug: businessSlug,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.warning) {
            console.warn("Google Calendar warning:", data.warning);
          } else {
            console.log("Google Calendar sync initiated");
          }
        })
        .catch((err) => console.error("Google Calendar sync fetch error:", err));
    } catch (err) {
      console.error("Failed to trigger calendar sync:", err);
    }

    // Remove that slot from local list & reset form
    setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setSelectedServiceId(null);
    setSelectedSlotId(null);
    setMessage("Your booking has been requested!");
    setSubmitting(false);
  };


  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 font-sans selection:bg-red-600/30">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tight mb-4">
            Book an Appointment
          </h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-sm font-medium">
            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            {businessSlug}
          </div>
        </header>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin mb-4"></div>
            <p className="text-zinc-600 dark:text-zinc-400 animate-pulse">Checking availability...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && message && (
          <div className="mb-8 p-8 rounded-2xl bg-red-600/10 border border-red-600/20 text-red-500 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Booking Requested!</h2>
            <p>{message}</p>
            <button
              onClick={() => setMessage(null)}
              className="mt-6 px-6 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-zinc-900 dark:text-white font-semibold transition-colors"
            >
              Book another
            </button>
          </div>
        )}

        {!loading && !message && calendlyUrl && (
          <div className="rounded-2xl border border-zinc-400/10 bg-zinc-100/50 dark:bg-zinc-900/50 p-6 backdrop-blur-sm shadow-xl dark:shadow-2xl">
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-center italic">
              Schedule your appointment using our secure booking system below:
            </p>
            <CalendlyWidget
              calendlyUrl={calendlyUrl}
              prefill={{
                name: customerName || undefined,
                email: customerEmail || undefined,
              }}
            />
          </div>
        )}

        {!loading && !message && !calendlyUrl && (
          <div className="space-y-8">
            <div className="p-1 rounded-2xl bg-gradient-to-br from-red-600/20 to-purple-500/20">
              <div className="bg-zinc-100/90 dark:bg-zinc-900/90 rounded-[calc(1rem-4px)] p-6 sm:p-10 backdrop-blur-xl border border-zinc-200 dark:border-white/5 shadow-xl dark:shadow-2xl">
                <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-center sm:text-lg">
                  Choose a service and select an available time window that works best for you.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                        Full Name
                      </label>
                      <input
                        id="name"
                        className="w-full bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        className="w-full bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                      Phone Number (for SMS confirmation)
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      className="w-full bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="service" className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                      Select Service
                    </label>
                    <select
                      id="service"
                      className="w-full bg-zinc-200/50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/50 transition-all appearance-none cursor-pointer"
                      value={selectedServiceId ?? ""}
                      onChange={(e) =>
                        setSelectedServiceId(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      required
                    >
                      <option value="" className="bg-zinc-100 dark:bg-zinc-900">Choose a service...</option>
                      {services.map((svc) => (
                        <option key={svc.id} value={svc.id} className="bg-zinc-100 dark:bg-zinc-900">
                          {svc.name}
                          {svc.duration_min ? ` (${svc.duration_min} min)` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-zinc-600 dark:text-zinc-400 ml-1">
                      Available Appointments
                    </label>
                    {slots.length === 0 ? (
                      <div className="p-8 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
                        <p className="text-zinc-500 dark:text-zinc-500">No open time slots right now. Please check back later.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                        {slots.map((slot) => (
                          <label
                            key={slot.id}
                            className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedSlotId === slot.id
                              ? "bg-red-700/20 border-red-600/50 ring-1 ring-red-600/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                              : "bg-zinc-200/30 dark:bg-zinc-800/30 border-zinc-300 dark:border-zinc-700 hover:border-zinc-600"
                              }`}
                          >
                            <input
                              type="radio"
                              name="slot"
                              className="hidden"
                              value={slot.id}
                              checked={selectedSlotId === slot.id}
                              onChange={() => setSelectedSlotId(slot.id)}
                            />
                            <div className="flex-1">
                              <div className="text-zinc-900 dark:text-white font-medium">
                                {formatTimeRange(slot.start_time, slot.end_time)}
                              </div>
                              {slot.technician_name && (
                                <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5">
                                  With {slot.technician_name}
                                </div>
                              )}
                            </div>
                            {selectedSlotId === slot.id && (
                              <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-[10px] text-zinc-900 dark:text-white">
                                ✓
                              </div>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || slots.length === 0}
                    className="w-full mt-4 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 dark:text-white font-bold py-4 rounded-xl shadow-lg shadow-red-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-zinc-200 dark:border-white/20 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      "Confirm Your Booking"
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
