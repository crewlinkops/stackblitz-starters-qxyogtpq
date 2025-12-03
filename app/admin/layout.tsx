"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BusinessProvider } from "./BusinessContext";
import { BusinessSelector } from "./BusinessSelector";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/timeslots", label: "Timeslots" },
    { href: "/admin/technicians", label: "Technicians" },
    { href: "/admin/scheduling", label: "Scheduling" },
  ];

  return (
    <BusinessProvider>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          minHeight: "100vh",
          backgroundColor: "rgb(var(--background-rgb))",
          color: "rgb(var(--foreground-rgb))",
        }}
      >
        {/* Sidebar */}
        <aside
          style={{
            borderRight: "1px solid rgba(148, 163, 184, 0.25)",
            padding: "16px 16px 24px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>Crewlink Admin</div>
            <div
              style={{
                fontSize: 12,
                color: "#6b7280",
                marginTop: 4,
              }}
            >
              Internal maintenance console
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontSize: 14,
                    backgroundColor: active ? "#111827" : "transparent",
                    color: active ? "#f9fafb" : "#e5e7eb",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Top bar */}
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 24px",
              borderBottom: "1px solid rgba(148, 163, 184, 0.25)",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 600 }}>Admin Panel</div>
            <BusinessSelector />
          </header>

          {/* Page body */}
          <main style={{ padding: "24px" }}>{children}</main>
        </div>
      </div>
    </BusinessProvider>
  );
}
