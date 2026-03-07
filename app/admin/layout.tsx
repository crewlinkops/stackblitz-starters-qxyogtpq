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
      <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 selection:bg-red-600/30">
        <OnboardingWizard />
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-200 dark:border-white/5 flex flex-col fixed inset-y-0 bg-zinc-100/40 dark:bg-zinc-900/40 backdrop-blur-xl">
          <div className="p-6 border-b border-zinc-200 dark:border-white/5">
            <Link href="/admin" className="group flex items-center gap-3">
              <div className="w-8 h-8 bg-red-700 rounded-lg flex items-center justify-center font-bold text-zinc-900 dark:text-white shadow-lg shadow-red-700/20 group-hover:scale-110 transition-transform">
                C
              </div>
              <div>
                <div className="font-bold text-zinc-900 dark:text-white leading-none mb-1">Crewlink</div>
                <div className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">Administrator</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-6 overflow-y-auto mt-4 pb-4">
            <div className="px-4">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:text-white hover:bg-white/5 transition-all border border-transparent hover:border-zinc-200 dark:border-white/5 group"
              >
                <span className="group-hover:-tranzinc-x-1 transition-transform">←</span>
                <span>Public Site</span>
              </Link>
            </div>

            {navigationGroups.map((group) => (
              <div key={group.title} className="px-4">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3 px-4">{group.title}</div>
                <div className="space-y-1">
                  {group.links.map((link) => {
                    const active = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${active
                          ? "bg-red-700/10 text-red-500 border border-red-600/20 shadow-lg shadow-red-600/5"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-white/5 border border-transparent"
                          }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full transition-all ${active ? 'bg-red-500 scale-100' : 'bg-zinc-600 scale-0 group-hover:scale-100'}`}></span>
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-zinc-200 dark:border-white/5 space-y-2">
            <Link
              href={settingsLink.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${pathname === settingsLink.href
                ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 shadow-lg border-zinc-200 dark:border-white/10"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-white/5 border border-transparent"
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {settingsLink.label}
            </Link>
            <div className="bg-zinc-100 dark:bg-zinc-950/50 rounded-2xl p-4 border border-zinc-200 dark:border-white/5">
              <AdminAuth />
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 pl-64 flex flex-col">
          {/* Top Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-zinc-100 dark:bg-zinc-950/60 backdrop-blur-xl border-b border-zinc-200 dark:border-white/5">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-zinc-600 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-full border border-zinc-200 dark:border-white/5">Console</span>
              <div className="h-4 w-px bg-white/10"></div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                {allLinks.find(l => l.href === pathname)?.label || "Dashboard"}
              </h2>
            </div>

            <div className="flex items-center gap-6">
              <BusinessSelector />
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-white/10 flex items-center justify-center text-xs text-zinc-600 dark:text-zinc-400">
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
