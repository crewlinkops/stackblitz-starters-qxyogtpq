interface StatCardProps {
  label: string;
  value: number | string;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white/40 dark:bg-[#0B1221]/60 backdrop-blur-xl shadow-lg shadow-brand-base/5 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:bg-white/60 dark:hover:bg-slate-900/60 hover:-translate-y-1">
      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-[0.2em]">
        {label}
      </div>
      <div className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        {value}
      </div>
    </div>
  );
}
