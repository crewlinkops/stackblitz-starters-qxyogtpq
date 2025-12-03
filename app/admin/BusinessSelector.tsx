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
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#6b7280" }}>Business:</span>
      <select
        value={currentBusiness?.id ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          const selected = businesses.find((b) => b.id === id) || null;
          setCurrentBusiness(selected);
        }}
        style={{
          padding: "4px 8px",
          borderRadius: 6,
          border: "1px solid #d1d5db",
          fontSize: 12,
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
