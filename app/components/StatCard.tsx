interface StatCardProps {
  label: string;
  value: number | string;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="p-6 rounded-xl border border-slate-400/20 bg-slate-800/50 backdrop-blur-md shadow-lg transition-all hover:scale-[1.02] hover:bg-slate-800/60">
      <div className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">
        {value}
      </div>
    </div>
  );
}
