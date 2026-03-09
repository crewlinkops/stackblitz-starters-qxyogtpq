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
  customer_address: string | null;
  urgency: string | null;
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

  // New Booking State
  const [googleConnected, setGoogleConnected] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    urgency: "normal",
    serviceId: "",
    technicianId: "",
    preferredDate: "",
    preferredTime: "09:00",
    notes: ""
  });

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
      // Check google connection
      const { data: tokenData } = await supabase
        .from("google_tokens")
        .select("business_slug")
        .eq("business_slug", currentBusiness.slug)
        .maybeSingle();
      setGoogleConnected(!!tokenData);

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
          "id, business_slug, customer_name, customer_email, service_id, preferred_time, status, created_at, assigned_technician_id, customer_address, urgency"
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
  // Create Booking
  // ---------------------------------------------------------------------------
  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) return;
    setSavingNew(true);
    setError(null);

    try {
      if (!addForm.customerName || !addForm.preferredDate || !addForm.preferredTime) {
        throw new Error("Missing required fields: Name, Date, and Time are mandatory.");
      }

      const dateTimeString = `${addForm.preferredDate}T${addForm.preferredTime}:00`;

      const { data: newBooking, error: insErr } = await supabase
        .from("bookings")
        .insert({
          business_id: currentBusiness.id,
          business_slug: currentBusiness.slug,
          customer_name: addForm.customerName,
          customer_email: addForm.customerEmail || null,
          customer_phone: addForm.customerPhone || null,
          customer_address: addForm.customerAddress || null,
          urgency: addForm.urgency,
          service_id: addForm.serviceId ? parseInt(addForm.serviceId) : null,
          assigned_technician_id: addForm.technicianId ? parseInt(addForm.technicianId) : null,
          preferred_time: new Date(dateTimeString).toISOString(),
          notes: addForm.notes || null,
          status: "confirmed"
        })
        .select()
        .single();

      if (insErr) throw insErr;

      // Optimistic update
      setBookings((prev) => [newBooking as Booking, ...prev]);

      // Sync to Google Calendar if connected
      if (googleConnected) {
        await fetch("/api/google-calendar/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: currentBusiness.slug,
            summary: `Booking for ${addForm.customerName}`,
            description: `${addForm.notes}\nPhone: ${addForm.customerPhone}\nAddress: ${addForm.customerAddress}\nUrgency: ${addForm.urgency}`,
            start: new Date(dateTimeString).toISOString(),
            durationMinutes: 60 // fallback
          })
        });
      }

      setShowAddModal(false);
      setAddForm({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        customerAddress: "",
        urgency: "normal",
        serviceId: "",
        technicianId: "",
        preferredDate: "",
        preferredTime: "09:00",
        notes: ""
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create booking");
    } finally {
      setSavingNew(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Service Bookings</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {currentBusiness
              ? `Real-time requests for ${currentBusiness.name}`
              : "Select a business to view its scheduled bookings."}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {currentBusiness && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-base/10 border border-brand-base/20 text-brand-base dark:text-brand-light text-xs font-bold uppercase tracking-[0.15em]">
              <span className="w-2 h-2 bg-brand-base rounded-full animate-pulse shadow-[0_0_8px_rgba(79,70,229,0.8)]"></span>
              Live Updates
            </div>
          )}
          {currentBusiness && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-base hover:bg-brand-light text-white text-sm font-bold rounded-xl transition-all duration-300 shadow-lg shadow-brand-base/20 hover:shadow-brand-base/40 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create Booking
            </button>
          )}
        </div>
      </header>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 font-medium italic">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white/40 dark:bg-[#0B1221]/60 rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden backdrop-blur-xl shadow-xl shadow-brand-base/5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-8 h-8 border-3 border-brand-base/20 border-t-brand-base rounded-full animate-spin"></div>
            <p className="text-slate-500 dark:text-slate-400 font-medium italic">Scanning local repository...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-32 rounded-3xl bg-slate-50/50 dark:bg-slate-900/20">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No data recorded</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Active bookings will appear here once customers complete the scheduling flow.</p>
          </div>
        ) : (
          <div className="overflow-x-auto ring-1 ring-black/5 dark:ring-white/5 rounded-3xl">
            <table className="min-w-full divide-y divide-slate-200/50 dark:divide-white/5 bg-transparent">
              <thead className="bg-slate-50/50 dark:bg-[#060B19]/50 backdrop-blur-sm">
                <tr>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Order Ref</th>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Requirement</th>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Timeframe</th>
                  <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                {bookings.map((b) => (
                  <tr key={b.id} className="group hover:bg-slate-50/50 dark:hover:bg-white-[0.02] transition-colors duration-300">
                    <td className="px-6 py-6 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-white/5 w-fit shadow-sm shadow-black/5">#{b.id}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">{formatDateTime(b.created_at).split(',')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1.5 min-w-[200px]">
                        <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-base dark:group-hover:text-brand-light transition-colors tracking-tight">{b.customer_name || "Guest User"}</span>
                        <div className="flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            <span className="truncate">{b.customer_email || "no-email-provided"}</span>
                          </div>
                          <div className="flex items-start gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            <svg className="w-3.5 h-3.5 opacity-70 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            <span className="truncate whitespace-normal max-w-[200px] leading-relaxed">{b.customer_address || "No address provided"}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="space-y-2 min-w-[150px]">
                        <div className="flex items-center gap-2">
                          {b.urgency === 'emergency' && (
                            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] bg-rose-500 text-white rounded-md shadow-sm shadow-rose-500/40 animate-pulse">Emergency</span>
                          )}
                          {b.urgency !== 'emergency' && b.urgency && (
                            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] rounded-md border ${b.urgency === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                              b.urgency === 'normal' ? 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20' :
                                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              }`}>{b.urgency}</span>
                          )}
                        </div>
                        <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className="w-1.5 h-3.5 bg-brand-base/60 rounded-full"></span>
                          {serviceName(b.service_id)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 pl-3.5">
                          {technicianName(b.assigned_technician_id)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-col gap-1 min-w-[120px]">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDateTime(b.preferred_time).split(',')[1] || "Flexible"}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{formatDateTime(b.preferred_time).split(',')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right sm:text-left">
                      <div className="relative inline-block w-full sm:w-44">
                        <select
                          value={b.status || "new"}
                          onChange={(e) => handleStatusChange(b, e.target.value || "new")}
                          disabled={updating}
                          className={`w-full appearance-none bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-base/40 transition-all ${b.status === 'completed' ? 'text-brand-base border-brand-base/20 bg-brand-base/5' :
                              b.status === 'cancelled' ? 'text-slate-400 border-slate-500/20 bg-slate-500/5 line-through' :
                                b.status === 'confirmed' ? 'text-emerald-500 border-emerald-600/20 bg-emerald-600/5' :
                                  'text-slate-600 dark:text-slate-400'
                            }`}
                        >
                          <option value="new">NEW REQUEST</option>
                          <option value="confirmed">CONFIRMED</option>
                          <option value="assigned">ASSIGNED</option>
                          <option value="completed">COMPLETED</option>
                          <option value="cancelled">CANCELLED</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
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

      {showAddModal && currentBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-[#020617]/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-brand-base/10 w-full max-w-2xl border border-slate-200 dark:border-white/10 my-8 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-base/10 flex items-center justify-center text-brand-base">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </span>
                Manual Entry
              </h2>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleAddBooking} className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Customer Name *</label>
                  <input required type="text" value={addForm.customerName} onChange={(e) => setAddForm({ ...addForm, customerName: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                  <input type="email" value={addForm.customerEmail} onChange={(e) => setAddForm({ ...addForm, customerEmail: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all" placeholder="jane@example.com" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Phone Number</label>
                  <input type="tel" value={addForm.customerPhone} onChange={(e) => setAddForm({ ...addForm, customerPhone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all" placeholder="(555) 123-4567" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Service Address</label>
                  <input type="text" value={addForm.customerAddress} onChange={(e) => setAddForm({ ...addForm, customerAddress: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all" placeholder="123 Main St" />
                </div>
              </div>

              {/* Requirement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Service Type</label>
                  <div className="relative">
                    <select value={addForm.serviceId} onChange={(e) => setAddForm({ ...addForm, serviceId: e.target.value })} className="w-full appearance-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all">
                      <option value="">-- Select Service --</option>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Urgency Level</label>
                  <div className="relative">
                    <select value={addForm.urgency} onChange={(e) => setAddForm({ ...addForm, urgency: e.target.value })} className={`w-full appearance-none border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all font-bold uppercase tracking-wider ${addForm.urgency === 'emergency' ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400' :
                      addForm.urgency === 'high' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400' :
                        'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
                      }`}>
                      <option value="normal">Normal</option>
                      <option value="high">High Priority</option>
                      <option value="emergency">Emergency</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scheduling & Tech */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Date *</label>
                  <input required type="date" value={addForm.preferredDate} onChange={(e) => setAddForm({ ...addForm, preferredDate: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Time *</label>
                  <input required type="time" value={addForm.preferredTime} onChange={(e) => setAddForm({ ...addForm, preferredTime: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Technician</label>
                  <div className="relative">
                    <select value={addForm.technicianId} onChange={(e) => setAddForm({ ...addForm, technicianId: e.target.value })} className="w-full appearance-none bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all">
                      <option value="">Unassigned</option>
                      {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Internal Notes</label>
                <textarea rows={3} value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-base/40 focus:bg-white dark:focus:bg-[#0B1221] transition-all resize-none" placeholder="Gate code is 1234..." />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-white/10 mt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors bg-transparent border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5">
                  Cancel
                </button>
                <button type="submit" disabled={savingNew} className="flex items-center gap-2 px-6 py-2.5 bg-brand-base hover:bg-brand-light disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-lg shadow-brand-base/20">
                  {savingNew ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Create Booking"
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
