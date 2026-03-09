"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BusinessProvider } from "./BusinessContext";
import { BusinessSelector } from "./BusinessSelector";
import { AdminAuth } from "../components/AdminAuth";
import { OnboardingWizard } from "./OnboardingWizard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigationGroups = [
    {
      title: "Operations",
      links: [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/calendar", label: "Calendar" },
        { href: "/admin/bookings", label: "Bookings" },
      ]
    },
    {
      title: "Management",
      links: [
        { href: "/admin/services", label: "Services" },
        { href: "/admin/technicians", label: "Team" },
        { href: "/admin/outreach", label: "Outreach" },
      ]
    }
  ];

  const settingsLink = { href: "/admin/settings", label: "Settings" };
  const allLinks = [...navigationGroups.flatMap(g => g.links), settingsLink];

  return (
    <BusinessProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#060B19] text-slate-800 dark:text-slate-200 selection:bg-brand-base/30">
        <OnboardingWizard />
        {/* Sidebar */}
        <aside className="w-64 border-r border-slate-200 dark:border-white/5 flex flex-col fixed inset-y-0 bg-white/40 dark:bg-[#0B1221]/60 backdrop-blur-2xl">
          <div className="p-6 border-b border-slate-200 dark:border-white/5">
            <Link href="/admin" className="group flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-base to-brand-light rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-brand-base/20 group-hover:scale-110 transition-transform">
                C
              </div>
              <div>
                <div className="font-bold text-slate-900 dark:text-white leading-none mb-1">Crewlink</div>
                <div className="text-[10px] font-bold text-brand-base dark:text-brand-light uppercase tracking-widest">Administrator</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto mt-4 pb-4">
            <div className="px-4">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-all border border-transparent group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span>Public Site</span>
              </Link>
            </div>

            {navigationGroups.map((group) => (
              <div key={group.title} className="px-4">
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 px-4">{group.title}</div>
                <div className="space-y-1">
                  {group.links.map((link) => {
                    const active = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group ${active
                          ? "bg-brand-base/10 text-brand-base dark:text-brand-light border border-brand-base/20 shadow-inner"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${active ? 'bg-brand-base scale-100' : 'bg-slate-400 scale-0 group-hover:scale-100'}`}></span>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200 dark:border-white/5 space-y-2">
            <Link
              href={settingsLink.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${pathname === settingsLink.href
                ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {settingsLink.label}
            </Link>
            <div className="bg-slate-100 dark:bg-[#0B1221] rounded-2xl p-4 border border-slate-200 dark:border-white/5 shadow-inner">
              <AdminAuth />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 pl-64 flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-white/60 dark:bg-[#060B19]/80 backdrop-blur-3xl border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-white/5 shadow-sm">Console</span>
              <div className="h-4 w-px bg-slate-300 dark:bg-white/10"></div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {allLinks.find(l => l.href === pathname)?.label || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-6">
              <BusinessSelector />
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs text-slate-500 shadow-inner">
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
