"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useBusiness } from "../BusinessContext";

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
          "id, business_id, business_slug, name, description, duration_min"
        )
        .eq("business_id", currentBusiness.id)
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
          .eq("business_id", currentBusiness.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert([
          {
            business_id: currentBusiness.id,
            business_slug: currentBusiness.slug ?? null,
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
        .eq("business_id", currentBusiness.id);

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
    <main style={{ display: "flex", gap: 32 }}>
      {/* Left: form */}
      <section style={{ flex: "0 0 360px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
          Services
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
          {currentBusiness
            ? `Services offered by: ${currentBusiness.name}`
            : "Select a business in the sidebar to manage services."}
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
              htmlFor="svc-name"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Service name
            </label>
            <input
              id="svc-name"
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
              htmlFor="svc-description"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Description
            </label>
            <textarea
              id="svc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: "100%",
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #4b5563",
                backgroundColor: "#020617",
                color: "#e5e7eb",
                fontSize: 13,
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="svc-duration"
              style={{ display: "block", fontSize: 13, marginBottom: 4 }}
            >
              Duration (minutes)
            </label>
            <input
              id="svc-duration"
              type="number"
              min={1}
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
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
              {editingService ? "Save changes" : "Add service"}
            </button>
            {editingService && (
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
          Existing services
        </h2>

        {loading ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Loading services…</p>
        ) : services.length === 0 ? (
          <p style={{ fontSize: 13, color: "#9ca3af" }}>
            No services found for this business.
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
                  Name
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "6px 8px",
                    borderBottom: "1px solid #374151",
                  }}
                >
                  Duration
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
              {services.map((svc) => (
                <tr key={svc.id}>
                  <td style={{ padding: "6px 8px" }}>{svc.name || "—"}</td>
                  <td style={{ padding: "6px 8px", maxWidth: 400 }}>
                    {svc.description || "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    {svc.duration_min != null ? `${svc.duration_min} min` : "—"}
                  </td>
                  <td style={{ padding: "6px 8px" }}>
                    <button
                      type="button"
                      onClick={() => startEdit(svc)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #4b5563",
                        backgroundColor: "transparent",
                        color: "#e5e7eb",
                        fontSize: 12,
                        cursor: "pointer",
                        marginRight: 8,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(svc)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#ef4444",
                        color: "#f9fafb",
                        fontSize: 12,
                        cursor: "pointer",
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
