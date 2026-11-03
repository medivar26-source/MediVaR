import type { Leak, PaceSummary } from "@/lib/report-analytics";
import { round } from "@/lib/report-analytics";
import { clock } from "@/lib/format";
import c from "./charts.module.css";

/**
 * The report's drawings. Server components that emit plain SVG: no chart library, no client JavaScript, and
 * every coordinate below is computed from the numbers it draws — nothing is placed by eye.
 */

const TAU = Math.PI * 2;

/** The point at `fraction` (0–1) of a full turn clockwise from twelve o'clock, `r` from the centre. */
function polar(cx: number, cy: number, r: number, fraction: number): [number, number] {
  const angle = fraction * TAU - Math.PI / 2;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

const pt = (p: [number, number]) => `${round(p[0], 2)},${round(p[1], 2)}`;

/* ---------- the score ring ---------- */

/**
 * The total as an arc of a full circle: `total ÷ max` of the circumference, with a tick where the pass mark
 * falls. The arc length is `circumference × share`, so 74 of 100 is exactly 74% of the way round.
 */
export function ScoreRing({
  total,
  max,
  passMark,
  passed,
  size = 232,
}: {
  total: number;
  max: number;
  passMark: number;
  passed: boolean;
  size?: number;
}) {
  const stroke = 16;
  const r = (size - stroke) / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = TAU * r;
  const share = max > 0 ? Math.min(1, Math.max(0, total / max)) : 0;
  const passShare = max > 0 ? Math.min(1, passMark / max) : 0;
  const tickInner = polar(cx, cy, r - stroke / 2 - 5, passShare);
  const tickOuter = polar(cx, cy, r + stroke / 2 + 5, passShare);
  const tickLabel = polar(cx, cy, r + stroke / 2 + 17, passShare);

  return (
    <svg
      className={c.ring}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Total score ${total} out of ${max}. The pass mark is ${passMark}.`}
    >
      <circle className={c.ringTrack} cx={cx} cy={cy} r={r} strokeWidth={stroke} fill="none" />
      <circle
        className={passed ? c.ringPass : c.ringFail}
        cx={cx}
        cy={cy}
        r={r}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${round(circumference, 3)}`}
        strokeDashoffset={round(circumference * (1 - share), 3)}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ ["--circ" as string]: round(circumference, 3) }}
      />
      <line className={c.ringTick} x1={tickInner[0]} y1={tickInner[1]} x2={tickOuter[0]} y2={tickOuter[1]} />
      <text className={c.ringTickLabel} x={tickLabel[0]} y={tickLabel[1]} textAnchor="middle" dominantBaseline="middle">
        {passMark}
      </text>
      <text className={c.ringValue} x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle">
        {total}
      </text>
      <text className={c.ringMax} x={cx} y={cy + 34} textAnchor="middle" dominantBaseline="middle">
        of {max}
      </text>
    </svg>
  );
}

/* ---------- the category radar ---------- */

export type RadarSpoke = { key: string; label: string; short: string; share: number; score: number; max: number };

/**
 * One spoke per category, each as long as the share of its marks earned (`score ÷ max`). The dashed ring is the
 * pass mark as a share of the total, so a spoke that stops inside it is a category that, held across the whole
 * operation, would not have passed.
 */
