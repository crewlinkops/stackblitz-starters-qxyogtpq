"use client";

import { useBusiness } from "./BusinessContext";

export function BusinessSelector() {
  const {
    businesses,
    currentBusiness,
    setCurrentBusiness,
    loading,
    error,
  } = useBusiness();

  if (loading) {
    return <span className="text-xs text-zinc-500 animate-pulse">Loading…</span>;
  }

  if (error) {
    return (
      <span className="text-xs text-red-500 font-medium">
        {error} – try refreshing
      </span>
    );
  }

  if (!businesses.length) {
    return (
      <span className="text-xs text-zinc-500 font-medium italic">
        No businesses found
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest">Business</span>
      <select
        value={currentBusiness?.id ?? ""}
        onChange={(e) => {
          const id = e.target.value;
          const selected = businesses.find((b) => b.id === id) || null;
          setCurrentBusiness(selected);
        }}
        className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-xl px-4 py-2 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-red-600/50 transition-all cursor-pointer appearance-none pr-10 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat"
      >
        {businesses.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
    </div>
  );
}
