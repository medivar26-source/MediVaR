"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./viz.module.css";

/**
 * The only genuinely stateful piece of the row. Its expanded content arrives
 * through `children`, already rendered on the server — see RowParts.tsx for
 * why that separation matters.
 */

export type RowCell = {
  value: ReactNode;
  pill?: "dark" | "muted" | "pass" | "fail";
};

export type ExpandableRowProps = {
  initials: string;
  label: string;
  cells: RowCell[];
  children: ReactNode;
  defaultOpen?: boolean;
};

export function ExpandableRow({
  initials,
  label,
  cells,
  children,
  defaultOpen = false,
}: ExpandableRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div className={cx(s.row, open && s.rowOpen)}>
      <button
        type="button"
        className={s.rowTrigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={s.rowName}>
          <span
            className={cx(s.rowAvatar, open && s.rowAvatarOn)}
            aria-hidden="true"
          >
            {initials}
          </span>
          <span className={s.rowLabel}>{label}</span>
        </span>

        {cells.map((cell, i) => (
          <span className={s.rowCell} key={i}>
            {cell.pill ? (
              <span
                className={cx(
                  s.pill,
                  cell.pill === "muted" && s.pillMuted,
                  cell.pill === "pass" && s.pillPass,
                  cell.pill === "fail" && s.pillFail,
                )}
              >
                {cell.value}
              </span>
            ) : (
              cell.value
            )}
          </span>
        ))}

        <span className={s.rowToggle} aria-hidden="true">
          <Chevron width={15} height={15} strokeWidth={2.5} />
        </span>
      </button>

      {open && <div className={s.rowBody}>{children}</div>}
    </div>
  );
}
