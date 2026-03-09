"use client";

import { useState } from "react";
import { useBusiness } from "../BusinessContext";

export default function OutreachPage() {
    const { currentBusiness, loading } = useBusiness();
    const [phone, setPhone] = useState("");
    const [linkType, setLinkType] = useState<"wizard" | "direct">("wizard");
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
                    linkType
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
                <p className="text-slate-600 dark:text-slate-400 text-lg max-w-3xl">
                    Dispatch booking links directly to your customers via SMS. Choose between the guided Service Wizard or the direct Calendar Booking view depending on your customer&apos;s needs.
                </p>
            </header>

            <div className="group relative mb-12">
                <div className="relative bg-slate-100/80 dark:bg-slate-900/80 rounded-2xl p-6 sm:p-10 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-2xl">
                    <div className="max-w-md mx-auto sm:mx-0">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 ml-1 uppercase tracking-wider">
                                    Which link to send?
                                </label>
                                <div className="flex gap-4">
                                    <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${linkType === 'wizard' ? 'border-brand-base bg-brand-base/10 text-brand-base ring-2 ring-brand-base/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" name="linkType" className="hidden" value="wizard" checked={linkType === 'wizard'} onChange={() => setLinkType('wizard')} />
                                        <span className="font-bold mb-1">Guided Wizard</span>
                                        <span className="text-xs text-center opacity-80">Helps diagnose issue</span>
                                    </label>
                                    <label className={`flex-1 flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all ${linkType === 'direct' ? 'border-brand-base bg-brand-base/10 text-brand-base ring-2 ring-brand-base/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                        <input type="radio" name="linkType" className="hidden" value="direct" checked={linkType === 'direct'} onChange={() => setLinkType('direct')} />
                                        <span className="font-bold mb-1">Direct Calendar</span>
                                        <span className="text-xs text-center opacity-80">Skip straight to booking</span>
                                    </label>
                                </div>
                            </div>

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
                    Shareable Link & Preview
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Wizard Link */}
                    <div className="bg-slate-200/40 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:border-brand-base/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-xs font-bold text-brand-base uppercase tracking-widest">Guided Wizard Link</div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://gocrewlink.com/wizard/${currentBusiness.slug}`);
                                    setResult({ success: true, message: "Wizard link copied to clipboard!" });
                                }}
                                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-base dark:hover:text-brand-light transition-colors"
                            >
                                COPY
                            </button>
                        </div>
                        <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 overflow-x-auto truncate font-medium mb-4">
                            https://gocrewlink.com/wizard/{currentBusiness.slug}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">SMS Preview</div>
                        <div className="italic text-slate-600 dark:text-slate-400 text-sm">
                            &quot;Hi! Please use our service wizard to describe your issue and book an appointment: https://gocrewlink.com/wizard/{currentBusiness.slug}&quot;
                        </div>
                    </div>

                    {/* Direct Link */}
                    <div className="bg-slate-200/40 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:border-brand-base/30 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Direct Calendar Link</div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://gocrewlink.com/b/${currentBusiness.slug}`);
                                    setResult({ success: true, message: "Direct link copied to clipboard!" });
                                }}
                                className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors"
                            >
                                COPY
                            </button>
                        </div>
                        <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 overflow-x-auto truncate font-medium mb-4">
                            https://gocrewlink.com/b/{currentBusiness.slug}
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">SMS Preview</div>
                        <div className="italic text-slate-600 dark:text-slate-400 text-sm">
                            &quot;Hi! Please view our availability and book your appointment here: https://gocrewlink.com/b/{currentBusiness.slug}&quot;
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
