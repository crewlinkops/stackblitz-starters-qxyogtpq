"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";
import { industryTemplates, Industry } from "../../lib/industryTemplates";

type Service = {
  id: number;
  business_id: string | null;
  business_slug: string | null;
  name: string | null;
  description: string | null;
  duration_min: number | null;
};

export default function ServicesAdminPage() {
  const {
    currentBusiness,
    loading: businessLoading,
    error: businessError,
  } = useBusiness();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMin, setDurationMin] = useState<string>("60");
  const [editingService, setEditingService] = useState<Service | null>(null);

  const handleImportTemplates = async () => {
    if (!currentBusiness || !currentBusiness.industry) return;
    const industry = industryTemplates.find(i => i.id === currentBusiness.industry);
    if (!industry) return;

    setSaving(true);
    setError(null);

    try {
      const servicesToInsert = industry.templates.map(t => ({
        business_slug: currentBusiness.slug,
        name: t.name,
        description: t.description,
        duration_min: t.duration_min
      }));

      const { error: svcError } = await supabase.from("services").insert(servicesToInsert);
      if (svcError) throw svcError;

      await loadServices();
    } catch (err) {
      console.error(err);
      setError("Failed to import templates");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Load services for selected business
  // ---------------------------------------------------------------------------
  const loadServices = async () => {
    if (!currentBusiness) {
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("services")
        .select(
          "id, business_slug, name, description, duration_min"
        )
        .eq("business_slug", currentBusiness.slug)
        .order("name", { ascending: true });

      if (error) throw error;

      setServices((data as Service[]) ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load services");
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
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness, businessLoading, businessError]);

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  const resetForm = () => {
    setName("");
    setDescription("");
    setDurationMin("60");
    setEditingService(null);
  };

  // ---------------------------------------------------------------------------
  // Create / Update service
  // ---------------------------------------------------------------------------
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!currentBusiness) {
      setError("No business selected");
      return;
    }

    if (!name.trim()) {
      setError("Service name is required");
      return;
    }

    const dur = Number(durationMin);
    if (Number.isNaN(dur) || dur <= 0) {
      setError("Duration (minutes) must be a positive number");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingService) {
        const { error } = await supabase
          .from("services")
          .update({
            name,
            description,
            duration_min: dur,
          })
          .eq("id", editingService.id)
          .eq("business_slug", currentBusiness.slug);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert([
          {
            business_slug: currentBusiness.slug,
            name,
            description,
            duration_min: dur,
          },
        ]);

        if (error) throw error;
      }

      await loadServices();
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Failed to save service");
    } finally {
      setSaving(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Delete service
  // ---------------------------------------------------------------------------
  const handleDelete = async (service: Service) => {
    if (!currentBusiness) return;

    const label = service.name || `Service #${service.id}`;
    if (
      !window.confirm(
        `Delete service "${label}"?\n\n(This will not delete existing bookings, but they may reference an unknown service.)`
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("services")
        .delete()
        .eq("id", service.id)
        .eq("business_slug", currentBusiness.slug);

      if (error) throw error;

      await loadServices();
      if (editingService?.id === service.id) {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete service");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name || "");
    setDescription(service.description || "");
    setDurationMin(
      service.duration_min != null ? String(service.duration_min) : "60"
    );
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Service Catalog</h1>
          <p className="text-slate-600 dark:text-slate-400">
            {currentBusiness
              ? `Offerings for ${currentBusiness.name}`
              : "Select a business to manage its service offerings."}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Form Card */}
        <section className="lg:col-span-4">
          <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl sticky top-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              {editingService ? "Edit Service" : "Define New Service"}
            </h2>

            {error && (
              <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="svc-name" className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Service Name
                </label>
                <input
                  id="svc-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-base/40 transition-all font-medium"
                  placeholder="e.g. Premium Consultation"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="svc-description" className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Brief Description
                </label>
                <textarea
                  id="svc-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-base/40 transition-all font-medium resize-none"
                  placeholder="What does this service include?"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="svc-duration" className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Duration (Minutes)
                </label>
                <div className="relative">
                  <input
                    id="svc-duration"
                    type="number"
                    min={1}
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    className="w-full bg-slate-200/40 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-base/40 transition-all font-medium pl-12"
                  />
                  <div className="absolute left-4 top-1/2 -tranzinc-y-1/2 text-slate-500 dark:text-slate-500 font-bold text-xs uppercase">Min</div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={saving || !currentBusiness}
                  className="flex-1 bg-brand-base hover:bg-brand-light text-slate-900 dark:text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-base/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-slate-200 dark:border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    editingService ? "Update Service" : "Launch Service"
                  )}
                </button>
                {editingService && (
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

        {/* Right: Services List */}
        <section className="lg:col-span-8">
          <div className="bg-slate-100/30 dark:bg-slate-900/30 rounded-2xl border border-slate-200 dark:border-white/5 p-6 backdrop-blur-sm overflow-hidden">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-brand-base rounded-full"></span>
              Current Offerings
              <span className="ml-auto text-xs font-bold text-slate-600 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/5">
                {services.length} Total
              </span>
            </h2>

            {loading ? (
              <div className="flex items-center justify-center py-20 grayscale opacity-50 italic text-slate-500 dark:text-slate-500">
                Synchronizing catalog...
              </div>
            ) : services.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/20">
                <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400 mb-1">Catalog is empty</h3>
                <p className="text-slate-600 px-10 mb-8">Define your first service to start accepting bookings.</p>

                {currentBusiness?.industry && (
                  <div className="max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="h-px bg-white/5 w-full"></div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recommended for {currentBusiness.industry}</p>
                    <button
                      onClick={handleImportTemplates}
                      disabled={saving}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl border border-white/5 transition-all flex items-center justify-center gap-2"
                    >
                      {saving ? "Importing..." : `Import ${industryTemplates.find(i => i.id === currentBusiness.industry)?.templates.length} Standard Services`}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto ring-1 ring-white/5 rounded-2xl shadow-sm">
                <table className="min-w-full divide-y divide-white/5 bg-slate-100/40 dark:bg-slate-900/40">
                  <thead className="bg-slate-100 dark:bg-slate-950/40">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em]">Service</th>
                      <th scope="col" className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] hidden sm:table-cell">Duration</th>
                      <th scope="col" className="px-6 py-4 text-right text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em]">Manage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {services.map((svc) => (
                      <tr key={svc.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-brand-base transition-colors">
                              {svc.name || "Unnamed Service"}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-500 line-clamp-1 max-w-xs">{svc.description || "No description provided."}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 hidden sm:table-cell">
                          <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                            {svc.duration_min} MIN
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right space-x-2 whitespace-nowrap">
                          <button
                            onClick={() => startEdit(svc)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-white/10 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(svc)}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-slate-900 dark:text-white transition-all"
                          >
                            Delete
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