export function CategoryRadar({ spokes, passShare }: { spokes: RadarSpoke[]; passShare: number }) {
  if (spokes.length < 3) return null;
  const W = 420;
  const H = 340;
  const cx = W / 2;
  const cy = H / 2 + 4;
  const R = 112;
  const n = spokes.length;
  const at = (i: number, share: number) => polar(cx, cy, R * share, i / n);
  const ring = (share: number) => spokes.map((_, i) => pt(at(i, share))).join(" ");
  const shape = spokes.map((s, i) => pt(at(i, Math.min(1, Math.max(0, s.share))))).join(" ");

  return (
    <svg
      className={c.radar}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Share of marks earned in each category: ${spokes.map((s) => `${s.label} ${round(s.share * 100, 0)}%`).join(", ")}.`}
    >
      {[0.25, 0.5, 0.75, 1].map((share) => (
        <polygon key={share} className={share === 1 ? c.radarOuter : c.radarRing} points={ring(share)} />
      ))}
      {spokes.map((s, i) => {
        const [x, y] = at(i, 1);
        return <line key={s.key} className={c.radarAxis} x1={cx} y1={cy} x2={x} y2={y} />;
      })}
      <polygon className={c.radarPass} points={ring(passShare)} />
      <polygon className={c.radarShape} points={shape} />
      {spokes.map((s, i) => {
        const [x, y] = at(i, Math.min(1, Math.max(0, s.share)));
        const [lx, ly] = polar(cx, cy, R + 20, i / n);
        const anchor = lx > cx + 8 ? "start" : lx < cx - 8 ? "end" : "middle";
        const weak = s.share < passShare;
        return (
          <g key={s.key}>
            <circle className={weak ? c.radarDotWeak : c.radarDot} cx={x} cy={y} r={4.5} />
            <text className={c.radarLabel} x={lx} y={ly - 6} textAnchor={anchor} dominantBaseline="middle">
              {s.short}
            </text>
            <text className={weak ? c.radarValueWeak : c.radarValue} x={lx} y={ly + 8} textAnchor={anchor} dominantBaseline="middle">
              {s.score}/{s.max}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ---------- the Pareto of lost marks ---------- */

/**
 * Bars are the marks each category lost, largest first; the line is the running share of everything lost. Both
 * are drawn against the same total — the left axis runs 0 to the marks lost, the right axis 0 to 100% — so the
 * first bar tops out exactly where the line begins.
 */
export function ParetoChart({ leaks, totalLost }: { leaks: Leak[]; totalLost: number }) {
  if (leaks.length === 0 || totalLost <= 0) return null;
  const W = 600;
  const H = 300;
  const m = { l: 44, r: 46, t: 26, b: 52 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const slot = iw / leaks.length;
  const barW = Math.min(64, slot * 0.58);
  const y = (frac: number) => m.t + ih * (1 - frac);
  const xMid = (i: number) => m.l + slot * i + slot / 2;
  const line = leaks.map((l, i) => `${round(xMid(i), 2)},${round(y(l.cumulative), 2)}`).join(" ");

  return (
    <svg
      className={c.pareto}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Marks lost by category, largest first: ${leaks.map((l) => `${l.label} ${l.lost}`).join(", ")}. ${totalLost} marks lost in all.`}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => (
        <g key={frac}>
          <line className={frac === 0 ? c.axisBase : c.grid} x1={m.l} x2={W - m.r} y1={y(frac)} y2={y(frac)} />
          <text className={c.tick} x={m.l - 8} y={y(frac)} textAnchor="end" dominantBaseline="middle">
            {round(totalLost * frac, 1)}
          </text>
          <text className={c.tick} x={W - m.r + 8} y={y(frac)} textAnchor="start" dominantBaseline="middle">
            {round(frac * 100, 0)}%
          </text>
        </g>
      ))}
      <text className={c.axisTitle} x={m.l - 8} y={m.t - 12} textAnchor="end">
        marks
      </text>
      {leaks.map((l, i) => {
        const h = ih * (l.lost / totalLost);
        const x = xMid(i) - barW / 2;
        return (
          <g key={l.key}>
            <rect className={i === 0 ? c.paretoTop : c.paretoBar} x={x} y={y(l.lost / totalLost)} width={barW} height={h} rx={6} />
            <text className={c.paretoValue} x={xMid(i)} y={y(l.lost / totalLost) - 7} textAnchor="middle">
              −{l.lost}
            </text>
            <text className={c.catLabel} x={xMid(i)} y={H - m.b + 20} textAnchor="middle">
              {l.short}
            </text>
            <text className={c.catSub} x={xMid(i)} y={H - m.b + 35} textAnchor="middle">
              {round(l.share * 100, 0)}% of loss
            </text>
          </g>
        );
      })}
      <polyline className={c.paretoLine} points={line} fill="none" />
      {leaks.map((l, i) => (
        <circle key={l.key} className={c.paretoDot} cx={xMid(i)} cy={y(l.cumulative)} r={4} />
      ))}
    </svg>
  );
}

