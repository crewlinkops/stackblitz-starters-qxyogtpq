"use client";

import * as React from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-full h-12 bg-slate-100 dark:bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl"></div>;
    }

    return (
        <div className="flex bg-slate-100 dark:bg-slate-100 dark:bg-slate-950/50 p-1 rounded-xl border border-slate-200 dark:border-slate-200 dark:border-slate-800">
            <button
                onClick={() => setTheme("light")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${theme === "light"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-600 dark:text-slate-400 dark:hover:text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-200/50 dark:bg-slate-800/50"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                Light
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${theme === "dark"
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-slate-700"
                        : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-600 dark:text-slate-400 dark:hover:text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-200/50 dark:bg-slate-800/50"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                Dark
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${theme === "system"
                        ? "bg-red-50 text-emerald-700 dark:bg-slate-200 dark:bg-slate-800 dark:text-brand-base shadow-sm border border-emerald-200 dark:border-brand-base/30"
                        : "text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:text-slate-600 dark:text-slate-400 dark:hover:text-slate-800 dark:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-200/50 dark:bg-slate-800/50"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                System
            </button>
        </div>
    );
}
