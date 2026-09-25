"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Chip } from "@/components/ui";
import { titleCase } from "@/lib/format";
import type { CaseAuthoringFacets } from "@/lib/data/content";
import s from "../cases/cases.module.css";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Same URL-is-the-state shape as `/cases`' `CaseFilters` — a filtered
 * authoring view has to survive a reload and be pasteable into a message
 * too. The axes differ (procedure and status instead of pathology and
 * attempt history) because this is an authoring catalogue, not a learner's.
 */
export function ContentCaseFilters({
  facets,
  matched,
  total,
}: {
  facets: CaseAuthoringFacets;
  matched: number;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const current = (key: string) => params.get(key) ?? undefined;
  const paramsString = params.toString();

  function urlWith(from: string, next: Record<string, string | undefined>): string {
    const search = new URLSearchParams(from);
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === "") search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    return qs ? `/content?${qs}` : "/content";
  }

  const apply = (next: Record<string, string | undefined>) =>
    router.replace(urlWith(paramsString, next), { scroll: false });

  const committed = params.get("q") ?? "";
  useEffect(() => {
    const term = query.trim();
    if (term === committed) return;

    const id = setTimeout(() => {
      const search = new URLSearchParams(paramsString);
      if (term) search.set("q", term);
      else search.delete("q");
      const qs = search.toString();
      router.replace(qs ? `/content?${qs}` : "/content", { scroll: false });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(id);
  }, [query, committed, paramsString, router]);

  const toggle = (key: string, value: string) =>
    apply({ [key]: current(key) === value ? undefined : value });

  const active =
    Boolean(current("q")) ||
    Boolean(current("difficulty")) ||
    Boolean(current("procedureId")) ||
    Boolean(current("status"));

  const clearAll = () => {
    setQuery("");
    router.replace("/content", { scroll: false });
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
            placeholder="Search by case name or ID"
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
          label="Difficulty"
          options={facets.difficulties}
          selected={current("difficulty")}
          onToggle={(value) => toggle("difficulty", value)}
        />
        <FacetGroup
          label="Procedure"
          options={facets.procedures}
          selected={current("procedureId")}
          onToggle={(value) => toggle("procedureId", value)}
        />
        <FacetGroup
          label="Status"
          options={facets.statuses}
          selected={current("status")}
          onToggle={(value) => toggle("status", value)}
        />
      </div>
    </div>
  );
}

function FacetGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: CaseAuthoringFacets["difficulties"];
  selected?: string;
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
              {option.label.length && /^[a-z]/.test(option.label)
                ? titleCase(option.label)
                : option.label}
            </Chip>
          );
        })}
      </div>
    </div>
  );
}
