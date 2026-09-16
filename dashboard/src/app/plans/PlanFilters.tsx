"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui";
// From `lib/plan`, not `lib/data/plans`. That module reaches for server-only
// server client, which imports `next/headers`, and a `"use client"` file
// reaching it drags the whole server module into the browser bundle and fails
// the build, and the third time this project has hit it.
import { PLAN_STATES, type PlanState } from "@/lib/plan";
import p from "../panels.module.css";

/**
 * The same URL-filter shape `/cases` and `/sessions` use.
 *
 * `/plans/ready` and `/plans/pins` — two nav destinations —
 * redirect into these filters rather than being separate screens. They are the
 * same list asking a different question about the same column, and the same reasoning
 * already ruled on that shape once: a filter, not an entity.
 */
export function PlanFilters({
  state,
  counts,
}: {
  state?: PlanState;
  counts: Record<PlanState, number>;
}) {
  const router = useRouter();

  return (
    <div className={p.filters}>
      <div className={p.facet} role="group" aria-label="State">
        <span className={p.facetLabel}>State</span>
        {PLAN_STATES.map((option) => (
          <Chip
            key={option.value}
            selected={state === option.value}
            count={counts[option.value] || undefined}
            onClick={() =>
              router.replace(
                state === option.value ? "/plans" : `/plans?state=${option.value}`,
                { scroll: false },
              )
            }
          >
            {option.label}
          </Chip>
        ))}
      </div>

      {state && (
        <Link href="/plans" replace scroll={false} className={p.clear}>
          Clear
        </Link>
      )}
    </div>
  );
}
