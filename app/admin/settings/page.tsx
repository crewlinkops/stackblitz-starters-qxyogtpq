"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { ThemeToggle } from "../../components/ThemeToggle";

import { useBusiness } from "../BusinessContext";

type Scheduling = {
  id: number;
  business_slug: string;
  work_start: string;
  work_end: string;
  lunch_start: string | null;
  lunch_end: string | null;
  slot_duration_min: number;
  buffer_min: number;
};

export default function SchedulingAdminPage() {
  const { currentBusiness, loading: bizLoading } = useBusiness();

  const [record, setRecord] = useState<Scheduling | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loadSettings = async () => {
    if (!currentBusiness?.slug) return;

    setError(null);
    setMessage(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("business_scheduling")
      .select("*")
      .eq("business_slug", currentBusiness.slug)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error(error);
      setError("Failed to load settings: " + error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      // no settings yet; create default in state
      setRecord({
        id: 0,
        business_slug: currentBusiness.slug,
        work_start: "09:00:00",
        work_end: "17:00:00",
        lunch_start: "12:00:00",
        lunch_end: "13:00:00",
        slot_duration_min: 60,
        buffer_min: 0,
      });
    } else {
      setRecord(data as Scheduling);
    }

    setLoading(false);
    checkGoogleConnection(currentBusiness.slug);
  };

  const checkGoogleConnection = async (slug: string) => {
    const { data } = await supabase
      .from("google_tokens")
      .select("business_slug")
      .eq("business_slug", slug)
      .maybeSingle();

    setGoogleConnected(!!data);
    if (data) {
      loadGoogleEvents(slug);
    } else {
      setGoogleEvents([]);
    }
  };

  const loadGoogleEvents = async (slug: string) => {
    setGoogleLoading(true);
    try {
      const resp = await fetch(`/api/google-calendar/events?slug=${slug}`);
      const data = await resp.json();
      if (data.events) {
        setGoogleEvents(data.events);
      }
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentBusiness?.slug) return;
    const confirmed = window.confirm("Disconnect Google Calendar? Future bookings will no longer sync and existing tokens will be deleted.");
    if (!confirmed) return;

    setGoogleLoading(true);
    const { error } = await supabase
      .from("google_tokens")
      .delete()
      .eq("business_slug", currentBusiness.slug);

    if (error) {
      setError("Failed to disconnect: " + error.message);
    } else {
      setGoogleConnected(false);
      setGoogleEvents([]);
      setMessage("Google Calendar disconnected.");
    }
    setGoogleLoading(false);
  };

  useEffect(() => {
    if (bizLoading) return;
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBusiness?.slug, bizLoading]);

  const handleChange = (field: keyof Scheduling, value: any) => {
    if (!record) return;
    setRecord({ ...record, [field]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !currentBusiness?.slug) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      business_slug: currentBusiness.slug,
      work_start: record.work_start,
      work_end: record.work_end,
      lunch_start: record.lunch_start || null,
      lunch_end: record.lunch_end || null,
      slot_duration_min: record.slot_duration_min,
      buffer_min: record.buffer_min,
    };

    let result;
    if (record.id === 0) {
      // insert new
      result = await supabase
        .from("business_scheduling")
        .insert(payload)
        .select()
        .single();
    } else {
      // update
      result = await supabase
        .from("business_scheduling")
        .update(payload)
        .eq("id", record.id)
        .select()
        .single();
    }

    const { data, error } = result;

    if (error) {
      console.error(error);
      setError("Failed to save settings: " + error.message);
      setSaving(false);
      return;
    }

    setRecord(data as Scheduling);
    setMessage("Settings saved.");
    setSaving(false);
  };

  const toTimeInput = (t: string | null) => {
    if (!t) return "";
    // assume format "HH:MM:SS" or "HH:MM"
    return t.slice(0, 5);
  };

  const fromTimeInput = (t: string) =>
    t ? (t.length === 5 ? t + ":00" : t) : null;

  if (bizLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-zinc-500 font-bold uppercase tracking-widest text-sm italic">
          Loading business settings...
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <header className="mb-10 text-center sm:text-left border-b border-zinc-200 dark:border-white/5 pb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Scheduling Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-lg">
          Configure <span className="text-red-600 font-bold">{currentBusiness?.name}</span>&apos;s business hours and sync with external calendars.
        </p>
      </header>

      {/* Google Calendar Integration Card */}
      <section className="mb-10">
        <div className="relative group">
          <div className="relative bg-zinc-100/80 dark:bg-zinc-900/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl border border-zinc-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-red-600/10 rounded-lg">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </div>
                  Google Calendar
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                  {googleConnected
                    ? "Your Crewlink bookings are automatically synced to Gmail."
                    : "Connect your Google Calendar to sync bookings as events."}
                </p>
              </div>

              {googleConnected ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  Connected
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!currentBusiness?.slug) return;
                    window.location.href = `/api/google-calendar/auth?slug=${currentBusiness.slug}`;
                  }}
                  disabled={!currentBusiness}
                  className="flex items-center gap-2 px-6 py-3 bg-red-700 hover:bg-red-600 text-zinc-900 dark:text-white font-bold rounded-xl shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 18 18" fill="currentColor">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
                    <path d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.45.345 2.817.957 4.044l3.007-2.332z" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956L3.964 7.288c.708-2.127 2.692-3.71 5.036-3.71z" />
                  </svg>
                  Sync Calendar
                </button>
              )}
            </div>

            {googleConnected && (
              <div className="bg-zinc-100 dark:bg-zinc-950/50 rounded-xl border border-zinc-200 dark:border-white/5 p-4 sm:p-6 overflow-hidden">
                <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-4">Upcoming Schedule</h3>
                {googleLoading ? (
                  <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400 text-sm animate-pulse">
                    <div className="w-4 h-4 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
                    Refreshing events...
                  </div>
                ) : googleEvents.length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-500 text-sm italic py-4 text-center">No upcoming events found.</p>
                ) : (
                  <div className="space-y-3">
                    {googleEvents.slice(0, 5).map((ev: any) => (
                      <div key={ev.id} className="flex items-center justify-between p-3 bg-zinc-200/40 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-white/5">
                        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate pr-4">{ev.summary}</span>
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-500 whitespace-nowrap bg-zinc-100/80 dark:bg-zinc-900/80 px-2 py-1 rounded border border-zinc-200 dark:border-white/5">
                          {new Date(ev.start.dateTime || ev.start.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleDisconnect}
                  className="mt-6 text-[10px] font-bold text-rose-500/60 uppercase tracking-widest hover:text-rose-400 transition-colors"
                >
                  Disconnect Integration
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Appearance Settings Card */}
      <section className="mb-10">
        <div className="bg-zinc-100/40 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-white/5 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-zinc-200 dark:bg-zinc-800 rounded-lg">
                  <svg className="w-5 h-5 text-zinc-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                </div>
                Appearance
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Customize the visual theme of your dashboard.
              </p>
            </div>

            <div className="w-full sm:w-auto">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </section>

      {/* Main Settings Form */}
      <section className="space-y-8">
        {(error || message) && (
          <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 ${error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-600/10 border-red-600/20 text-red-500"
            }`}>
            <div className="flex items-center gap-3 font-medium text-sm italic">
              <span>{error ? "⚠️" : "✅"}</span>
              <p>{error || message}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-zinc-500 dark:text-zinc-500 animate-pulse font-medium italic">
            Synchronizing profile settings...
          </div>
        ) : record && (
          <form onSubmit={handleSave} className="bg-zinc-100/30 dark:bg-zinc-900/30 rounded-3xl border border-zinc-200 dark:border-white/5 p-6 sm:p-10 space-y-10 shadow-sm backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Core Hours */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest pl-1">Operation Hours</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest ml-1">Work Start</label>
                    <input
                      type="time"
                      className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 transition-all font-medium"
                      value={toTimeInput(record.work_start)}
                      onChange={(e) => handleChange("work_start", fromTimeInput(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest ml-1">Work End</label>
                    <input
                      type="time"
                      className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 transition-all font-medium"
                      value={toTimeInput(record.work_end)}
                      onChange={(e) => handleChange("work_end", fromTimeInput(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Break Times */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">Break Times</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest ml-1">Lunch Start</label>
                    <input
                      type="time"
                      className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500/30 transition-all font-medium"
                      value={toTimeInput(record.lunch_start)}
                      onChange={(e) => handleChange("lunch_start", fromTimeInput(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest ml-1">Lunch End</label>
                    <input
                      type="time"
                      className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500/30 transition-all font-medium"
                      value={toTimeInput(record.lunch_end)}
                      onChange={(e) => handleChange("lunch_end", fromTimeInput(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Durations */}
            <div className="pt-8 border-t border-zinc-200 dark:border-white/5">
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-widest pl-1 mb-6">Booking Intervals</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest ml-1">Slot Duration (Min)</label>
                  <input
                    type="number"
                    className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 transition-all font-medium"
                    value={record.slot_duration_min}
                    onChange={(e) => handleChange("slot_duration_min", Number(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest ml-1">Buffer Time (Min)</label>
                  <input
                    type="number"
                    className="w-full bg-zinc-100 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-600/30 transition-all font-medium"
                    value={record.buffer_min}
                    onChange={(e) => handleChange("buffer_min", Number(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-5 rounded-2xl shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin"></div>
              ) : (
                "Save Preferences"
              )}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
