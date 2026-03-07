interface StatCardProps {
  label: string;
  value: number | string;
}

export default function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="p-6 rounded-xl border border-zinc-400/20 bg-zinc-200/50 dark:bg-zinc-800/50 backdrop-blur-md shadow-lg transition-all hover:scale-[1.02] hover:bg-zinc-200/60 dark:bg-zinc-800/60">
      <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-2 uppercase tracking-wider">
        {label}
      </div>
      <div className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
        {value}
      </div>
    </div>
  );
}
