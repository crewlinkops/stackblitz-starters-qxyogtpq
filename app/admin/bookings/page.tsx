"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";

type Booking = {
  id: number;
  business_id: string | null;
  business_slug: string | null;
  customer_name: string | null;
  customer_email: string | null;
  service_id: number | null;
  preferred_time: string | null;
  status: string | null;
  created_at: string;
  assigned_technician_id: number | null;
};

type Technician = {
  id: number;
  name: string | null;
};

type Service = {
  id: number;
  name: string | null;
};

export default function BookingsAdminPage() {
  const {
    currentBusiness,
    loading: businessLoading,
    error: businessError,
  } = useBusiness();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function formatDateTime(iso: string | null) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString();
  }

  function serviceName(id: number | null) {
    if (!id) return "—";
    const s = services.find((svc) => svc.id === id);
    return s?.name || `Service #${id}`;
  }

  function technicianName(id: number | null) {
    if (!id) return "—";
    const t = technicians.find((tech) => tech.id === id);
    return t?.name || `Technician #${id}`;
  }

  // ---------------------------------------------------------------------------
  // Load bookings + lookup tables for current business
  // ---------------------------------------------------------------------------
  const loadData = async () => {
    if (!currentBusiness) {
      setBookings([]);
      setTechnicians([]);
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // technicians for name lookup
      const { data: techData, error: techErr } = await supabase
        .from("technicians")
        .select("id, name")
        .eq("business_id", currentBusiness.id)
        .eq("active", true)
        .order("name", { ascending: true });

      if (techErr) throw techErr;
      setTechnicians((techData as Technician[]) ?? []);

      // services for name lookup
      const { data: svcData, error: svcErr } = await supabase
        .from("services")
        .select("id, name")
        .eq("business_id", currentBusiness.id)
        .order("name", { ascending: true });

      if (svcErr) throw svcErr;
      setServices((svcData as Service[]) ?? []);

      // bookings scoped to this business
      const { data: bookingData, error: bookingErr } = await supabase
        .from("bookings")
        .select(
          "id, business_id, business_slug, customer_name, customer_email, service_id, preferred_time, status, created_at, assigned_technician_id"
        )
        .eq("business_id", currentBusiness.id)
        .order("created_at", { ascending: false });

      if (bookingErr) throw bookingErr;
      setBookings((bookingData as Booking[]) ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessLoading) return;
    if (businessError) {
      setError(businessError);
      setLoading(false);
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness, businessLoading, businessError]);

  // ---------------------------------------------------------------------------
  // Status update
  // ---------------------------------------------------------------------------
  const handleStatusChange = async (booking: Booking, newStatus: string) => {
    if (!currentBusiness) return;
    if (booking.status === newStatus) return;

    setUpdating(true);
    setError(null);

    try {
      const { error: updErr } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", booking.id)
        .eq("business_id", currentBusiness.id);

      if (updErr) throw updErr;

      // update locally
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, status: newStatus } : b
        )
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update booking status");
    } finally {
      setUpdating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        Bookings
      </h1>
      <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
        {currentBusiness
          ? `List of bookings for: ${currentBusiness.name}`
          : "Select a business in the sidebar to view bookings."}
      </p>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: "8px 10px",
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
            fontSize: 13,
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <p style={{ fontSize: 13, color: "#9ca3af" }}>
          No bookings found for this business.
        </p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid #374151",
                }}
              >
                ID
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid #374151",
                }}
              >
                Customer
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid #374151",
                }}
              >
                Email
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid #374151",
                }}
              >
                Service
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid #374151",
                }}
              >
                Technician
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid #374151",
                }}
              >
                Preferred Time
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid #374151",
                }}
              >
                Status
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "6px 8px",
                  borderBottom: "1px solid #374151",
                }}
              >
                Created
              </th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td style={{ padding: "6px 8px" }}>{b.id}</td>
                <td style={{ padding: "6px 8px" }}>
                  {b.customer_name || "—"}
                </td>
                <td style={{ padding: "6px 8px" }}>
                  {b.customer_email || "—"}
                </td>
                <td style={{ padding: "6px 8px" }}>{serviceName(b.service_id)}</td>
                <td style={{ padding: "6px 8px" }}>
                  {technicianName(b.assigned_technician_id)}
                </td>
                <td style={{ padding: "6px 8px" }}>
                  {formatDateTime(b.preferred_time)}
                </td>
                <td style={{ padding: "6px 8px" }}>
                  <select
                    value={b.status || "new"}
                    onChange={(e) =>
                      handleStatusChange(b, e.target.value || "new")
                    }
                    disabled={updating}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid #4b5563",
                      backgroundColor: "#020617",
                      color: "#e5e7eb",
                      fontSize: 12,
                    }}
                  >
                    <option value="new">new</option>
                    <option value="confirmed">confirmed</option>
                    <option value="assigned">assigned</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
                <td style={{ padding: "6px 8px" }}>
                  {formatDateTime(b.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
