"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Chip } from "@/components/ui";
import { titleCase } from "@/lib/format";
import type { CaseFacets, Facet } from "@/lib/data/cases";
import s from "./cases.module.css";

/**
 * Filters write to the URL, not to component state.
 *
 * A filtered view has to survive a reload and be pasteable into a message —
 * "look at the three expert cases" is a link, or it is nothing. The server
 * component re-runs the query from the search params, so there is one source of
 * truth and no client-side copy of the case list.
 *
 * Layout: one search row, then the four facets side by side on a single band.
 * The previous version stacked each facet on its own labelled row, which cost
 * six rows of chrome above a catalogue of six cases — the filter was taller
 * than the thing it filtered.
 */

/** Long enough that a typed word settles, short enough to feel live. */
const SEARCH_DEBOUNCE_MS = 300;

export function CaseFilters({
  facets,
  matched,
  total,
}: {
  facets: CaseFacets;
  matched: number;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const current = (key: string) => params.get(key) ?? undefined;
  const paramsString = params.toString();

  function urlWith(
    from: string,
    next: Record<string, string | undefined>,
  ): string {
    const search = new URLSearchParams(from);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    return qs ? `/cases?${qs}` : "/cases";
  }

  const apply = (next: Record<string, string | undefined>) =>
    router.replace(urlWith(paramsString, next), { scroll: false });

  /**
   * Search applies as you type. `replace` rather than `push`, so eight
   * keystrokes do not leave eight entries in the back history. Every dependency
   * below is a primitive or a stable router, so the timer restarts on a
   * keystroke and on nothing else.
   */
  const committed = params.get("q") ?? "";
  useEffect(() => {
    const term = query.trim();
    if (term === committed) return;

    const id = setTimeout(() => {
      const search = new URLSearchParams(paramsString);
      if (term) search.set("q", term);
      else search.delete("q");
      const qs = search.toString();
      router.replace(qs ? `/cases?${qs}` : "/cases", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [query, committed, paramsString, router]);

  /** Clicking the selected chip clears it — a filter you cannot undo is a trap. */
  const toggle = (key: string, value: string) =>
    apply({ [key]: current(key) === value ? undefined : value });

  const active =
    Boolean(current("q")) ||
    Boolean(current("pathology")) ||
    Boolean(current("side")) ||
    Boolean(current("difficulty")) ||
    Boolean(current("attempted"));

  const clearAll = () => {
    setQuery("");
    router.replace("/cases", { scroll: false });
  };

  return (
    <div className={s.filters}>
      <form
        className={s.searchRow}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          apply({ q: query.trim() || undefined });
        }}
      >
        <span className={s.searchWrap}>
          <Search className={s.searchIcon} aria-hidden="true" strokeWidth={2} />
          <input
            className={s.search}
            type="text"
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by case name or ID — try “varus” or “CASE_003”"
            aria-label="Search cases"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className={s.searchClear}
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X width={15} height={15} strokeWidth={2.5} />
            </button>
          )}
        </span>

        <p className={s.count} aria-live="polite">
          {matched === total ? (
            <>
              <b>{total}</b> {total === 1 ? "case" : "cases"}
            </>
          ) : (
            <>
              <b>{matched}</b> of {total} cases
            </>
          )}
        </p>

        {active && (
          <button type="button" className={s.clear} onClick={clearAll}>
            <X width={14} height={14} strokeWidth={2.5} aria-hidden="true" />
            Clear all
          </button>
        )}
      </form>

      <div className={s.facets}>
        <FacetGroup
          label="Pathology"
          options={facets.pathologies}
          selected={current("pathology")}
          onToggle={(value) => toggle("pathology", value)}
        />
        <FacetGroup
          label="Side"
          options={facets.sides}
          selected={current("side")}
          format={titleCase}
          onToggle={(value) => toggle("side", value)}
        />
        <FacetGroup
          label="Difficulty"
          options={facets.difficulties}
          selected={current("difficulty")}
          format={titleCase}
          onToggle={(value) => toggle("difficulty", value)}
        />
        <FacetGroup
          label="History"
          options={facets.history}
          selected={current("attempted")}
          format={(value) =>
            value === "attempted" ? "Attempted" : "Not attempted"
          }
          onToggle={(value) => toggle("attempted", value)}
        />
      </div>
    </div>
  );
}

/**
 * A count of 0 means selecting this narrows the result set to nothing. It stays
 * visible and is disabled rather than hidden: a facet value that vanishes as
 * you filter makes the catalogue feel like it is shifting under you.
 */
function FacetGroup({
  label,
  options,
  selected,
  format,
  onToggle,
}: {
  label: string;
  options: Facet[];
  selected?: string;
  format?: (value: string) => string;
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className={s.facet}>
      <span className={s.facetLabel}>{label}</span>
      <div className={s.facetChips}>
        {options.map((option) => {
          const on = selected === option.value;
          const empty = option.count === 0 && !on;
          return (
            <Chip
              key={option.value}
              selected={on}
              count={option.count}
              className={empty ? s.chipEmpty : undefined}
              onClick={empty ? undefined : () => onToggle(option.value)}
            >
              {format ? format(option.value) : option.value}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
