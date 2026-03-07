"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

export function AdminAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + "/admin",
            },
        });
        if (error) console.error("Login error:", error.message);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    if (loading) {
        return <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Checking auth...</div>;
    }

    if (user) {
        return (
            <div className="flex flex-col gap-4">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    Account
                    <div className="text-sm font-bold text-zinc-900 dark:text-white mt-1 truncate max-w-[180px]">
                        {user.email}
                    </div>
                </div>
                <button
                    onClick={handleSignOut}
                    className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 rounded-xl text-xs font-bold transition-all"
                >
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Admin Portal
            </p>
            <button
                onClick={handleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 rounded-xl transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm"
            >
                <svg width="18" height="18" viewBox="0 0 18 18">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                    <path d="M3.964 10.712A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.45.345 2.817.957 4.044l3.007-2.332z" fill="#FBBC05" />
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.582C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.956L3.964 7.288c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335" />
                </svg>
                <span className="text-sm font-bold">Sign in with Google</span>
            </button>
        </div>
    );
}
