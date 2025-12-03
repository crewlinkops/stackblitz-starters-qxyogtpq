"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);

  const [totalBookings, setTotalBookings] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState(0); // placeholder
  const [activeTechs, setActiveTechs] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      try {
        // total bookings
        const totalBookingsRes = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true });

        if (totalBookingsRes.error) {
          console.warn("bookings count error", totalBookingsRes.error);
        }
        setTotalBookings(totalBookingsRes.count ?? 0);

        // active technicians
        const activeTechsRes = await supabase
          .from("technicians")
          .select("*", { count: "exact", head: true })
          .eq("active", true);

        if (activeTechsRes.error) {
          console.warn("technicians count error", activeTechsRes.error);
        }
        setActiveTechs(activeTechsRes.count ?? 0);

        // services
        const servicesRes = await supabase
          .from("services")
          .select("*", { count: "exact", head: true });

        if (servicesRes.error) {
          console.warn("services count error", servicesRes.error);
        }
        setServicesCount(servicesRes.count ?? 0);

        // we don't have a start_time column yet, so upcoming is just 0 for now
        setUpcomingBookings(0);
      } catch (err) {
        console.error("dashboard load unexpected error", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "24px", marginBottom: "8px" }}>Dashboard</h1>
      <p style={{ color: "#555", marginBottom: "24px" }}>
        High-level overview of your Crewlink usage.
      </p>

      {/* Stats cards */}
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
          value={loading ? "…" : totalBookings}
        />
        <StatCard
          label="Upcoming bookings"
          value={loading ? "…" : upcomingBookings}
        />
        <StatCard
          label="Active technicians"
          value={loading ? "…" : activeTechs}
        />
        <StatCard
          label="Services"
          value={loading ? "…" : servicesCount}
        />
      </div>

      {/* Recent bookings placeholder */}
      <section>
        <h2 style={{ fontSize: "18px", marginBottom: "12px" }}>
          Recent bookings
        </h2>
        <p style={{ color: "#777", fontSize: "14px" }}>No bookings yet.</p>
      </section>
    </div>
  );
}

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
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
