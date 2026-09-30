"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, GraduationCap, Search, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import { searchRecords, type SearchHit } from "@/app/actions/search";
import { sectionsForPersona } from "@/lib/nav";
import type { Persona } from "@/lib/roles";
import s from "./SearchDialog.module.css";

const KIND_ICON: Record<SearchHit["kind"], LucideIcon> = {
  case: FolderOpen,
  program: GraduationCap,
  cohort: Users,
  learner: Users,
};

export type SearchEntry = {
  title: string;
  meta: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Command palette. Opens on click or ⌘K, filters every destination the
 * current persona can reach, and navigates on Enter.
 *
 * Destinations are derived from lib/nav, so this can never drift out of sync
 * with the navigation panels.
 */
export function SearchDialog({
  open,
  onClose,
  persona,
}: {
  open: boolean;
  onClose: () => void;
  persona: Persona;
}) {
  // Mounting fresh on each open means query and cursor start clean without an
  // effect resetting them — cascading renders avoided by construction.
  if (!open) return null;
  return <Palette onClose={onClose} persona={persona} />;
}

function Palette({
  onClose,
  persona,
}: {
  onClose: () => void;
  persona: Persona;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  // Records found by name for the query that produced them.
  const [found, setFound] = useState<{ q: string; hits: SearchHit[] }>({ q: "", hits: [] });

  // Moving focus is not state, so this stays a legitimate effect.
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const entries = useMemo<SearchEntry[]>(() => {
    const out: SearchEntry[] = [];
    for (const section of sectionsForPersona(persona)) {
      for (const group of section.groups) {
        for (const item of group.items) {
          out.push({
            title: item.label,
            meta: `${section.label}${group.label ? ` · ${group.label}` : ""}`,
            href: item.href,
            icon: section.icon,
          });
          for (const child of item.children ?? []) {
            out.push({
              title: child.label,
              meta: `${section.label} · ${item.label}`,
              href: child.href,
              icon: section.icon,
            });
          }
        }
      }
    }
    return out;
  }, [persona]);

  // Names of cases, programs, cohorts and learners: asked of the server once
  // typing pauses. A stale answer is ignored, never shown.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let current = true;
    const timer = setTimeout(() => {
      searchRecords(q)
        .then((hits) => {
          if (current) setFound({ q, hits });
        })
        .catch(() => {});
    }, 250);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [query]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries.slice(0, 8);
    const pages = entries
      .filter(
        (e) =>
          e.title.toLowerCase().includes(q) || e.meta.toLowerCase().includes(q),
      )
      .slice(0, 6);
    const records: SearchEntry[] =
      found.q.toLowerCase() === q
        ? found.hits.map((h) => ({
            title: h.title,
            meta: h.meta,
            href: h.href,
            icon: KIND_ICON[h.kind],
          }))
        : [];
    return [...pages, ...records];
  }, [entries, query, found]);

  // Clamped rather than reset in an effect.
  const active = Math.min(cursor, Math.max(results.length - 1, 0));

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor(Math.min(active + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor(Math.max(active - 1, 0));
    } else if (event.key === "Enter" && results[active]) {
      event.preventDefault();
      go(results[active].href);
    }
  };

  return (
    <div
      className={s.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onKeyDown={onKeyDown}
      >
        <div className={s.field}>
          <Search className={s.icon} strokeWidth={2} aria-hidden="true" />
          <input
            ref={inputRef}
            className={s.input}
            placeholder="Search pages, cases, cohorts, learners…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            aria-label="Search query"
            autoComplete="off"
          />
          <button type="button" className={s.esc} onClick={onClose}>
            ESC
          </button>
        </div>

        <div className={s.results}>
          {results.length === 0 ? (
            <div className={s.empty}>
              <p className={s.emptyTitle}>No matches for “{query}”</p>
              <p className={s.emptyText}>
                Try a page name, or part of a case, program, cohort or learner name.
              </p>
            </div>
          ) : (
            results.map((entry, i) => (
              <button
                key={`${entry.href}-${entry.title}`}
                type="button"
                className={cx(s.item, i === active && s.itemActive)}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(entry.href)}
              >
                <span className={s.itemIcon}>
                  <entry.icon width={16} height={16} strokeWidth={1.75} />
                </span>
                <span className={s.itemBody}>
                  <span className={s.itemTitle}>{entry.title}</span>
                  <span className={s.itemMeta}>{entry.meta}</span>
                </span>
                {i === active && <span className={s.itemKey}>↵</span>}
              </button>
            ))
          )}
        </div>

        <div className={s.footer}>
          <span className={s.hint}>
            <span className={s.key}>↑</span>
            <span className={s.key}>↓</span> navigate
          </span>
          <span className={s.hint}>
            <span className={s.key}>↵</span> open
          </span>
          <span className={s.hint}>
            <span className={s.key}>esc</span> close
          </span>
        </div>
      </div>
    </div>
  );
}
