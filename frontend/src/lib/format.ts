/** Format a 0-1 fraction as "67%". */
export function pct(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "—";
  return `${Math.round(v * 100)}%`;
}

/** Format hours with one decimal, e.g. "12.5 hrs". */
export function hours(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${v.toFixed(1)} hrs`;
}

/** Short date: "Apr 06". */
export function shortDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

/** MM-DD-YYYY format. */
export function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const date = new Date(d + "T00:00:00");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

/** Urgency bucket for a due date. Null/empty → null (nothing to show). */
export function dueUrgency(
  d: string | null | undefined,
): "overdue" | "this_week" | "later" | null {
  if (!d) return null;
  const date = new Date(d + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - now.getTime()) / 86_400_000);
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "this_week";
  return "later";
}

/** True if the date is in the past. Null/empty → false. */
export function isOverdue(d: string | null | undefined): boolean {
  return dueUrgency(d) === "overdue";
}

/** Relative date: "3 weeks ago", "in 2 weeks". */
export function relativeDate(d: string | null | undefined): string {
  if (!d) return "—";
  const target = new Date(d + "T00:00:00");
  const now = new Date();
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86_400_000);
  const weeks = Math.round(diffDays / 7);
  if (weeks === 0) return "this week";
  if (weeks > 0) return `in ${weeks}w`;
  return `${Math.abs(weeks)}w ago`;
}

/** HSL-based tone for avatar backgrounds. */
export function avatarTone(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 88%)`;
}
