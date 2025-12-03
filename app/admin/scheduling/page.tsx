"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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
  const [businessSlug, setBusinessSlug] = useState("test-plumber");

  const [record, setRecord] = useState<Scheduling | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    if (!businessSlug.trim()) {
      setError("Enter a business slug first.");
      return;
    }
    setError(null);
    setMessage(null);
    setLoading(true);

    const { data, error } = await supabase
      .from("business_scheduling")
      .select("*")
      .eq("business_slug", businessSlug.trim())
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
        business_slug: businessSlug.trim(),
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
  };

  useEffect(() => {
    // auto-load for default business
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field: keyof Scheduling, value: any) => {
    if (!record) return;
    setRecord({ ...record, [field]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      business_slug: record.business_slug.trim(),
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

  return (
    <main
      style={{
        maxWidth: "700px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "sans-serif",
      }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "16px" }}>
        Admin – Scheduling Settings
      </h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "16px",
        }}
      >
        <label>
          Business slug:&nbsp;
          <input
            value={businessSlug}
            onChange={(e) => setBusinessSlug(e.target.value)}
            style={{ padding: "4px 8px" }}
          />
        </label>
        <button
          type="button"
          onClick={loadSettings}
          style={{ marginLeft: "8px", padding: "4px 10px", cursor: "pointer" }}
        >
          Load
        </button>
      </section>

      {loading && <p>Loading settings…</p>}

      {!loading && record && (
        <form
          onSubmit={handleSave}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px",
            display: "grid",
            gap: "10px",
          }}
        >
          <label>
            Business slug:
            <br />
            <input
              style={{ width: "100%", padding: "6px" }}
              value={record.business_slug}
              onChange={(e) =>
                handleChange("business_slug", e.target.value)
              }
            />
          </label>

          <label>
            Work day start (HH:MM):
            <br />
            <input
              type="time"
              style={{ width: "100%", padding: "6px" }}
              value={toTimeInput(record.work_start)}
              onChange={(e) =>
                handleChange("work_start", fromTimeInput(e.target.value))
              }
            />
          </label>

          <label>
            Work day end (HH:MM):
            <br />
            <input
              type="time"
              style={{ width: "100%", padding: "6px" }}
              value={toTimeInput(record.work_end)}
              onChange={(e) =>
                handleChange("work_end", fromTimeInput(e.target.value))
              }
            />
          </label>

          <label>
            Lunch start (HH:MM, optional):
            <br />
            <input
              type="time"
              style={{ width: "100%", padding: "6px" }}
              value={toTimeInput(record.lunch_start)}
              onChange={(e) =>
                handleChange("lunch_start", fromTimeInput(e.target.value))
              }
            />
          </label>

          <label>
            Lunch end (HH:MM, optional):
            <br />
            <input
              type="time"
              style={{ width: "100%", padding: "6px" }}
              value={toTimeInput(record.lunch_end)}
              onChange={(e) =>
                handleChange("lunch_end", fromTimeInput(e.target.value))
              }
            />
          </label>

          <label>
            Slot duration (minutes):
            <br />
            <input
              type="number"
              style={{ width: "100%", padding: "6px" }}
              value={record.slot_duration_min}
              onChange={(e) =>
                handleChange("slot_duration_min", Number(e.target.value) || 0)
              }
            />
          </label>

          <label>
            Buffer between slots (minutes):
            <br />
            <input
              type="number"
              style={{ width: "100%", padding: "6px" }}
              value={record.buffer_min}
              onChange={(e) =>
                handleChange("buffer_min", Number(e.target.value) || 0)
              }
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "8px 12px",
              marginTop: "8px",
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </form>
      )}
    </main>
  );
}
