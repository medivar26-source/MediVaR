"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Chip } from "@/components/ui";
import { titleCase } from "@/lib/format";
import s from "./sessions.module.css";

/**
 * Filters write to the URL, exactly as `/cases` does.
 *
 * A filtered view has to survive a reload and be pasteable into a message —
 * "these three are below the pass mark" is a link or it is nothing. The server
 * component re-runs the query from the search params, so there is one source of
 * truth and no client-side copy of the session list.
 *
 * Clicking a selected chip clears it. A filter you cannot undo is a trap.
 */

const STATUSES = ["live", "completed", "aborted"] as const;
const MODES = ["training", "assessment"] as const;

export function SessionFilters({
  status,
  mode,
  caseId,
}: {
  status?: string;
  mode?: string;
  caseId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const paramsString = params.toString();

  function apply(next: Record<string, string | undefined>) {
    const search = new URLSearchParams(paramsString);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined) search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    router.replace(qs ? `/sessions?${qs}` : "/sessions", { scroll: false });
  }

  const anyFilter = Boolean(status || mode || caseId);

  return (
    <div className={s.filters}>
      <div className={s.facet} role="group" aria-label="Status">
        <span className={s.facetLabel}>Status</span>
        {STATUSES.map((value) => (
          <Chip
            key={value}
            selected={status === value}
            onClick={() => apply({ status: status === value ? undefined : value })}
          >
            {value === "aborted" ? "Interrupted" : titleCase(value)}
          </Chip>
        ))}
      </div>

      <div className={s.facet} role="group" aria-label="Mode">
        <span className={s.facetLabel}>Mode</span>
        {MODES.map((value) => (
          <Chip
            key={value}
            selected={mode === value}
            onClick={() => apply({ mode: mode === value ? undefined : value })}
          >
            {titleCase(value)}
          </Chip>
        ))}
      </div>

      {/* Only rendered when it is set, because there is no list of cases here
          to pick from — it arrives from a link on `/cases/[id]`. A facet with
          nothing to choose is not a control. */}
      {caseId && (
        <div className={s.facet} role="group" aria-label="Case">
          <span className={s.facetLabel}>Case</span>
          <Chip selected onClick={() => apply({ case: undefined })}>
            {caseId}
          </Chip>
        </div>
      )}

      {/* Clearing navigates to the unfiltered view, so it is an anchor —
          middle-click, copy-link and the status bar all work. */}
      {anyFilter && (
        <Link href="/sessions" replace scroll={false} className={s.clear}>
          Clear all
        </Link>
      )}
    </div>
  );
}
