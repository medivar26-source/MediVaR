"use client";

import { useRouter } from "next/navigation";

/**
 * Picks one session to inspect. The choice lives in the URL (`session=`), so a view is a link
 * that can be shared, and the server does the reading — this only navigates.
 */
export function SessionPicker({
  options,
  value,
  baseHref,
  allLabel,
}: {
  options: { value: string; label: string }[];
  value: string;
  /** Href without the `session` parameter, e.g. `/programs/1?tab=learners&cohort=2`. */
  baseHref: string;
  allLabel: string;
}) {
  const router = useRouter();

  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--s-2)", fontSize: "var(--t-label)", color: "var(--text-muted)", fontWeight: 600 }}>
      Session
      <select
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          router.push(next ? `${baseHref}&session=${encodeURIComponent(next)}` : baseHref);
        }}
        style={{
          minHeight: "var(--h-sm)",
          minWidth: 260,
          maxWidth: "100%",
          padding: "0 var(--s-3)",
          border: "var(--bw) solid var(--border-strong)",
          borderRadius: "var(--r-sm)",
          background: "var(--surface)",
          color: "var(--ink)",
          fontFamily: "inherit",
          fontSize: "var(--t-label)",
        }}
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
