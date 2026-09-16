import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./MetricTile.module.css";

export type MetricTileProps = {
  label: string;
  value: ReactNode;
  /** Rendered muted and smaller beside the value: °, mm, %, "/ 100". */
  unit?: ReactNode;
  /** A Badge stating the clinical verdict. The value itself stays neutral. */
  status?: ReactNode;
  caption?: ReactNode;
  /** Tooltip text for the info affordance beside the label. */
  hint?: string;
  compact?: boolean;
  className?: string;
};

export function MetricTile({
  label,
  value,
  unit,
  status,
  caption,
  hint,
  compact,
  className,
}: MetricTileProps) {
  return (
    <div className={cx(s.tile, compact && s.compact, className)}>
      <div className={s.head}>
        <span className={s.label}>{label}</span>
        {hint && (
          <Info className={s.info} aria-label={hint} strokeWidth={1.75} />
        )}
      </div>

      <div className={s.valueRow}>
        <span className={s.value}>{value}</span>
        {unit && <span className={s.unit}>{unit}</span>}
      </div>

      {(status || caption) && (
        <div className={s.foot}>
          {status}
          {caption && <span className={s.caption}>{caption}</span>}
        </div>
      )}
    </div>
  );
}
