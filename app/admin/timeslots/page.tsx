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
    <main style={{ display: "flex", gap: 32 }}>
      {/* Left: form */}
      <section style={{ flex: "0 0 360px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Time Slots
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
          {currentBusiness
            ? `Managing availability for: ${currentBusiness.name}`
            : "Select a business in the sidebar to manage time slots."}
        </p>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 10px",
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              fontSize: 13,
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        <form
          onSubmit={handleCreate}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: 16,
            borderRadius: 8,
            border: "1px solid #374151",
            backgroundColor: "#020617",
          }}
        >
          <div>
            <label
              htmlFor="slot-start"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Start time
            </label>
            <input
              id="slot-start"
              type="datetime-local"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #4b5563",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="slot-end"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              End time
            </label>
            <input
              id="slot-end"
              type="datetime-local"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #4b5563",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="slot-tech"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Technician (optional)
            </label>
            <select
              id="slot-tech"
              value={newTechnicianId}
              onChange={(e) => setNewTechnicianId(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #4b5563",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
              }}
            >
              <option value="">Unassigned</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || `Technician #${t.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="slot-status"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Status
            </label>
            <select
              id="slot-status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #4b5563",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={saving || !currentBusiness}
            style={{
              marginTop: 8,
              padding: "6px 12px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#22c55e",
              color: "#020617",
              fontSize: 13,
              cursor: saving || !currentBusiness ? "default" : "pointer",
              opacity: saving || !currentBusiness ? 0.7 : 1,
            }}
          >
            Create time slot
          </button>
        </form>
      </section>

      {/* Right: list */}
      <section style={{ flex: 1 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Existing time slots
        </h2>

        {loading ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading time slots…</p>
        ) : timeSlots.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            No time slots found for this business.
          </p>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Start
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  End
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Technician
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id}>
                  <td style={{ padding: "6px 8px" }}>
                    {formatDisplay(slot.start_time)}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {formatDisplay(slot.end_time)}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {technicianNameFor(slot.technician_id)}
                  </td>
                  <td style={{ padding: "6px 8px" }}>{slot.status}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(slot)}
                      disabled={saving}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#ef4444",
                        color: "#f9fafb",
                        cursor: saving ? "default" : "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
