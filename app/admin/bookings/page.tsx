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
        .eq("business_slug", currentBusiness.slug)
        .eq("active", true)
        .order("name", { ascending: true });

      if (techErr) throw techErr;
      setTechnicians((techData as Technician[]) ?? []);

      // services for name lookup
      const { data: svcData, error: svcErr } = await supabase
        .from("services")
        .select("id, name")
        .eq("business_slug", currentBusiness.slug)
        .order("name", { ascending: true });

      if (svcErr) throw svcErr;
      setServices((svcData as Service[]) ?? []);

      // bookings scoped to this business
      const { data: bookingData, error: bookingErr } = await supabase
        .from("bookings")
        .select(
          "id, business_slug, customer_name, customer_email, service_id, preferred_time, status, created_at, assigned_technician_id"
        )
        .eq("business_slug", currentBusiness.slug)
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
        .eq("business_slug", currentBusiness.slug);

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
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Service Bookings</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            {currentBusiness
              ? `Real-time requests for ${currentBusiness.name}`
              : "Select a business to view its scheduled bookings."}
          </p>
        </div>
        {currentBusiness && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            Live Updates
          </div>
        )}
      </header>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 font-medium italic">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-zinc-100/40 dark:bg-zinc-900/40 rounded-3xl border border-zinc-200 dark:border-white/5 overflow-hidden backdrop-blur-sm shadow-md dark:shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-8 h-8 border-3 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
            <p className="text-zinc-500 dark:text-zinc-500 font-medium italic">Scanning local repository...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-32 rounded-3xl bg-zinc-100 dark:bg-zinc-950/20">
            <h3 className="text-xl font-bold text-zinc-600 dark:text-zinc-400 mb-2">No data recorded</h3>
            <p className="text-zinc-600 max-w-sm mx-auto">Active bookings will appear here once customers complete the scheduling flow.</p>
          </div>
        ) : (
          <div className="overflow-x-auto ring-1 ring-white/5 rounded-3xl">
            <table className="min-w-full divide-y divide-white/5 bg-zinc-100/60 dark:bg-zinc-900/60">
              <thead className="bg-zinc-100 dark:bg-zinc-950/60">
                <tr>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em] whitespace-nowrap">Order Ref</th>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">Contact</th>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">Requirement</th>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">Timeframe</th>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map((b) => (
                  <tr key={b.id} className="group hover:bg-white/5 transition-colors duration-300">
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-zinc-900 dark:text-white px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 w-fit">#{b.id}</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{formatDateTime(b.created_at).split(',')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5 group-hover:text-red-500 transition-colors uppercase tracking-tight">{b.customer_name || "Guest User"}</span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium italic">{b.customer_email || "no-email-provided"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                          <span className="w-1 h-3 bg-red-600/60 rounded-full"></span>
                          {serviceName(b.service_id)}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-600 uppercase flex items-center gap-1.5 pl-3">
                          {technicianName(b.assigned_technician_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1 min-w-[120px]">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{formatDateTime(b.preferred_time).split(',')[1] || "Flexible"}</span>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{formatDateTime(b.preferred_time).split(',')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right sm:text-left">
                      <div className="relative inline-block w-full sm:w-40">
                        <select
                          value={b.status || "new"}
                          onChange={(e) => handleStatusChange(b, e.target.value || "new")}
                          disabled={updating}
                          className={`w-full appearance-none bg-zinc-200/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-600/40 transition-all ${b.status === 'completed' ? 'text-red-500 border-red-600/20 bg-red-600/5' :
                            b.status === 'cancelled' ? 'text-rose-400 border-rose-500/20 bg-rose-500/5' :
                              b.status === 'confirmed' ? 'text-red-500 border-red-600/20 bg-red-600/5' :
                                'text-zinc-600 dark:text-zinc-400'
                            }`}
                        >
                          <option value="new">NEW REQUEST</option>
                          <option value="confirmed">CONFIRMED</option>
                          <option value="assigned">ASSIGNED</option>
                          <option value="completed">COMPLETED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-zinc-600">
                          <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
