import type { ReactNode } from "react";
import { cx } from "@/lib/cx";
import s from "./ProgressBar.module.css";

export type ProgressBarProps = {
  /** 0–100. Clamped. */
  value: number;
  label?: ReactNode;
  /** Shown right-aligned beside the label, e.g. "92 / 100". */
  valueLabel?: ReactNode;
  tone?: "brand" | "pass" | "warn" | "fail";
  size?: "sm" | "md" | "lg";
  /** Draws a marker at this percentage — the pass mark on a score bar. */
  threshold?: number;
  thresholdLabel?: ReactNode;
  className?: string;
};

export function ProgressBar({
  value,
  label,
  valueLabel,
  tone = "brand",
  size = "md",
  threshold,
  thresholdLabel,
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={cx(s.wrap, s[tone], size !== "md" && s[size], className)}>
      {(label || valueLabel) && (
        <div className={s.head}>
          {label && <span className={s.label}>{label}</span>}
          {valueLabel && <span className={s.value}>{valueLabel}</span>}
        </div>
      )}

      <div
        className={s.track}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={typeof label === "string" ? label : undefined}
      >
        <div className={s.fill} style={{ width: `${pct}%` }} />
        {threshold !== undefined && (
          <div
            className={s.threshold}
            style={{ left: `${Math.max(0, Math.min(100, threshold))}%` }}
          />
        )}
      </div>

      {thresholdLabel && (
        <span className={s.thresholdLabel}>{thresholdLabel}</span>
      )}
    </div>
  );
}
