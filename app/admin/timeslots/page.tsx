"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";

type Technician = {
  id: number;
  name: string | null;
};

type TimeSlot = {
  id: number;
  business_id: string | null;
  technician_id: number | null;
  start_time: string;
  end_time: string;
  status: string | null;
  booking_id: number | null;
  created_at: string;
};

const STATUS_OPTIONS = ["open", "blocked"] as const;

export default function TimeSlotsAdminPage() {
  const {
    currentBusiness,
    loading: businessLoading,
    error: businessError,
  } = useBusiness();

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newTechnicianId, setNewTechnicianId] = useState<string>("");
  const [newStatus, setNewStatus] = useState<string>("open");

  // ---------------------------------------------------------------------------
  // Load technicians + time slots for selected business
  // ---------------------------------------------------------------------------
  const loadData = async () => {
    if (!currentBusiness) {
      setTimeSlots([]);
      setTechnicians([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // fetch technicians for this business
      const { data: techData, error: techErr } = await supabase
        .from("technicians")
        .select("id, name")
        .eq("business_id", currentBusiness.id)
        .eq("active", true)
        .order("name", { ascending: true });

      if (techErr) throw techErr;

      setTechnicians((techData as Technician[]) ?? []);

      // fetch time slots for this business
      const { data: slotData, error: slotErr } = await supabase
        .from("time_slots")
        .select(
          "id, business_id, technician_id, start_time, end_time, status, booking_id, created_at"
        )
        .eq("business_id", currentBusiness.id)
        .order("start_time", { ascending: true });

      if (slotErr) throw slotErr;

      setTimeSlots((slotData as TimeSlot[]) ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load time slots");
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
  // Helpers
  // ---------------------------------------------------------------------------
  function toLocalInputValue(iso: string) {
    if (!iso) return "";
    // convert ISO string to value suitable for datetime-local input
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  function formatDisplay(iso: string) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleString();
  }

  function technicianNameFor(id: number | null) {
    if (!id) return "Unassigned";
    const t = technicians.find((tech) => tech.id === id);
    return t?.name || `Tech #${id}`;
  }

  // ---------------------------------------------------------------------------
  // Create a new time slot
  // ---------------------------------------------------------------------------
  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) {
      setError("No business selected");
      return;
    }
    if (!newStart || !newEnd) {
      setError("Start and end time are required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const startIso = new Date(newStart).toISOString();
      const endIso = new Date(newEnd).toISOString();

      const { error: insertErr } = await supabase.from("time_slots").insert([
        {
          business_id: currentBusiness.id,
          technician_id: newTechnicianId
            ? Number(newTechnicianId)
            : null,
          start_time: startIso,
          end_time: endIso,
          status: newStatus || "open",
        },
      ]);

      if (insertErr) throw insertErr;

      // refresh list
      await loadData();

      // reset form
      setNewStart("");
      setNewEnd("");
      setNewTechnicianId("");
      setNewStatus("open");
    } catch (err) {
      console.error(err);
      setError("Failed to create time slot");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete a slot
  // ---------------------------------------------------------------------------
  const handleDelete = async (slot: TimeSlot) => {
    if (!currentBusiness) return;

    const label = `${formatDisplay(slot.start_time)} – ${formatDisplay(
      slot.end_time
    )}`;
    if (!window.confirm(`Delete time slot:\n${label}?`)) return;

    setSaving(true);
    setError(null);

    try {
      const { error: delErr } = await supabase
        .from("time_slots")
        .delete()
        .eq("id", slot.id)
        .eq("business_id", currentBusiness.id);

      if (delErr) throw delErr;

      await loadData();
    } catch (err) {
      console.error(err);
      setError("Failed to delete time slot");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-white/5 pb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Availability Control</h1>
        <p className="text-slate-400">
          {currentBusiness
            ? `Managing inventory for ${currentBusiness.name}`
            : "Select a business to configure operational windows."}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Provisioning Form */}
        <section className="lg:col-span-4">
          <div className="bg-slate-900/50 rounded-2xl border border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl sticky top-8">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-emerald-500">📅</span>
              Provision Window
            </h2>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="slot-start" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Start Boundary
                </label>
                <input
                  id="slot-start"
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="slot-end" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  End Boundary
                </label>
                <input
                  id="slot-end"
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="slot-tech" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Assignee
                </label>
                <select
                  id="slot-tech"
                  value={newTechnicianId}
                  onChange={(e) => setNewTechnicianId(e.target.value)}
                  className="w-full bg-slate-800/40 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all font-medium appearance-none cursor-pointer"
                >
                  <option value="">Unassigned Pool</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || `Member #${t.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="slot-status" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Initial State
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewStatus(s)}
                      className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all ${newStatus === s
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-slate-800/40 border-slate-700 text-slate-500'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !currentBusiness}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  "Create Interval"
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right: Intervals List */}
        <section className="lg:col-span-8">
          <div className="bg-slate-900/30 rounded-3xl border border-white/5 p-6 backdrop-blur-sm shadow-sm overflow-hidden border-t-4 border-t-emerald-500/20">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              Timeline Overview
              <span className="ml-auto text-xs font-bold text-slate-600 bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5">
                {timeSlots.length} Blocks
              </span>
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium italic">Mapping available windows...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-24 bg-slate-950/20 rounded-3xl border border-dashed border-slate-800">
                <div className="text-5xl mb-4 grayscale opacity-10">⏳</div>
                <h3 className="text-lg font-bold text-slate-400 mb-1">Timeline is clear</h3>
                <p className="text-slate-600 px-10">Define operational windows to populate the calendar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto ring-1 ring-white/5 rounded-2xl shadow-sm">
                <table className="min-w-full divide-y divide-white/5 bg-slate-900/40">
                  <thead className="bg-slate-950/60">
                    <tr>
                      <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Boundary</th>
                      <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Assignment</th>
                      <th scope="col" className="px-6 py-5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">State</th>
                      <th scope="col" className="px-6 py-5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {timeSlots.map((slot) => (
                      <tr key={slot.id} className="group hover:bg-white/5 transition-colors duration-300">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded bg-slate-800 border border-white/5">
                              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white tracking-tight">
                                {formatDisplay(slot.start_time).split(',')[1]}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {formatDisplay(slot.start_time).split(',')[0]}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-white/5 text-[10px] font-bold text-slate-400">
                            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                            {technicianNameFor(slot.technician_id)}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border shadow-sm ${slot.status === 'open'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            }`}>
                            {slot.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => handleDelete(slot)}
                            disabled={saving}
                            className="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-500 hover:text-rose-500 hover:border-rose-500/30 transition-all opacity-0 group-hover:opacity-100"
                            title="Purge Window"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
