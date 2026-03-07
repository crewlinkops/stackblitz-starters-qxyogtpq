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
        return <div className="w-full h-12 bg-zinc-100 dark:bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded-xl"></div>;
    }

    return (
        <div className="flex bg-zinc-100 dark:bg-zinc-100 dark:bg-zinc-950/50 p-1 rounded-xl border border-zinc-200 dark:border-zinc-200 dark:border-zinc-800">
            <button
                onClick={() => setTheme("light")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${theme === "light"
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-200/50 dark:bg-zinc-800/50"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                Light
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${theme === "dark"
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-300 dark:border-zinc-700"
                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-200/50 dark:bg-zinc-800/50"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                Dark
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${theme === "system"
                        ? "bg-red-50 text-emerald-700 dark:bg-zinc-200 dark:bg-zinc-800 dark:text-red-500 shadow-sm border border-emerald-200 dark:border-red-600/30"
                        : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-200/50 dark:bg-zinc-800/50"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                System
            </button>
        </div>
    );
}
