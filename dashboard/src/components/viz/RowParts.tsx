/* Presentational pieces of an expandable row.
 *
 * Deliberately NOT "use client". They are rendered by a server component and
 * handed to ExpandableRow through its `children` slot, so the Lucide icon
 * props they accept never cross the RSC boundary. Marking this file client
 * would make `icon={Award}` a function-passed-to-client error at request time
 * — and because the dashboard route is dynamic, `next build` would not catch
 * it. Keep the directive off. */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./viz.module.css";

export function Rows({ children }: { children: ReactNode }) {
  return <div className={s.rows}>{children}</div>;
}

export function RowHeader({ columns }: { columns: string[] }) {
  return (
    <div className={s.rowHead}>
      {columns.map((c) => (
        <span key={c}>{c}</span>
      ))}
      <span />
    </div>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <div className={s.chips}>{children}</div>;
}

export function VizChip({
  children,
  icon: Icon,
}: {
  children: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <span className={s.chip}>
      {Icon && <Icon className={s.chipIcon} strokeWidth={2} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function SubHead({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className={s.subHead}>
      <span className={s.subTitle}>{title}</span>
      {meta && <span className={s.subMeta}>{meta}</span>}
    </div>
  );
}

export function Breakdown({ children }: { children: ReactNode }) {
  return <div className={s.breakdown}>{children}</div>;
}

export function BreakCell({
  label,
  value,
  dim,
  lead,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  /** Denominator or comparison, rendered smaller and muted. */
  dim?: ReactNode;
  lead?: boolean;
  icon?: LucideIcon;
}) {
  return (
    <div className={cx(s.breakCell, lead && s.breakLead)}>
      <span className={s.breakLabel}>
        {Icon && <Icon className={s.chipIcon} strokeWidth={2} aria-hidden="true" />}
        {label}
      </span>
      <span className={s.breakValue}>
        {value}
        {dim && <span className={s.breakValueDim}> {dim}</span>}
      </span>
    </div>
  );
}
