import type { CSSProperties } from "react";

export const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #ddd",
};

export const tdStyle: CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #eee",
};

export const errorBoxStyle: CSSProperties = {
  padding: "12px 16px",
  marginBottom: "16px",
  borderRadius: "4px",
  border: "1px solid #e57373",
  background: "#ffebee",
  color: "#b71c1c",
  fontSize: "14px",
};

export const statCardContainerStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
  marginBottom: "32px",
};

export const statCardStyle: CSSProperties = {
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #ddd",
  background: "#fafafa",
};

export const sectionStyle: CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "16px",
};

export const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "14px",
};

export const loadingTextStyle: CSSProperties = {
  color: "#777",
  fontSize: "14px",
};
