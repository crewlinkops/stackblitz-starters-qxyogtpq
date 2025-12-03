"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";

type Technician = {
  id: number;
  business_id: string | null;
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
        "id, business_id, name, email, phone, created_at, notify_by_email, active"
      )
      .eq("business_id", currentBusiness.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading technicians", error);
      setError("Failed to load technicians");
      setLoading(false);
      return;
    }

    const rows = (data as Technician[]) ?? [];
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
          .eq("business_id", currentBusiness.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("technicians").insert([
          {
            business_id: currentBusiness.id,
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
        .eq("business_id", currentBusiness.id);

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
    <main style={{ display: "flex", gap: 32 }}>
      {/* Left: form */}
      <section style={{ flex: "0 0 320px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Technicians
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
          {currentBusiness
            ? `Managing technicians for: ${currentBusiness.name}`
            : "Select a business in the sidebar to manage technicians."}
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
          onSubmit={handleSubmit}
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
              htmlFor="tech-name"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Name
            </label>
            <input
              id="tech-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              htmlFor="tech-email"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Email
            </label>
            <input
              id="tech-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              htmlFor="tech-phone"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Phone
            </label>
            <input
              id="tech-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
            }}
          >
            <input
              type="checkbox"
              checked={notifyByEmail}
              onChange={(e) => setNotifyByEmail(e.target.checked)}
            />
            Notify this technician by email
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              type="submit"
              disabled={saving || !currentBusiness}
              style={{
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
              {editingTech ? "Save changes" : "Add technician"}
            </button>
            {editingTech && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #4b5563",
                  backgroundColor: "transparent",
                  color: "#e5e7eb",
                  fontSize: 13,
                  cursor: saving ? "default" : "pointer",
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Right: list */}
      <section style={{ flex: 1 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
          Active technicians
        </h2>

        {loading ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading technicians…</p>
        ) : technicians.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            No technicians found for this business.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {technicians.map((tech) => (
              <div
                key={tech.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #374151",
                  backgroundColor: "#020617",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {tech.name || "Unnamed technician"}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      color: "#9ca3af",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {tech.email && <span>{tech.email}</span>}
                    {tech.phone && <span>{tech.phone}</span>}
                    <span>
                      Email notifications:{" "}
                      {tech.notify_by_email ? "On" : "Off"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => startEdit(tech)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "1px solid #4b5563",
                      backgroundColor: "transparent",
                      color: "#e5e7eb",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeactivate(tech)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#ef4444",
                      color: "white",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
