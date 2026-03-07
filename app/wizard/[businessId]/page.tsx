"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { formatTimeRange } from "../../lib/formatting";

type Service = {
    id: number;
    name: string;
    duration_min: number | null;
    description: string | null;
};

type Slot = {
    id: number;
    start_time: string;
    end_time: string;
    technician_id: number | null;
    technician_name?: string | null;
};

type PageProps = {
    params: { businessId: string };
};

export default function WizardBookingPage({ params }: PageProps) {
    const businessSlug = params.businessId;
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Form State
    const [issueDescription, setIssueDescription] = useState("");
    const [services, setServices] = useState<Service[]>([]);
    const [slots, setSlots] = useState<Slot[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");

    // Load services + open slots
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);

            const { data: servicesData, error: servicesError } = await supabase
                .from("services")
                .select("id, name, duration_min, description")
                .eq("business_slug", businessSlug)
                .order("name");

            if (servicesError) {
                console.error(servicesError);
                setError("Failed to load services.");
                setLoading(false);
                return;
            }

            const { data: slotsData, error: slotsError } = await supabase
                .from("time_slots")
                .select(`
            id,
            start_time,
            end_time,
            technician_id,
            technicians (
              name
            )
          `)
                .eq("business_slug", businessSlug)
                .eq("status", "open")
                .order("start_time", { ascending: true });

            if (slotsError) {
                console.error(slotsError);
                setError("Failed to load available time slots.");
                setLoading(false);
                return;
            }

            const mappedSlots: Slot[] = slotsData?.map((row: any) => ({
                id: row.id,
                start_time: row.start_time,
                end_time: row.end_time,
                technician_id: row.technician_id,
                technician_name: row.technicians?.name ?? null,
            })) ?? [];

            setServices(servicesData ?? []);
            setSlots(mappedSlots);
            setLoading(false);
        };

        loadData();
    }, [businessSlug]);

    const handleNextStep = () => {
        if (step === 1 && !issueDescription.trim()) {
            setError("Please describe your issue.");
            return;
        }
        if (step === 2) {
            if (!selectedServiceId) {
                setError("Please select a service.");
                return;
            }
            if (!selectedSlotId) {
                setError("Please select a time slot.");
                return;
            }
        }
        setError(null);
        setStep((prev) => prev + 1);
    };

    const handlePrevStep = () => {
        setError(null);
        setStep((prev) => prev - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
            setError("Please fill in all contact details.");
            return;
        }

        setSubmitting(true);

        const slot = slots.find((s) => s.id === selectedSlotId);
        if (!slot) {
            setError("Selected time slot is no longer available.");
            setSubmitting(false);
            return;
        }

        // 1) Create booking
        const { data: bookingRows, error: bookingError } = await supabase
            .from("bookings")
            .insert({
                business_slug: businessSlug,
                customer_name: customerName.trim(),
                customer_email: customerEmail.trim(),
                customer_phone: customerPhone.trim(),
                service_id: selectedServiceId,
                preferred_time: slot.start_time,
                assigned_technician_id: slot.technician_id,
                status: "new",
                notes: issueDescription.trim(),
            })
            .select()
            .limit(1);

        if (bookingError || !bookingRows || bookingRows.length === 0) {
            console.error(bookingError);
            setError("Failed to create booking.");
            setSubmitting(false);
            return;
        }

        const booking = bookingRows[0];

        // 2) Mark slot as booked
        const { error: slotError } = await supabase
            .from("time_slots")
            .update({
                status: "booked",
                booking_id: booking.id,
            })
            .eq("id", slot.id)
            .eq("status", "open");

        if (slotError) {
            console.error(slotError);
            setError("Booking created but slot reservation failed.");
            setSubmitting(false);
            return;
        }

        // 3) Trigger Calendar Sync (Non-blocking)
        fetch("/api/google-calendar/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bookingId: booking.id,
                businessSlug: businessSlug,
            }),
        }).catch((err) => console.error("Calendar sync error:", err));

        setMessage("Your booking has been requested! You will receive a confirmation via SMS shortly.");
        setSubmitting(false);
        setStep(5); // Success step
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <p className="text-slate-400 font-medium animate-pulse">Initializing Wizard...</p>
        </div>
    );

    const progress = Math.round((step / 4) * 100);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header & Progress */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-4">Service Wizard</h1>
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-sm font-medium text-slate-400">Step {step} of 4</span>
                        <span className="text-sm font-bold text-blue-400">{progress}% Complete</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <span className="text-xl">⚠️</span>
                        <p className="font-medium">{error}</p>
                    </div>
                )}

                <div className="relative group/card">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur opacity-75 group-hover/card:opacity-100 transition duration-1000 group-hover/card:duration-200"></div>
                    <div className="relative bg-slate-900/90 rounded-2xl p-8 sm:p-10 backdrop-blur-xl border border-white/10 shadow-2xl min-h-[400px] flex flex-col">

                        {step === 1 && (
                            <div className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">What can we help with?</h2>
                                    <p className="text-slate-400">Describe the issue you&apos;re facing. Our technicians will review this before your appointment.</p>
                                </div>
                                <textarea
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[180px] text-lg resize-none"
                                    placeholder="e.g. My laptop won't turn on after a spill..."
                                    value={issueDescription}
                                    onChange={(e) => setIssueDescription(e.target.value)}
                                />
                                <button
                                    onClick={handleNextStep}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                >
                                    Continue to Selection
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Service & Schedule</h2>
                                    <p className="text-slate-400">Select the service type and your preferred time slot.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-500 ml-1 uppercase tracking-wider">Service Type</label>
                                    <select
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                                        value={selectedServiceId ?? ""}
                                        onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                                    >
                                        <option value="" className="bg-slate-900">Select a service...</option>
                                        {services.map(s => <option key={s.id} value={s.id} className="bg-slate-900">{s.name} ({s.duration_min} min)</option>)}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-500 ml-1 uppercase tracking-wider">Available Slots</label>
                                    <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {slots.map(slot => (
                                            <label key={slot.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${selectedSlotId === slot.id ? "bg-blue-600/20 border-blue-500/50 ring-1 ring-blue-500/50 shadow-lg" : "bg-slate-800/30 border-slate-700 hover:border-slate-600"}`}>
                                                <input type="radio" name="slot" className="hidden" value={slot.id} checked={selectedSlotId === slot.id} onChange={() => setSelectedSlotId(slot.id)} />
                                                <div className="flex-1">
                                                    <div className="text-white font-medium">{formatTimeRange(slot.start_time, slot.end_time)}</div>
                                                    {slot.technician_name && <div className="text-xs text-slate-500 mt-0.5">Tech: {slot.technician_name}</div>}
                                                </div>
                                                {selectedSlotId === slot.id && <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-[10px] text-white">✓</div>}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button onClick={handlePrevStep} className="flex-1 py-4 px-6 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition-all">Back</button>
                                    <button onClick={handleNextStep} className="flex-[2] py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01]">Next Step</button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Your Contact Details</h2>
                                    <p className="text-slate-400">Almost there! We just need a way to reach you.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 ml-1 uppercase tracking-wider">Full Name</label>
                                        <input className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Jane Smith" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 ml-1 uppercase tracking-wider">Email Address</label>
                                        <input type="email" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="jane@example.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 ml-1 uppercase tracking-wider">Phone Number</label>
                                        <input type="tel" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button onClick={handlePrevStep} className="flex-1 py-4 px-6 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition-all">Back</button>
                                    <button onClick={handleNextStep} className="flex-[2] py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01]">Review Details</button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <form onSubmit={handleSubmit} className="space-y-6 flex-1 animate-in fade-in slide-in-from-right-8 duration-500">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Final Review</h2>
                                    <p className="text-slate-400">Please confirm all details are correct before booking.</p>
                                </div>

                                <div className="bg-slate-800/40 rounded-xl p-6 border border-white/5 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3">
                                        <span className="text-slate-500 text-sm font-medium uppercase tracking-widest">Service</span>
                                        <span className="text-white font-bold">{services.find(s => s.id === selectedServiceId)?.name}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3">
                                        <span className="text-slate-500 text-sm font-medium uppercase tracking-widest">Time</span>
                                        <span className="text-white font-bold">{slots.find(s => s.id === selectedSlotId) ? formatTimeRange(slots.find(s => s.id === selectedSlotId)!.start_time, slots.find(s => s.id === selectedSlotId)!.end_time) : ""}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3">
                                        <span className="text-slate-500 text-sm font-medium uppercase tracking-widest">Contact</span>
                                        <span className="text-white font-bold">{customerName}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-1">Issue Description</span>
                                        <span className="text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-white/5 italic">&quot;{issueDescription}&quot;</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={handlePrevStep} className="flex-1 py-4 px-6 border border-slate-700 hover:bg-slate-800 text-slate-300 font-bold rounded-xl transition-all">Back</button>
                                    <button type="submit" disabled={submitting} className="flex-[2] py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2">
                                        {submitting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                                <span>Booking...</span>
                                            </>
                                        ) : (
                                            "Confirm Booking"
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 5 && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-700">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse"></div>
                                    <div className="relative w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(16,185,129,0.4)]">✅</div>
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Booking Confirmed!</h2>
                                <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">{message}</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/10 shadow-xl"
                                >
                                    Start New Flow
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
