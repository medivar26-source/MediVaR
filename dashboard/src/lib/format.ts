/**
 * Formatting rules, in one place.
 * Units are always shown and always spaced from the number, except degrees.
 */

/** 862 → "14 min 22 s". Matches the report header. */
export function duration(seconds?: number): string {
  if (seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s} s`;
  return `${m} min ${s.toString().padStart(2, "0")} s`;
}

/** 862 → "14:22". For dense table columns. */
export function clock(seconds?: number): string {
  if (seconds === undefined) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** 27_000 → "7 h 30 m". */
export function longDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} m` : `${m} m`;
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const TIME_FMT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function shortDate(iso?: string): string {
  return iso ? DATE_FMT.format(new Date(iso)) : "—";
}

export function timeOfDay(iso?: string): string {
  return iso ? TIME_FMT.format(new Date(iso)) : "—";
}

/** "3 days ago". `now` is passed in so output stays deterministic. */
export function relativeTime(iso: string | undefined, now: string): string {
  if (!iso) return "Never";
  const diff = Date.parse(now) - Date.parse(iso);
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} days ago`;
  return shortDate(iso);
}

export function daysSince(iso: string | undefined, now: string): number {
  if (!iso) return Infinity;
  return Math.floor((Date.parse(now) - Date.parse(iso)) / 86_400_000);
}

/** 29402 → "29,402". */
export function count(n: number): string {
  return n.toLocaleString("en-GB");
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * "Dr Arjun Mehta" -> "AM". Two letters for an avatar chip, title stripped.
 *
 * Lives here rather than in lib/session so client components can use it —
 * lib/session imports next/headers and cannot cross into the browser bundle.
 */
export function initialsOf(name: string): string {
  return name
    .replace(/^(Dr|Prof\.?|Mr|Ms|Mrs)\s+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** 840 → "14 min". Rounded, for a catalogue tile rather than a report row. */
export function roughDuration(seconds?: number): string {
  if (seconds === undefined) return "—";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}
