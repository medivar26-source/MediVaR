import { cx } from "@/lib/cx";
import s from "./viz.module.css";

/* ---------- Bar chart ---------- */

export type BarDatum = {
  label: string;
  value: number;
  /** Overrides the automatic ranking. Rarely needed. */
  tone?: "muted" | "brand" | "dark" | "ghost";
  /** Overrides the automatic value pill. */
  tag?: string;
};

/**
 * Ranked emphasis: the highest bar is green, the runner-up is black, the rest
 * are hatched ghosts. Both leaders carry a floating value pill, as in the
 * reference — the number sits above the bar so it never fights the fill.
 */
export function BarChart({
  data,
  max,
  height = 200,
  /** Show value pills on the top N bars. */
  highlight = 2,
  formatTag = (v: number) => String(v),
}: {
  data: BarDatum[];
  max?: number;
  height?: number;
  highlight?: number;
  formatTag?: (value: number) => string;
}) {
  const ceiling = max ?? Math.max(...data.map((d) => d.value), 1);

  // Rank by value, tallest first. Ties keep source order.
  const ranked = [...data]
    .map((d, i) => ({ i, value: d.value }))
    .sort((a, b) => b.value - a.value || a.i - b.i)
    .map((r) => r.i);

  const rankOf = (index: number) => ranked.indexOf(index);

  return (
    <div className={s.chartWrap}>
      <div className={s.chart} style={{ height }}>
        {data.map((d, i) => {
          const rank = rankOf(i);
          const tone =
            d.tone ?? (rank === 0 ? "brand" : rank === 1 ? "dark" : "ghost");
          const tag = d.tag ?? (rank < highlight ? formatTag(d.value) : undefined);

          return (
            <div className={s.chartCol} key={`${d.label}-${i}`}>
              {tag && (
                <span
                  className={cx(s.chartTag, rank === 0 && s.chartTagBrand)}
                  style={{ bottom: `calc(${(d.value / ceiling) * 100}% + 10px)` }}
                >
                  {tag}
                </span>
              )}
              <div
                className={cx(
                  s.chartBar,
                  tone === "brand" && s.chartBarOn,
                  tone === "dark" && s.chartBarDark,
                  tone === "ghost" && s.chartBarGhost,
                )}
                style={{ height: `${(d.value / ceiling) * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className={s.chartAxis}>
        {data.map((d, i) => (
          <span className={s.chartAxisLabel} key={`${d.label}-axis-${i}`}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Trend (line) ---------- */

export type TrendMarker = {
  /** Index into `values`. */
  at: number;
  label: string;
  tone?: "pass" | "warn" | "fail";
};

export type TrendChartProps = {
  values: number[];
  /** Dashed comparison series, e.g. the cohort median. */
  compare?: number[];
  compareLabel?: string;
  seriesLabel?: string;
  labels?: string[];
  markers?: TrendMarker[];
  /** Text equivalent Required, not optional. */
  caption: string;
  height?: number;
};

const TONE_COLOUR: Record<string, string> = {
  pass: "var(--pass)",
  warn: "var(--warn)",
  fail: "var(--fail)",
};

/**
 * Hand-built SVG rather than a charting library: token-driven, no JavaScript
 * shipped, renders on the server.
 *
 * No area fill. A pale wash under the line muddied the reading and clashed
 * with the solid-status rule — the line itself, gridlines and a solid end-cap
 * carry the shape instead.
 */
export function TrendChart({
  values,
  compare,
  compareLabel = "Cohort median",
  seriesLabel = "You",
  labels,
  markers = [],
  caption,
  height = 168,
}: TrendChartProps) {
  const W = 640;
  const H = height;
  const PAD_Y = 16;
  const PAD_R = 46; // room for the axis value labels
  const PAD_L = 4;

  /**
   * A week with no completed session carries a mean of 0, which is an absence
   * and not a measurement — so a line through it would draw a shape the data
   * does not have. Below two real points there is no trend, and
   * the caption already says so; it becomes the whole panel.
   *
   * This is also the empty-series guard. `Math.min(...[])` is `Infinity`, so an
   * account with no history made `span` infinite and every `y()` `NaN`, which
   * reached the DOM as `<line y1="NaN">` and a run of React warnings.
   */
  const plottable = values.filter((v) => v > 0).length >= 2;
  if (!plottable) {
    return (
      <div className={s.trend}>
        <p className={s.trendEmpty}>{caption}</p>
      </div>
    );
  }

  const all = [...values, ...(compare ?? [])];
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  // Round outward so gridlines land on readable numbers.
  const min = Math.floor((rawMin - (rawMax - rawMin) * 0.15) / 5) * 5;
  const max = Math.ceil((rawMax + (rawMax - rawMin) * 0.1) / 5) * 5;
  const span = max - min || 1;

  const x = (i: number, n: number) =>
    PAD_L + (i / Math.max(n - 1, 1)) * (W - PAD_L - PAD_R);
  const y = (v: number) => PAD_Y + (1 - (v - min) / span) * (H - PAD_Y * 2);

  const path = (series: number[]) =>
    series
      .map((v, i) => `${i === 0 ? "M" : "L"}${x(i, series.length)},${y(v)}`)
      .join(" ");

  const ticks = 4;
  const gridValues = Array.from({ length: ticks }, (_, i) =>
    Math.round(min + (span / (ticks - 1)) * i),
  );

  const lastIndex = values.length - 1;

  return (
    <div className={s.trend}>
      <svg
        className={s.trendSvg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={caption}
      >
        {/* gridlines + right-hand value labels */}
        {/* Keyed by tick, not by value: a narrow span rounds two gridlines to
            the same number and React sees a duplicate key. */}
        {gridValues.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--divider)"
              strokeWidth={1}
            />
            <text
              x={W - PAD_R + 8}
              y={y(v) + 4}
              fill="var(--text-disabled)"
              fontSize={11}
              fontWeight={600}
            >
              {v}
            </text>
          </g>
        ))}

        {compare && (
          <path
            d={path(compare)}
            fill="none"
            stroke="var(--text-disabled)"
            strokeWidth={2}
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
        )}

        <path
          d={path(values)}
          fill="none"
          stroke="var(--brand)"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* A marker is an index into `values`; both dashboards derive it as
            `values.length - 1`, which is -1 on an empty series. */}
        {markers
          .filter((m) => m.at >= 0 && m.at < values.length)
          .map((m) => (
            <circle
              key={`${m.at}-${m.label}`}
              cx={x(m.at, values.length)}
              cy={y(values[m.at])}
              r={5.5}
              fill={TONE_COLOUR[m.tone ?? "pass"]}
              stroke="var(--surface)"
              strokeWidth={3}
            />
          ))}

        {/* solid end cap on the latest value */}
        <circle
          cx={x(lastIndex, values.length)}
          cy={y(values[lastIndex])}
          r={6}
          fill="var(--dark)"
          stroke="var(--surface)"
          strokeWidth={3}
        />
      </svg>

      <div className={s.trendFoot}>
        <div className={s.trendKeys}>
          <span className={s.trendKey}>
            <span className={s.keyLine} aria-hidden="true" />
            {seriesLabel}
          </span>
          {compare && (
            <span className={s.trendKey}>
              <span className={s.keyDash} aria-hidden="true" />
              {compareLabel}
            </span>
          )}
        </div>
        {labels && (
          <div className={s.trendGrid}>
            {labels.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        )}
      </div>

      <p className={s.trendCaption}>{caption}</p>
    </div>
  );
}
