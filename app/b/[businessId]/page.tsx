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

    // Remove that slot from local list & reset form
    setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    setCustomerName("");
    setCustomerEmail("");
    setSelectedServiceId(null);
    setSelectedSlotId(null);
    setMessage("Your booking has been requested!");
    setSubmitting(false);
  };


  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Booking – Business {businessSlug}</h1>

      {loading && <p>Loading services and availability…</p>}

      {!loading && error && (
        <p style={{ color: "red", marginTop: "12px" }}>{error}</p>
      )}
      {!loading && message && (
        <p style={{ color: "green", marginTop: "12px" }}>{message}</p>
      )}

      {!loading && calendlyUrl && (
        <div>
          <p>Schedule your appointment using our booking system below:</p>
          <CalendlyWidget
            calendlyUrl={calendlyUrl}
            prefill={{
              name: customerName || undefined,
              email: customerEmail || undefined,
            }}
          />
        </div>
      )}

      {!loading && !calendlyUrl && (
        <>
          <p>
            Choose a service and one of the available appointment windows below.
          </p>
        <form onSubmit={handleSubmit} style={{ marginTop: "24px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label>
              Your name:
              <br />
              <input
                style={{ width: "100%", padding: "8px" }}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>
              Your email:
              <br />
              <input
                type="email"
                style={{ width: "100%", padding: "8px" }}
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>
              Service:
              <br />
              <select
                style={{ width: "100%", padding: "8px" }}
                value={selectedServiceId ?? ""}
                onChange={(e) =>
                  setSelectedServiceId(
                    e.target.value ? Number(e.target.value) : null
                  )
                }
              >
                <option value="">Select a service</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                    {svc.duration_min ? ` (${svc.duration_min} min)` : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label>Available time windows:</label>
            <br />
            {slots.length === 0 ? (
              <p>No open time slots right now.</p>
            ) : (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {slots.map((slot) => (
                  <label
                    key={slot.id}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "6px",
                      padding: "8px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="slot"
                      value={slot.id}
                      checked={selectedSlotId === slot.id}
                      onChange={() => setSelectedSlotId(slot.id)}
                      style={{ marginRight: "8px" }}
                    />
                    {formatTimeRange(slot.start_time, slot.end_time)}
                    {slot.technician_name && (
                      <span> — Tech: {slot.technician_name}</span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting || slots.length === 0}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            {submitting ? "Submitting…" : "Request booking"}
          </button>
        </form>
        </>
      )}
    </main>
  );
}
