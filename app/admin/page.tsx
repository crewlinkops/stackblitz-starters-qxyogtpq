"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import StatCard from "../components/StatCard";

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);

  const [totalBookings, setTotalBookings] = useState(0);
  const [upcomingBookings, setUpcomingBookings] = useState(0);
  const [activeTechs, setActiveTechs] = useState(0);
  const [servicesCount, setServicesCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

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

        // upcoming bookings
        const upcomingBookingsRes = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .gte("preferred_time", new Date().toISOString());

        if (upcomingBookingsRes.error) {
          console.warn("upcoming bookings count error", upcomingBookingsRes.error);
        }
        setUpcomingBookings(upcomingBookingsRes.count ?? 0);

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

        // recent bookings feed
        const { data: recentData } = await supabase
          .from("bookings")
          .select("id, customer_name, urgency, preferred_time, status, services(name)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (recentData) setRecentBookings(recentData);

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
      <div className="mb-8 border-b border-zinc-400/20 pb-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
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

      {/* Recent bookings feed */}
      <section className="bg-zinc-200/30 dark:bg-zinc-800/30 rounded-2xl p-6 sm:p-8 border border-zinc-200 dark:border-white/5 shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
            Recent Activity
          </h2>
          <a href="/admin/bookings" className="text-sm font-bold text-red-600 dark:text-red-400 hover:text-red-500 transition-colors">View All &rarr;</a>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-zinc-200/50 dark:bg-zinc-800/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
            <div className="text-5xl mb-4 opacity-30">🗓️</div>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg mb-1">No bookings found yet.</p>
            <p className="text-zinc-500 text-sm">Your most recent customer requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentBookings.map((b) => {
              const date = new Date(b.preferred_time);
              const urgencyColors = {
                emergency: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
                normal: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20',
                flexible: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              };
              const urgencyClass = urgencyColors[b.urgency as keyof typeof urgencyColors] || urgencyColors.normal;

              return (
                <div key={b.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-red-600/30">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center text-red-600 font-bold text-lg flex-shrink-0">
                      {b.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-zinc-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                        {b.customer_name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          {b.services?.name}
                        </span>
                        <span className="hidden sm:inline">&bull;</span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-start sm:self-auto pl-16 sm:pl-0">
                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border ${urgencyClass}`}>
                      {b.urgency || 'Normal'}
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-md border border-zinc-200 dark:border-white/5">
                      {b.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

