import { statCardStyle } from "../lib/styles";

interface StatCardProps {
  label: string;
  value: number | string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div style={statCardStyle}>
      <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "22px", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
