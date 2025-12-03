export const formatDateTime = (iso: string): string => {
  const d = new Date(iso);
  const dateStr = d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateStr} ${timeStr}`;
};

export const formatTimeRange = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const dateStr = startDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const startStr = startDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const endStr = endDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${dateStr}, ${startStr} – ${endStr}`;
};

export const toTimeInput = (t: string | null): string => {
  if (!t) return "";
  return t.slice(0, 5);
};

export const fromTimeInput = (t: string): string | null => {
  return t ? (t.length === 5 ? t + ":00" : t) : null;
};
