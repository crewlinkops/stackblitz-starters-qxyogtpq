"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BusinessProvider } from "./BusinessContext";
import { BusinessSelector } from "./BusinessSelector";
import { AdminAuth } from "../components/AdminAuth";

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
    { href: "/admin/outreach", label: "Outreach" },
  ];

  return (
    <BusinessProvider>
      <div className="flex min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/5 flex flex-col fixed inset-y-0 bg-slate-900/40 backdrop-blur-xl">
          <div className="p-6 border-b border-white/5">
            <Link href="/admin" className="group flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                C
              </div>
              <div>
                <div className="font-bold text-white leading-none mb-1">Crewlink</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Administrator</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-4">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all mb-4 border border-transparent hover:border-white/5 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>Public Site</span>
            </Link>

            <div className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] px-4 mb-4">Navigation</div>

            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${active
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
                    }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-all ${active ? 'bg-blue-400 scale-100' : 'bg-slate-600 scale-0 group-hover:scale-100'}`}></span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-white/5">
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-white/5">
              <AdminAuth />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 pl-64 flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-slate-950/60 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-white/5">Console</span>
              <div className="h-4 w-px bg-white/10"></div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {links.find(l => l.href === pathname)?.label || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-6">
              <BusinessSelector />
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
            </div>
          </header>

          {/* Page Body */}
          <main className="flex-1 p-8 animate-in fade-in duration-500">
            {children}
          </main>
        </div>
      </div>
    </BusinessProvider>
  );
}
