import type { ReactNode } from "react";
import { ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./viz.module.css";

/* ---------- Delta pill ---------- */

export function Delta({
  value,
  suffix = "%",
  tone = "auto",
}: {
  value: number;
  suffix?: string;
  /** "dark" is the black pill used once per row for the headline figure. */
  tone?: "auto" | "dark";
}) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cx(
        s.delta,
        tone === "dark" ? s.deltaDark : up ? s.deltaUp : s.deltaDown,
      )}
    >
      <Icon className={s.deltaIcon} strokeWidth={2.5} aria-hidden="true" />
      {up ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

/* ---------- Hero metric ---------- */

export type HeroMetricProps = {
  label: string;
  value: string;
  /** Rendered dimmed after the value — the "/ 100" or ".82" fragment. */
  valueTail?: string;
  delta?: number;
  deltaSuffix?: string;
  /** Second pill, e.g. the absolute change. */
  secondary?: ReactNode;
  compare?: ReactNode;
};

export function HeroMetric({
  label,
  value,
  valueTail,
  delta,
  deltaSuffix,
  secondary,
  compare,
}: HeroMetricProps) {
  return (
    <div className={s.heroMain}>
      <p className={s.heroLabel}>{label}</p>
      <div className={s.heroRow}>
        <span className={s.heroValue}>
          {value}
          {valueTail && <span className={s.heroValueDim}>{valueTail}</span>}
        </span>
        {delta !== undefined && <Delta value={delta} suffix={deltaSuffix} />}
        {secondary}
      </div>
      {compare && <p className={s.heroCompare}>{compare}</p>}
    </div>
  );
}

/* ---------- Stat card ---------- */

export type StatCardProps = {
  label: string;
  value: ReactNode;
  /** One card per row may be "dark"; one may be "accent". Not both on one. */
  variant?: "default" | "dark" | "accent";
  delta?: number;
  deltaSuffix?: string;
  sub?: ReactNode;
  /** Small circular initials shown beside `sub`. */
  subInitials?: string;
  chevron?: boolean;
  wide?: boolean;
};

export function StatCard({
  label,
  value,
  variant = "default",
  delta,
  deltaSuffix,
  sub,
  subInitials,
  chevron,
  wide,
}: StatCardProps) {
  return (
    <div
      className={cx(
        s.stat,
        variant === "dark" && s.statDark,
        variant === "accent" && s.statAccent,
        wide && s.statWide,
      )}
    >
      <span className={s.statLabel}>{label}</span>
      <span className={s.statValue}>{value}</span>
      <div className={s.statFoot}>
        {delta !== undefined && (
          <Delta
            value={delta}
            suffix={deltaSuffix}
            tone={variant === "dark" ? "dark" : "auto"}
          />
        )}
        {(sub || subInitials) && (
          <span className={s.statSub}>
            {subInitials && (
              <span className={s.statAvatar} aria-hidden="true">
                {subInitials}
              </span>
            )}
            {sub}
          </span>
        )}
        {chevron && (
          <span className={s.statChevron} aria-hidden="true">
            <ChevronRight width={14} height={14} strokeWidth={2.5} />
          </span>
        )}
      </div>
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className={s.statRow}>{children}</div>;
}

/* ---------- Distribution ---------- */

export type DistributionSegment = {
  label: string;
  value: number;
  pct: number;
  colour: string;
  icon?: LucideIcon;
};

/**
 * Proportional row of pills. Widths follow the share, so the shape itself
 * carries the distribution while the numbers stay readable.
 */
export function DistributionBar({
  segments,
  action,
}: {
  segments: DistributionSegment[];
  action?: ReactNode;
}) {
  return (
    <div className={s.dist}>
      {segments.map((seg) => (
        <div
          key={seg.label}
          className={s.distSeg}
          style={{ flex: `${Math.max(seg.pct, 8)} 1 0` }}
        >
          <span
            className={s.distDot}
            style={{ background: seg.colour }}
            aria-hidden="true"
          />
          <span className={s.distLabel}>{seg.label}</span>
          <span className={s.distPct}>{seg.pct}%</span>
        </div>
      ))}
      {action}
    </div>
  );
}

/* ---------- Ranked list ---------- */

export type RankedItem = {
  tag: string;
  label: string;
  value: string;
  pct?: number;
};

export function RankedList({ items }: { items: RankedItem[] }) {
  return (
    <div className={s.ranked}>
      {items.map((item) => (
        <div className={s.rankRow} key={item.tag + item.label}>
          <span className={s.rankTag}>{item.tag}</span>
          <span className={s.rankLabel}>{item.label}</span>
          <span className={s.rankValue}>{item.value}</span>
          {item.pct !== undefined && (
            <span className={s.rankPct}>{item.pct}%</span>
          )}
        </div>
      ))}
    </div>
  );
}
