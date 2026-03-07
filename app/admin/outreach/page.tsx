"use client";

import { useState } from "react";
import { useBusiness } from "../BusinessContext";

export default function OutreachPage() {
    const { currentBusiness, loading } = useBusiness();
    const [phone, setPhone] = useState("");
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const handleSendLink = async (type: "direct" | "wizard") => {
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
                    type: type,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResult({ success: true, message: `Successfully sent ${type} link to ${phone}` });
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
                <h1 className="text-3xl font-bold text-white tracking-tight mb-3">SMS Outreach</h1>
                <p className="text-slate-400 text-lg max-w-2xl">
                    Send personalized booking links directly to your customers' phones via SMS.
                </p>
            </header>

            <div className="group relative mb-12">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative bg-slate-900/80 rounded-2xl p-6 sm:p-10 backdrop-blur-xl border border-white/10 shadow-2xl">
                    <div className="max-w-md mx-auto sm:mx-0">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-400 ml-1 uppercase tracking-wider">
                                    Customer Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-4 text-white text-lg placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleSendLink("direct")}
                                    disabled={sending}
                                    className="flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span>Send Direct Link</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleSendLink("wizard")}
                                    disabled={sending}
                                    className="flex items-center justify-center gap-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {sending ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <span>Send Wizard Link</span>
                                    )}
                                </button>
                            </div>

                            {result && (
                                <div className={`p-4 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${result.success
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                    : "bg-red-500/10 border-red-500/20 text-red-400"
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{result.success ? "✅" : "⚠️"}</span>
                                        <p className="font-medium">{result.message}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <section className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Preview Messages
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-slate-800/40 rounded-2xl p-6 border border-white/5 shadow-sm hover:border-blue-500/30 transition-colors">
                        <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-3">Direct Link Flow</div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 italic text-slate-300 leading-relaxed">
                            "Hi! You can book your appointment with us directly here: [Origin]/b/{currentBusiness.slug}"
                        </div>
                    </div>
                    <div className="bg-slate-800/40 rounded-2xl p-6 border border-white/5 shadow-sm hover:border-emerald-500/30 transition-colors">
                        <div className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-3">Wizard Link Flow</div>
                        <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 italic text-slate-300 leading-relaxed">
                            "Hi! Please use our service wizard to book your appointment: [Origin]/wizard/{currentBusiness.slug}"
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
