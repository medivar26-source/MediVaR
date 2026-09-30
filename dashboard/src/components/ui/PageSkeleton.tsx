import { Skeleton } from "./States";

/**
 * Loading shapes for the two layouts most screens resolve to: a grid of cards
 * (programs, cases) and a table (learners, sessions, plans). Same header block
 * as the root loader, so the page frame never jumps.
 */
export function PageSkeleton({ variant }: { variant: "cards" | "table" }) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      style={{ display: "grid", gap: "var(--s-5)", padding: "var(--s-6)" }}
    >
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        Loading
      </span>

      <div style={{ display: "grid", gap: "var(--s-2)" }}>
        <Skeleton width="180px" height="14px" />
        <Skeleton width="320px" height="34px" />
        <Skeleton width="460px" height="16px" />
      </div>

      {variant === "cards" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "var(--s-4)",
          }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height="176px" block />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--s-2)" }}>
          <Skeleton height="44px" block />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} height="56px" block />
          ))}
        </div>
      )}
    </div>
  );
}
