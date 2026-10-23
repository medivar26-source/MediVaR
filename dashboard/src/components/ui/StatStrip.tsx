import type { ReactNode } from "react";
import s from "./StatStrip.module.css";

export type StatStripItem = {
  label: string;
  value: ReactNode;
  /** One short line under the figure, such as "Across 4 reports". */
  note?: string;
};

/**
 * A compact row of totals: label, figure and an optional note, in one bordered band.
 * It stands in for a row of full stat cards where the figures are context for a list
 * below, not the point of the page.
 */
export function StatStrip({ items, label }: { items: StatStripItem[]; label: string }) {
  return (
    <dl className={s.strip} aria-label={label}>
      {items.map((item) => (
        <div key={item.label} className={s.item}>
          <dt className={s.label}>{item.label}</dt>
          <dd className={s.value}>{item.value}</dd>
          {item.note && <dd className={s.note}>{item.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