/* ---------- the pace chart ---------- */

/**
 * The operation's clock against par's clock, scene by scene. Each point is the time elapsed when that scene
 * ended; the shaded band between the two lines is the time lost (or gained) so far, and the dots carry the
 * scene's outcome.
 */
export function PaceChart({ pace }: { pace: PaceSummary }) {
  const scenes = pace.scenes;
  const n = scenes.length;
  if (n < 2) return null;
  const W = 680;
  const H = 300;
  const m = { l: 52, r: 24, t: 24, b: 44 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const top = Math.max(pace.totalS, pace.parS);
  const stepS = top > 1800 ? 600 : top > 900 ? 300 : 120;
  const yMax = Math.ceil(top / stepS) * stepS;
  const x = (i: number) => m.l + (iw * (i + 1)) / n;
  const x0 = m.l;
  const y = (s: number) => m.t + ih * (1 - s / yMax);

  const actual = [`${x0},${y(0)}`, ...scenes.map((s, i) => `${round(x(i), 2)},${round(y(s.elapsedS), 2)}`)];
  const par = [`${x0},${y(0)}`, ...scenes.map((s, i) => `${round(x(i), 2)},${round(y(s.parElapsedS), 2)}`)];
  const band = [...actual, ...[...par].reverse()].join(" ");
  const grid: number[] = [];
  for (let v = 0; v <= yMax; v += stepS) grid.push(v);
  const labelEvery = Math.max(1, Math.ceil(n / 12));
  const last = scenes[n - 1];

  return (
    <svg
      className={c.pace}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Elapsed time against par across ${n} scenes. The operation took ${clock(pace.totalS)} against a par of ${clock(pace.parS)}.`}
    >
      {grid.map((v) => (
        <g key={v}>
          <line className={v === 0 ? c.axisBase : c.grid} x1={m.l} x2={W - m.r} y1={y(v)} y2={y(v)} />
          <text className={c.tick} x={m.l - 8} y={y(v)} textAnchor="end" dominantBaseline="middle">
            {clock(v)}
          </text>
        </g>
      ))}
      <polygon className={pace.deltaS > 0 ? c.paceLost : c.paceGained} points={band} />
      <polyline className={c.paceParLine} points={par.join(" ")} fill="none" />
      <polyline className={c.paceLine} points={actual.join(" ")} fill="none" />
      {scenes.map((s, i) => (
        <circle
          key={s.scene}
          className={s.outcome === "fail" ? c.dotFail : s.outcome === "borderline" ? c.dotWarn : c.dotPass}
          cx={x(i)}
          cy={y(s.elapsedS)}
          r={4.5}
        >
          <title>{`${s.scene} ${s.label}: ${clock(s.durationS)} against par ${clock(s.parS)} — elapsed ${clock(s.elapsedS)}`}</title>
        </circle>
      ))}
      {scenes.map((s, i) =>
        i % labelEvery === 0 || i === n - 1 ? (
          <text key={s.scene} className={c.tick} x={x(i)} y={H - m.b + 18} textAnchor="middle">
            {s.scene}
          </text>
        ) : null,
      )}
      <text className={c.axisTitle} x={m.l + iw / 2} y={H - 6} textAnchor="middle">
        scene
      </text>
      <text className={c.paceEnd} x={x(n - 1) - 6} y={y(last.elapsedS) - 12} textAnchor="end">
        {clock(last.elapsedS)}
      </text>
      <text className={c.paceEndPar} x={x(n - 1) - 6} y={y(last.parElapsedS) + 20} textAnchor="end">
        par {clock(last.parElapsedS)}
      </text>
    </svg>
  );
}
