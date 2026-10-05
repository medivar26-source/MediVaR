import Link from "next/link";
import { Chip } from "@/components/ui";

/** Chooses which cohort a performance view is about. One cohort at a time keeps the numbers honest. */
export function CohortChips({
  programId,
  tab,
  cohorts,
  selectedId,
}: {
  programId: string;
  tab: "learners" | "performance";
  cohorts: { id: string; name: string }[];
  selectedId: string;
}) {
  if (cohorts.length < 2) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap", marginBottom: "var(--s-4)" }}>
      <span style={{ fontSize: "var(--t-caption)", color: "var(--text-muted)", fontWeight: 500 }}>Cohort:</span>
      {cohorts.map((c) => (
        <Link
          key={c.id}
          href={`/programs/${programId}?tab=${tab}&cohort=${c.id}`}
          style={{ textDecoration: "none" }}
          aria-current={c.id === selectedId ? "true" : undefined}
        >
          <Chip tone={c.id === selectedId ? "default" : "muted"}>{c.name}</Chip>
        </Link>
      ))}
    </div>
  );
}
