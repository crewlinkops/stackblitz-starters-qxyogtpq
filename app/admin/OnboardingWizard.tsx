"use client";

import { useState } from "react";
import { industryTemplates, Industry } from "../lib/industryTemplates";
import { supabase } from "../lib/supabaseClient";
import { useBusiness } from "./BusinessContext";

export function OnboardingWizard() {
    const { currentBusiness, setCurrentBusiness } = useBusiness();
    const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);

    if (!currentBusiness || currentBusiness.onboarded) return null;

    const handleComplete = async () => {
        if (!selectedIndustry || !currentBusiness) return;
        setLoading(true);

        try {
            // 1. Create the template services for the business
            const servicesToInsert = selectedIndustry.templates.map(t => ({
                business_slug: currentBusiness.slug,
                name: t.name,
                description: t.description,
                duration_min: t.duration_min
            }));

            const { error: svcError } = await supabase.from("services").insert(servicesToInsert);
            if (svcError) throw svcError;

            // 2. Mark business as onboarded
            const { error: bizError } = await supabase
                .from("businesses")
                .update({
                    industry: selectedIndustry.id,
                    onboarded: true
                })
                .eq("id", currentBusiness.id);

            if (bizError) throw bizError;

            // 3. Update local context state
            setCurrentBusiness({
                ...currentBusiness,
                industry: selectedIndustry.id,
                onboarded: true
            });

        } catch (err) {
            console.error("Onboarding failed:", err);
            alert("Something went wrong during onboarding. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">

                {/* Progress Bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-slate-800">
                    <div
                        className="h-full bg-brand-base transition-all duration-500"
                        style={{ width: `${(step / 2) * 100}%` }}
                    />
                </div>

                <div className="p-8 sm:p-12">
                    {step === 1 ? (
                        <div className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">Welcome to Crewlink</h2>
                                <p className="text-slate-400">Let&apos;s get your business set up. What industry are you in?</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {industryTemplates.map((industry) => (
                                    <button
                                        key={industry.id}
                                        onClick={() => setSelectedIndustry(industry)}
                                        className={`p-6 rounded-2xl border transition-all text-left flex items-center gap-4 ${selectedIndustry?.id === industry.id
                                            ? "bg-brand-base/10 border-brand-base ring-2 ring-brand-base/20"
                                            : "bg-slate-800/40 border-white/5 hover:bg-slate-800 hover:border-white/10"
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-white">{industry.name}</div>
                                            <div className="text-xs text-slate-500">{industry.templates.length} Ready-to-use services</div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!selectedIndustry}
                                className="w-full bg-brand-base hover:bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-base/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">Ready to Launch!</h2>
                                <p className="text-slate-400">
                                    We&apos;ve prepared {selectedIndustry?.templates.length} professional service blueprints for your {selectedIndustry?.name} business.
                                </p>
                            </div>

                            <div className="bg-slate-800/50 rounded-2xl border border-white/5 p-6 overflow-hidden">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Inbound Catalog Preview</div>
                                <div className="space-y-3">
                                    {selectedIndustry?.templates.map((t, i) => (
                                        <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                                            <div className="font-medium text-white text-sm">{t.name}</div>
                                            <div className="text-slate-500 text-xs">{t.duration_min}m</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleComplete}
                                    disabled={loading}
                                    className="flex-[2] bg-brand-base hover:bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-base/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Create My Dashboard"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
