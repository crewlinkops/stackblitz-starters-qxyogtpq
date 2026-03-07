"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { supabase } from "@/app/lib/supabaseClient";

type BookingRow = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  start_time: string | null;
  status: string | null;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalBookings, setTotalBookings] = useState<number | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<number | null>(null);
  const [activeTechs, setActiveTechs] = useState<number | null>(null);
  const [servicesCount, setServicesCount] = useState<number | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const now = new Date().toISOString();

        const [
          totalBookingsRes,
          upcomingBookingsRes,
          activeTechsRes,
          servicesRes,
          recentBookingsRes,
        ] = await Promise.all([
          supabase.from("bookings").select("*", { count: "exact", head: true }),
          supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .gte("start_time", now),
          supabase
            .from("technicians")
            .select("*", { count: "exact", head: true })
            .eq("active", true),
          supabase.from("services").select("*", { count: "exact", head: true }),
          supabase
            .from("bookings")
            .select("id, customer_name, customer_email, start_time, status")
            .order("start_time", { ascending: false })
            .limit(5),
        ]);

        if (totalBookingsRes.error) throw totalBookingsRes.error;
        if (upcomingBookingsRes.error) throw upcomingBookingsRes.error;
        if (activeTechsRes.error) throw activeTechsRes.error;
        if (servicesRes.error) throw servicesRes.error;
        if (recentBookingsRes.error) throw recentBookingsRes.error;

        setTotalBookings(totalBookingsRes.count ?? 0);
        setUpcomingBookings(upcomingBookingsRes.count ?? 0);
        setActiveTechs(activeTechsRes.count ?? 0);
        setServicesCount(servicesRes.count ?? 0);
        setRecentBookings(recentBookingsRes.data ?? []);
      } catch (err: any) {
        console.error(err);
        const msg =
          err?.message ||
          err?.error?.message ||
          JSON.stringify(err) ||
          "Failed to load dashboard data.";
        setError(msg);
      }

      setLoading(false);
    };

    load();
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Dashboard</h1>
          <p style={{ color: "#555", margin: 0 }}>
            High-level overview of your Crewlink usage.
          </p>
        </div>
        <Link
          href="/admin"
          style={{
            padding: "8px 16px",
            background: "#111827",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Go to Admin Panel
        </Link>
      </div>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "4px",
            border: "1px solid #e57373",
            background: "#ffebee",
            color: "#b71c1c",
          }}
        >
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        <StatCard
          label="Total bookings"
          value={loading ? "…" : totalBookings ?? 0}
        />
        <StatCard
          label="Upcoming bookings"
          value={loading ? "…" : upcomingBookings ?? 0}
        />
        <StatCard
          label="Active technicians"
          value={loading ? "…" : activeTechs ?? 0}
        />
        <StatCard
          label="Services"
          value={loading ? "…" : servicesCount ?? 0}
        />
      </div>

      {/* Recent bookings */}
      <section>
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
          Recent bookings
        </h2>

        {loading ? (
          <p style={{ color: "#777" }}>Loading…</p>
        ) : recentBookings.length === 0 ? (
          <p style={{ color: "#777" }}>No bookings yet.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f5f5" }}>
                <th style={thStyle}>Customer</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Start time</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td style={tdStyle}>{b.customer_name || "—"}</td>
                  <td style={tdStyle}>{b.customer_email || "—"}</td>
                  <td style={tdStyle}>
                    {b.start_time
                      ? new Date(b.start_time).toLocaleString()
                      : "—"}
                  </td>
                  <td style={tdStyle}>{b.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #ddd",
};

const tdStyle: CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #eee",
};

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "8px",
        border: "1px solid #ddd",
        background: "#fafafa",
      }}
    >
      <div style={{ fontSize: "13px", color: "#666" }}>{label}</div>
      <div style={{ fontSize: "22px", fontWeight: "bold" }}>{value}</div>
    </div>
  );
}
