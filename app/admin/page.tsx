"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import StatCard from "../components/StatCard";

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
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 border-b border-slate-400/20 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Dashboard</h1>
        <p className="text-slate-400 text-lg">
          High-level overview of your Crewlink usage.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
      <section className="bg-slate-800/30 rounded-xl p-8 border border-slate-400/10">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Recent bookings
        </h2>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4 opacity-20">📅</div>
          <p className="text-slate-500 text-base">No bookings found yet. Keep up the good work!</p>
        </div>
      </section>
    </div>
  );
}

