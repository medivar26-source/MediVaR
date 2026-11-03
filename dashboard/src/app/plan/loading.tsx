import { Skeleton } from "@/components/ui";

/** The planner opens on a large scan, so the placeholder is a header strip and one big block, not a card grid. */
export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{ display: "grid", gap: "var(--s-4)", padding: "var(--s-6)" }}
    >
      <span className="srOnly">Loading plan</span>
      <Skeleton width="320px" height="28px" />
      <Skeleton height="62vh" block />
    </div>
  );
}
