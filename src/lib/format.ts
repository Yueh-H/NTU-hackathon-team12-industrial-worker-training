export function formatDay(day: string, locale: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "—";
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", weekday: "short" }).format(
    new Date(`${day}T12:00:00`)
  );
}

export function formatDateTime(iso: string, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function relativeTime(iso: string, locale: "id" | "zh"): string {
  if (!iso) return locale === "id" ? "belum ada" : "尚無紀錄";
  const delta = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(delta)) return "—";
  const minutes = Math.round(delta / 60000);
  if (minutes < 1) return locale === "id" ? "baru saja" : "剛剛";
  if (minutes < 60) return locale === "id" ? `${minutes} menit lalu` : `${minutes} 分鐘前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return locale === "id" ? `${hours} jam lalu` : `${hours} 小時前`;
  const days = Math.round(hours / 24);
  return locale === "id" ? `${days} hari lalu` : `${days} 天前`;
}

export function percent(value: number | null): string {
  if (value === null) return "—";
  return `${Math.round(value * 100)}%`;
}
