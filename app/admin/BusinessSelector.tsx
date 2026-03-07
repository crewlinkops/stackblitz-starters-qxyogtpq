"use client";

import { useBusiness } from "./BusinessContext";

export function BusinessSelector() {
  const {
    businesses,
    currentBusiness,
    setCurrentBusiness,
    loading,
    error,
  } = useBusiness();

  if (loading) {
    return <span style={{ fontSize: 12, color: "#6b7280" }}>Loading…</span>;
  }

  if (error) {
    return (
      <span style={{ fontSize: 12, color: "#ef4444" }}>
        {error} – try refreshing
      </span>
    );
  }

  if (!businesses.length) {
    return (
      <span style={{ fontSize: 12, color: "#6b7280" }}>
        No businesses found
      </span>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: "14px", color: "#9ca3af", fontWeight: 500 }}>Business:</span>
      <select
        value={currentBusiness?.id ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          const selected = businesses.find((b) => b.id === id) || null;
          setCurrentBusiness(selected);
        }}
        style={{
          padding: "6px 10px",
          borderRadius: 6,
          border: "1px solid rgba(148, 163, 184, 0.3)",
          backgroundColor: "rgba(15, 23, 42, 0.8)",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
          outline: "none"
        }}
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
