"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties } from "react";
import { cx } from "@/lib/cx";
import {
  AUTH_FEATURES,
  AUTH_FEATURE_GROUP_LABEL,
  AUTH_FEATURE_LABELS,
  AUTH_GRID,
} from "@/lib/auth-features";
import s from "./AuthFeatureGrid.module.css";

/**
 * A connected, editorial grid of the platform's features. Hovering or focusing a tile
 * widens its column, grows its row and reveals its description; nothing outside the
 * grid moves. On touch screens (no hover) every description is simply shown.
 */

type Edge = "first" | "mid" | "last" | "only";

function edgeOf(index: number, count: number): Edge {
  if (count === 1) return "only";
  if (index === 0) return "first";
  return index === count - 1 ? "last" : "mid";
}

function useMedia(query: string, serverValue: boolean) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

function useLayout() {
  const wide = useMedia(AUTH_GRID.wideQuery, true);
  const noHover = useMedia(AUTH_GRID.noHoverQuery, false);
  return { columns: wide ? AUTH_GRID.columnsWide : AUTH_GRID.columnsNarrow, compact: noHover };
}

const track = (fr: number) => `${fr}fr`;

export default function AuthFeatureGrid() {
  const { columns, compact } = useLayout();
  const [active, setActive] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Debounced so that crossing a guide line between tiles does not reset the grid.
  const settle = useCallback((next: number | null, wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(next), wait);
  }, []);

  const count = AUTH_FEATURES.length;
  const rowCount = Math.ceil(count / columns);
  const rows = Array.from({ length: rowCount }, (_, r) =>
    AUTH_FEATURES.slice(r * columns, (r + 1) * columns).map((feature, c) => ({
      feature,
      index: r * columns + c,
    })),
  );
  const activeRow = active === null || compact ? -1 : Math.floor(active / columns);
  const activeCol = active === null || compact ? -1 : active % columns;

  const gridStyle: CSSProperties = compact
    ? { gridTemplateRows: `repeat(${rowCount}, auto)` }
    : {
        gridTemplateRows: rows
          .map((_, r) => track(r === activeRow ? AUTH_GRID.activeRowFr : 1))
          .join(" "),
      };

  return (
    <div className={cx(s.frame, compact && s.compact)}>
      <div
        className={s.grid}
        role="group"
        aria-label={AUTH_FEATURE_GROUP_LABEL}
        style={gridStyle}
        onMouseLeave={() => !compact && settle(null, AUTH_GRID.delay.leave)}
      >
        {rows.map((row, r) => (
          <div
            key={r}
            className={s.row}
            style={{
              gridTemplateColumns: row
                .map((_, c) =>
                  track(r === activeRow && c === activeCol ? AUTH_GRID.activeColumnFr : 1),
                )
                .join(" "),
            }}
          >
            {row.map(({ feature, index }) => {
              const on = index === active && !compact;
              return (
                <button
                  key={feature.title}
                  type="button"
                  className={cx(s.tile, on && s.tileActive)}
                  data-col={edgeOf(index % columns, row.length)}
                  data-row={edgeOf(r, rowCount)}
                  aria-expanded={compact ? undefined : on}
                  onMouseEnter={() =>
                    !compact &&
                    settle(index, active === null ? AUTH_GRID.delay.open : AUTH_GRID.delay.switch)
                  }
                  onFocus={() => !compact && settle(index, AUTH_GRID.delay.open)}
                  onBlur={() => !compact && settle(null, AUTH_GRID.delay.blur)}
                >
                  <span className={s.index}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={s.title}>{feature.title}</span>
                  <span className={s.description}>
                    <span className={s.descriptionInner}>{feature.description}</span>
                  </span>
                  <span className={s.footer}>
                    <span>{AUTH_FEATURE_LABELS.start}</span>
                    <span>{AUTH_FEATURE_LABELS.end}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
