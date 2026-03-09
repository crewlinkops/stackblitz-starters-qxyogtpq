"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";

type Technician = {
  id: number;
  business_slug: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  notify_by_email: boolean | null;
  active: boolean | null; // soft delete flag
};

export default function TechniciansAdminPage() {
  const {
    currentBusiness,
    loading: businessLoading,
    error: businessError,
  } = useBusiness();

  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // create/edit form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifyByEmail, setNotifyByEmail] = useState(true);

  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [saving, setSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Load technicians for selected business
  // ---------------------------------------------------------------------------
  const loadTechnicians = async () => {
    if (!currentBusiness) {
      setTechnicians([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from("technicians")
      .select(
        "id, business_slug, name, email, phone, created_at, notify_by_email, active"
      )
      .eq("business_slug", currentBusiness.slug)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading technicians", error);
      setError("Failed to load technicians");
      setLoading(false);
      return;
    }

    const rows = (data as unknown as Technician[]) ?? [];
    // active === null is treated as active for legacy rows
    setTechnicians(rows.filter((t) => t.active !== false));
    setLoading(false);
  };

  useEffect(() => {
    if (businessLoading) return;
    if (businessError) {
      setError(businessError);
      setLoading(false);
      return;
    }
    loadTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness, businessLoading, businessError]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const resetForm = () => {
    setName("");
    setEmail("");
    setPhone("");
    setNotifyByEmail(true);
    setEditingTech(null);
  };

  // ---------------------------------------------------------------------------
  // Create / Update technician
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentBusiness) {
      setError("No business selected");
      return;
    }

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingTech) {
        const { error } = await supabase
          .from("technicians")
          .update({
            name,
            email,
            phone,
            notify_by_email: notifyByEmail,
          })
          .eq("id", editingTech.id)
          .eq("business_slug", currentBusiness.slug);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("technicians").insert([
          {
            business_slug: currentBusiness.slug,
            name,
            email,
            phone,
            notify_by_email: notifyByEmail,
            active: true,
          },
        ]);

        if (error) throw error;
      }

      await loadTechnicians();
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Failed to save technician");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Soft delete (deactivate)
  // ---------------------------------------------------------------------------
  const handleDeactivate = async (tech: Technician) => {
    if (!currentBusiness) return;

    const confirmMsg = `Deactivate technician "${tech.name || "Unnamed"}"?`;
    if (!window.confirm(confirmMsg)) return;

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("technicians")
        .update({ active: false })
        .eq("id", tech.id)
        .eq("business_slug", currentBusiness.slug);

      if (error) throw error;

      await loadTechnicians();
      if (editingTech?.id === tech.id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to deactivate technician");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (tech: Technician) => {
    setEditingTech(tech);
    setName(tech.name || "");
    setEmail(tech.email || "");
    setPhone(tech.phone || "");
    setNotifyByEmail(tech.notify_by_email ?? true);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Technicians</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {currentBusiness
              ? `Team management for ${currentBusiness.name}`
              : "Select a business to start managing your team."}
          </p>
        </div>
        {currentBusiness && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-base/10 border border-brand-base/20 text-brand-base text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 bg-brand-light rounded-full animate-pulse"></span>
            Management Active
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Form Card */}
        <section className="lg:col-span-4">
          <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl sticky top-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              {editingTech ? "Edit Professional" : "Add Technician"}
            </h2>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="tech-name" className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <input
                  id="tech-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-base/40 transition-all font-medium"
                  placeholder="e.g. Robert Fox"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tech-email" className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <input
                  id="tech-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-base/40 transition-all font-medium"
                  placeholder="robert@company.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="tech-phone" className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <input
                  id="tech-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-base/40 transition-all font-medium"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <label className="flex items-center gap-3 group cursor-pointer select-none py-2 px-1">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={notifyByEmail}
                    onChange={(e) => setNotifyByEmail(e.target.checked)}
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${notifyByEmail ? 'bg-brand-base' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                  <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${notifyByEmail ? 'tranzinc-x-5' : 'tranzinc-x-0'}`}></div>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-700 dark:text-slate-300 transition-colors">
                  Enable email notifications
                </span>
              </label>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving || !currentBusiness}
                  className="flex-1 bg-brand-base hover:bg-brand-light text-slate-900 dark:text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-base/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-slate-200 dark:border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    editingTech ? "Update Profile" : "Add Professional"
                  )}
                </button>
                {editingTech && (
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="px-6 py-3.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* Right: Team List */}
        <section className="lg:col-span-8">
          <div className="bg-slate-100/30 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-white/5 p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-brand-base rounded-full"></span>
              Active Professionals
              <span className="ml-auto text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                {technicians.length} Member{technicians.length === 1 ? '' : 's'}
              </span>
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-20 grayscale opacity-50 italic text-slate-500 dark:text-slate-500">
                Refreshing team roster...
              </div>
            ) : technicians.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/20">
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-1">Your team is empty</h3>
                <p className="text-slate-600 px-10">Add professional technicians to start assigning service bookings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {technicians.map((tech) => (
                  <div
                    key={tech.id}
                    className="group relative bg-slate-100/60 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-white/10 p-5 transition-all hover:border-brand-base/40 hover:bg-slate-200/50 dark:bg-slate-800/50 hover:shadow-xl hover:shadow-brand-base/5"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-700 to-teal-700 flex items-center justify-center text-xl font-bold text-slate-900 dark:text-white shadow-lg">
                        {tech.name?.charAt(0) || "?"}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(tech)}
                          className="p-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-brand-base hover:border-brand-base/30 transition-all opacity-0 group-hover:opacity-100"
                          title="Edit Profile"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(tech)}
                          className="p-2.5 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:border-rose-500/30 transition-all opacity-0 group-hover:opacity-100"
                          title="Deactivate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-base transition-colors">
                        {tech.name || "Unnamed Professional"}
                      </h4>
                      <div className="space-y-1.5">
                        {tech.email && (
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-500 uppercase tracking-tighter">
                            {tech.email}
                          </div>
                        )}
                        {tech.phone && (
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-500">
                            {tech.phone}
                          </div>
                        )}
                        <div className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full border ${tech.notify_by_email ? 'bg-brand-base/10 border-brand-base/20 text-brand-base' : 'bg-slate-700/20 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-500'}`}>
                          {tech.notify_by_email ? "Email Ready" : "Notifications Muted"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
