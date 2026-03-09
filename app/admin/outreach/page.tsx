"use client";

import { useState } from "react";
import { useBusiness } from "../BusinessContext";

export default function OutreachPage() {
    const { currentBusiness, loading } = useBusiness();
    const [phone, setPhone] = useState("");
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSendLink = async () => {
        if (!currentBusiness) return;
        if (!phone.trim()) {
            setResult({ success: false, message: "Please enter a phone number." });
            return;
        }

        setSending(true);
        setResult(null);

        try {
            const response = await fetch("/api/outreach/send-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: phone.trim(),
                    businessSlug: currentBusiness.slug,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({ success: true, message: `Successfully sent booking link to ${phone}` });
                setPhone("");
            } else {
                setResult({ success: false, message: data.error || "Failed to send link." });
            }
        } catch (error: any) {
            setResult({ success: false, message: "An unexpected error occurred." });
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div>Loading businesses...</div>;
    if (!currentBusiness) return <div>Please select a business first.</div>;

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <header className="mb-10 text-center sm:text-left border-b border-slate-400/10 pb-8">
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">SMS Outreach</h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl">
                    Provide a specialized link to let customers describe their issue before picking a time. They&apos;ll be guided through a full booking wizard.
                </p>
            </header>

            <div className="group relative mb-12">
                <div className="relative bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl p-6 sm:p-10 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
                    <div className="max-w-md mx-auto sm:mx-0">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 ml-1 uppercase tracking-wider">
                                    Customer Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-4 text-slate-900 dark:text-white text-lg placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-base/50 transition-all"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleSendLink}
                                disabled={sending}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-brand-base hover:bg-brand-light text-slate-900 dark:text-white font-bold rounded-xl shadow-lg shadow-brand-base/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? (
                                    <div className="w-5 h-5 border-2 border-slate-200 dark:border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <span>Send Booking Link</span>
                                )}
                            </button>

                            {result && (
                                <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${result.success
                                    ? "bg-brand-base/10 border-brand-base/20 text-brand-base"
                                    : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <p className="font-medium">{result.message}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <section className="space-y-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-brand-base rounded-full"></span>
                    Preview Message
                </h2>
                <div className="bg-slate-200/40 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:border-brand-base/30 transition-colors">
                    <div className="text-xs font-bold text-brand-base uppercase tracking-widest mb-3">Booking Link Flow</div>
                    <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 italic text-slate-700 dark:text-slate-300 leading-relaxed">
                        &quot;Hi! Please use our service wizard to book your appointment: https://gocrewlink.com/wizard/{currentBusiness.slug}&quot;
                    </div>
                </div>
            </section>
        </div>
    );
}
