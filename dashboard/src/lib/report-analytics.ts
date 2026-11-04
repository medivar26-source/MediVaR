/**
 * The arithmetic behind the report page — pure, so every figure is testable without a request.
 *
 * The *score* is never decided here. `score_session` wrote it and `lib/data/sessions` reads it as stored.
 * What this file does is **explain** that score and **audit** it:
 *
 *   - break each category into the marks technique earned and the marks time earned;
 *   - place every measured parameter on a gauge scaled in units of its own tolerance;
 *   - show where the lost marks went (a Pareto, so the biggest leak is first);
 *   - compare time against par scene by scene and phase by phase;
 *   - re-derive the scorer's own rules from the stored inputs and say whether they agree.
 *
 * Every formula below is the scorer's stated rule, quoted next to the code that applies it:
 *
 *   verdict          pass ≤ tolerance/2 < borderline ≤ tolerance < fail
 *   timing credit    clamp((limit − time) / (limit − par), 0, 1)
 *   scene marks      maxPoints × (techniqueShare × techniqueCredit + timingShare × timingCredit)
 *   category mark    Σ scene marks, rounded half-up
 *   total            Σ category marks
 */

import { PASS_MARK } from "@/lib/types";
import type {
  Report,
  ReportCategory,
  ReportParameter,
  ReportRules,
  ReportTimelineEntry,
  Verdict,
} from "@/lib/report";

/* ---------- small numeric helpers ---------- */

/** Round to `dp` places without the 2.9000000000000004 noise of a float subtraction. */
export function round(value: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round((value + Number.EPSILON * Math.sign(value)) * f) / f;
}

/** Round half up — the scorer's rule for a category mark. (`Math.round` already rounds .5 up for positives.) */
export function roundHalfUp(value: number): number {
  return Math.floor(value + 0.5);
}

const sum = (values: number[]): number => values.reduce((total, v) => total + v, 0);

/** The rules the scorer states, or the published defaults when a stored report predates them. */
export function rulesOf(report: Pick<Report, "rules">): ReportRules {
  return (
    report.rules ?? {
      techniqueShare: 0.9,
      timingShare: 0.1,
      passMarks: { ...PASS_MARK },
      criticalErrorLimit: 3,
      criticalErrorCap: 59,
      techniqueCredit: { pass: 1, borderline: 0.5, fail: 0 },
    }
  );
}

/* ---------- planned versus achieved: the tolerance gauge ---------- */

export type Zone = Verdict;

/** Where the verdict rule puts a deviation that is `ratio` tolerances away from the plan. */
export function zoneOfRatio(ratio: number): Zone {
  // Compared with a hair of slack so 1.5 mm against a 3.0 mm band is exactly half, not 0.5000000001.
  if (ratio <= 0.5 + 1e-9) return "pass";
  if (ratio <= 1 + 1e-9) return "borderline";
  return "fail";
}

export type Gauge = {
  key: string;
  /** achieved − planned, in the parameter's own unit. Null when nothing was planned. */
  signed: number | null;
  /** |achieved − planned|. */
  abs: number | null;
  /** abs ÷ tolerance — the deviation in tolerance units, so 2.9 mm of ±3 mm and 4.4° of ±4.5° read alike. */
  ratio: number | null;
  /** The zone the verdict rule gives that ratio (what the stored verdict should say). */
  zone: Zone | null;
  /** What the scorer stored. */
  stored: Verdict | null;
  /** True when the stored verdict matches the rule. */
  agrees: boolean;
  /** How much of the tolerance band is left: 1 − ratio, floored at 0. */
  headroom: number | null;
};

export function gaugeOf(parameter: ReportParameter): Gauge {
  if (parameter.planned === null || parameter.achieved === null || !(parameter.tolerance > 0)) {
    return {
      key: parameter.key,
      signed: null,
      abs: null,
      ratio: null,
      zone: null,
      stored: parameter.verdict,
      agrees: true,
      headroom: null,
    };
  }
  const signed = round(parameter.achieved - parameter.planned, 3);
  const abs = Math.abs(signed);
  const ratio = abs / parameter.tolerance;
  const zone = zoneOfRatio(ratio);
  return {
    key: parameter.key,
    signed,
    abs,
    ratio,
    zone,
    stored: parameter.verdict,
    agrees: parameter.verdict === null || parameter.verdict === zone,
    headroom: Math.max(0, 1 - ratio),
  };
}

/**
 * One shared half-axis for every gauge on the page, in tolerance units, so the gauges are comparable:
 * wide enough to show the worst deviation with room to spare, never narrower than ±1.5 tolerances.
 */
export function gaugeAxis(gauges: Gauge[]): number {
  const worst = Math.max(0, ...gauges.map((g) => g.ratio ?? 0));
  return Math.max(1.5, Math.ceil(worst * 1.15 * 4) / 4);
}

export type PrecisionSummary = {
  measured: number;
  byZone: Record<Zone, number>;
  /** Mean of ratio: the average share of the tolerance band that was used. */
  meanUse: number;
  /** √mean(ratio²): like meanUse but it punishes the single big miss. */
  rmsUse: number;
  /** Parameters that finished inside the outer tenth of their band (0.9 < ratio ≤ 1): in, but only just. */
  onTheEdge: Gauge[];
  /** Parameters beyond their band. */
  outside: Gauge[];
  /** The tightest parameter (smallest ratio) and the loosest. */
  best: Gauge | null;
  worst: Gauge | null;
};

export function precisionOf(gauges: Gauge[]): PrecisionSummary {
  const measured = gauges.filter((g) => g.ratio !== null);
  const byZone: Record<Zone, number> = { pass: 0, borderline: 0, fail: 0 };
  for (const g of measured) byZone[g.zone as Zone] += 1;
  const ratios = measured.map((g) => g.ratio as number);
  const sorted = [...measured].sort((a, b) => (a.ratio as number) - (b.ratio as number));
  return {
    measured: measured.length,
    byZone,
    meanUse: ratios.length ? sum(ratios) / ratios.length : 0,
    rmsUse: ratios.length ? Math.sqrt(sum(ratios.map((r) => r * r)) / ratios.length) : 0,
    onTheEdge: measured.filter((g) => (g.ratio as number) > 0.9 && (g.ratio as number) <= 1 + 1e-9),
    outside: measured.filter((g) => (g.ratio as number) > 1 + 1e-9),
    best: sorted[0] ?? null,
    worst: sorted[sorted.length - 1] ?? null,
  };
}

/* ---------- the pass mark ---------- */

export type PassLevel = {
  level: string;
  mark: number;
  met: boolean;
  /** total − mark: positive is headroom, negative is the shortfall. */
  margin: number;
};

export type PassSummary = {
  total: number;
  max: number;
  /** The mark this session was held to. */
  required: number;
  margin: number;
  /** The share of the maximum, 0–100. */
  percent: number;
  /** One row per difficulty, easiest first. */
  levels: PassLevel[];
  criticalErrors: number;
  criticalLimit: number;
  capMark: number;
  /** True when critical errors reached the limit — the cap applies whatever the marks earned. */
  capReached: boolean;
};

const LEVEL_ORDER = ["beginner", "intermediate", "expert"];

export function passSummary(report: Report): PassSummary {
  const rules = rulesOf(report);
  const levels = Object.entries(rules.passMarks)
    .sort(([a], [b]) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b))
    .map(([level, mark]) => ({
      level,
      mark,
      met: report.total >= mark,
      margin: round(report.total - mark, 2),
    }));
  return {
    total: report.total,
    max: report.max,
    required: report.passMark,
    margin: round(report.total - report.passMark, 2),
    percent: report.max > 0 ? round((report.total / report.max) * 100, 1) : 0,
    levels,
    criticalErrors: report.criticalErrors,
    criticalLimit: rules.criticalErrorLimit,
    capMark: rules.criticalErrorCap,
    capReached: report.criticalErrors >= rules.criticalErrorLimit,
  };
}

/* ---------- technique marks versus time marks ---------- */

export type MarkSplit = {
  key: string;
  label: string;
  short: string;
  max: number;
  /** The reported (rounded) category mark. */
  score: number;
  raw: number | null;
  /** Marks on offer for technique / for time, and what was earned of each. */
  techniqueAvailable: number;
  techniqueEarned: number;
  timeAvailable: number;
  timeEarned: number;
  /** True when this split was built from scene marks (false: pre-op planning, which is scored from the plan). */
  fromScenes: boolean;
};

/**
 * Splits every category's marks into technique and time.
 *
 * A timed scene offers `maxPoints`: `techniqueShare` of it for technique and `timingShare` for time. The time
 * marks earned are `maxPoints × timingShare × timingCredit`; technique is whatever the scene earned beyond
 * that. A category with no scenes (pre-operative planning) is entirely technique. Returns `null` when the
 * report carries no per-scene marks (a sample report), because the split cannot be stated without them.
 */
export function markSplits(report: Report): MarkSplit[] | null {
  const rules = rulesOf(report);
  const scored = report.timeline.filter((t) => t.maxPoints != null && t.points != null && t.timingCredit != null);
  if (scored.length === 0) return null;

  return report.categories.map((category) => {
    const scenes = scored.filter((t) => t.category === category.key && (t.maxPoints ?? 0) > 0);
    if (scenes.length === 0) {
      const earned = category.raw ?? category.score;
      return {
        key: category.key,
        label: category.label,
        short: category.short,
        max: category.max,
        score: category.score,
        raw: category.raw ?? null,
        techniqueAvailable: category.max,
        techniqueEarned: earned,
        timeAvailable: 0,
        timeEarned: 0,
        fromScenes: false,
      };
    }
    const offered = sum(scenes.map((t) => t.maxPoints as number));
    const earned = sum(scenes.map((t) => t.points as number));
    const timeEarned = sum(scenes.map((t) => (t.maxPoints as number) * rules.timingShare * (t.timingCredit as number)));
    return {
      key: category.key,
      label: category.label,
      short: category.short,
      max: category.max,
      score: category.score,
      raw: category.raw ?? null,
      techniqueAvailable: offered * rules.techniqueShare,
      techniqueEarned: earned - timeEarned,
      timeAvailable: offered * rules.timingShare,
      timeEarned,
      fromScenes: true,
    };
  });
}

export type MarkTotals = {
  techniqueAvailable: number;
  techniqueEarned: number;
  timeAvailable: number;
  timeEarned: number;
  /** The unrounded total, Σ of the raw category marks (or of technique + time when raw is absent). */
  rawTotal: number;
  /** Total as reported minus the unrounded total: what half-up rounding added (positive) or took (negative). */
  roundingEffect: number;
};

export function markTotals(report: Report, splits: MarkSplit[]): MarkTotals {
  const rawTotal = sum(splits.map((s) => s.raw ?? s.techniqueEarned + s.timeEarned));
  return {
    techniqueAvailable: sum(splits.map((s) => s.techniqueAvailable)),
    techniqueEarned: sum(splits.map((s) => s.techniqueEarned)),
    timeAvailable: sum(splits.map((s) => s.timeAvailable)),
    timeEarned: sum(splits.map((s) => s.timeEarned)),
    rawTotal,
    roundingEffect: round(sum(splits.map((s) => s.score)) - rawTotal, 2),
  };
}

/* ---------- where the marks went ---------- */

export type Leak = {
  key: string;
  label: string;
  short: string;
  max: number;
  score: number;
  lost: number;
  /** lost ÷ total lost, 0–1. */
  share: number;
  /** Running total of share, down the sorted list — the Pareto line. */
  cumulative: number;
};

/** Marks lost per category, biggest first, with each one's share of everything lost. */
export function leaksOf(categories: ReportCategory[]): { leaks: Leak[]; totalLost: number } {
  const rows = categories
    .map((c) => ({ c, lost: Math.max(0, c.max - c.score) }))
    .filter((row) => row.lost > 0)
    .sort((a, b) => b.lost - a.lost || a.c.label.localeCompare(b.c.label));
  const totalLost = sum(rows.map((r) => r.lost));
  let running = 0;
  const leaks = rows.map(({ c, lost }) => {
    running += lost;
    return {
      key: c.key,
      label: c.label,
      short: c.short,
      max: c.max,
      score: c.score,
      lost,
      share: totalLost > 0 ? lost / totalLost : 0,
      cumulative: totalLost > 0 ? running / totalLost : 0,
    };
  });
  return { leaks, totalLost };
}

/* ---------- pace ---------- */

export type PaceScene = {
  scene: string;
  part: string;
  label: string;
  durationS: number;
  parS: number;
  limitS: number | null;
  /** durationS − parS. Positive is over par. */
  deltaS: number;
  /** Elapsed time at the end of this scene, and the par clock at the same point. */
  elapsedS: number;
  parElapsedS: number;
  /** Over the scene's own time limit. */
  overLimit: boolean;
  outcome: Verdict | null;
};

export type PacePart = { part: string; durationS: number; parS: number; deltaS: number; scenes: number };

export type PaceSummary = {
  scenes: PaceScene[];
  parts: PacePart[];
  totalS: number;
  parS: number;
  deltaS: number;
  /** par ÷ actual. 1.0 is exactly on par; 0.6 means the operation took 1/0.6 = 1.67× par. */
  efficiency: number;
  /** actual ÷ par − 1, as a share. */
  overrun: number;
  overParCount: number;
  overLimitCount: number;
  slowest: PaceScene[];
  fastest: PaceScene[];
};

/** The scene's time credit by the scorer's rule, or null when no limit is stored to compute it from. */
export function timingCreditOf(durationS: number, parS: number, limitS: number | null): number | null {
  if (limitS === null || limitS <= parS) return null;
  return Math.min(1, Math.max(0, (limitS - durationS) / (limitS - parS)));
}

export function paceOf(timeline: ReportTimelineEntry[]): PaceSummary | null {
  const timed = timeline.filter((t) => t.reached && t.durationS !== null && t.parTimeS !== null);
  if (timed.length === 0) return null;

  let elapsed = 0;
  let parElapsed = 0;
  const scenes: PaceScene[] = timed.map((t) => {
    const durationS = t.durationS as number;
    const parS = t.parTimeS as number;
    elapsed += durationS;
    parElapsed += parS;
    return {
      scene: t.scene,
      part: t.part,
      label: t.label,
      durationS,
      parS,
      limitS: t.maxTimeS ?? null,
      deltaS: durationS - parS,
      elapsedS: elapsed,
      parElapsedS: parElapsed,
      overLimit: t.maxTimeS != null && durationS > t.maxTimeS,
      outcome: t.outcome,
    };
  });

  const parts: PacePart[] = [];
  for (const scene of scenes) {
    const existing = parts.find((p) => p.part === scene.part);
    if (existing) {
      existing.durationS += scene.durationS;
      existing.parS += scene.parS;
      existing.deltaS += scene.deltaS;
      existing.scenes += 1;
    } else {
      parts.push({ part: scene.part, durationS: scene.durationS, parS: scene.parS, deltaS: scene.deltaS, scenes: 1 });
    }
  }

  const totalS = elapsed;
  const parS = parElapsed;
  const byDelta = [...scenes].sort((a, b) => b.deltaS - a.deltaS || a.scene.localeCompare(b.scene, undefined, { numeric: true }));
  return {
    scenes,
    parts,
    totalS,
    parS,
    deltaS: totalS - parS,
    efficiency: totalS > 0 ? parS / totalS : 0,
    overrun: parS > 0 ? totalS / parS - 1 : 0,
    overParCount: scenes.filter((s) => s.deltaS > 0).length,
    overLimitCount: scenes.filter((s) => s.overLimit).length,
    slowest: byDelta.slice(0, 3),
    fastest: byDelta.slice(-3).reverse(),
  };
}

/* ---------- the run, counted ---------- */

export type RunTally = {
  reached: number;
  total: number;
  pass: number;
  borderline: number;
  fail: number;
  /** pass ÷ reached, 0–1. */
  cleanRate: number;
  warnings: number;
  scenesWithWarnings: number;
};

export function tallyOf(timeline: ReportTimelineEntry[]): RunTally {
  const reached = timeline.filter((t) => t.reached);
  const count = (v: Verdict) => reached.filter((t) => t.outcome === v).length;
  return {
    reached: reached.length,
    total: timeline.length,
    pass: count("pass"),
    borderline: count("borderline"),
    fail: count("fail"),
    cleanRate: reached.length ? count("pass") / reached.length : 0,
    warnings: sum(reached.map((t) => t.warnings)),
    scenesWithWarnings: reached.filter((t) => t.warnings > 0).length,
  };
}

/* ---------- the audit ---------- */

export type Check = {
  id: string;
  label: string;
  /** The rule applied, in words. */
  rule: string;
  /** What was found, with the figures. */
  detail: string;
  ok: boolean;
};

/**
 * Re-derives what can be re-derived from the stored report and says whether it agrees.
 *
 * A check only appears when the report carries what it needs — a sample report with no per-scene marks gets
 * the checks that need none, never a fabricated pass. Each check states the rule it applied and the figures.
 */
export function auditOf(report: Report): Check[] {
  const checks: Check[] = [];
  const rules = rulesOf(report);

  // 1. The categories add up to the total (unless the cap replaced it).
  const categorySum = sum(report.categories.map((c) => c.score));
  if (report.cappedByCriticalErrors && report.total < categorySum) {
    checks.push({
      id: "total",
      label: "Total after the critical-error cap",
      rule: `${report.criticalErrors} critical errors reach the limit of ${rules.criticalErrorLimit}; the total may not exceed ${rules.criticalErrorCap}`,
      detail: `Categories earned ${categorySum}; reported total ${report.total} (cap ${rules.criticalErrorCap})`,
      ok: report.total <= rules.criticalErrorCap,
    });
  } else {
    checks.push({
      id: "total",
      label: "Total equals the sum of the categories",
      rule: "total = Σ category marks",
      detail: `${report.categories.map((c) => c.score).join(" + ")} = ${categorySum}; reported ${report.total}`,
      ok: categorySum === report.total,
    });
  }

  // 2. The maxima add up to the maximum.
  const maxSum = sum(report.categories.map((c) => c.max));
  checks.push({
    id: "max",
    label: "Category maxima add up to the maximum",
    rule: "Σ category max = maximum",
    detail: `${report.categories.map((c) => c.max).join(" + ")} = ${maxSum}; reported ${report.max}`,
    ok: maxSum === report.max,
  });

  // 3. Rounding: each category mark is its unrounded mark rounded half up.
  const withRaw = report.categories.filter((c) => c.raw != null);
  if (withRaw.length > 0) {
    const bad = withRaw.filter((c) => roundHalfUp(c.raw as number) !== c.score);
    checks.push({
      id: "rounding",
      label: "Category marks are rounded half up",
      rule: "category mark = ⌊unrounded + ½⌋",
      detail:
        bad.length === 0
          ? `All ${withRaw.length} categories round correctly`
          : `${bad.map((c) => `${c.short} ${c.raw} → ${roundHalfUp(c.raw as number)}, reported ${c.score}`).join("; ")}`,
      ok: bad.length === 0,
    });
  }

  // 4. A category's scene marks add up to its unrounded mark.
  const sceneMarked = report.timeline.filter((t) => t.points != null && t.category);
  if (sceneMarked.length > 0 && withRaw.length > 0) {
    const bad: string[] = [];
    let checked = 0;
    for (const category of withRaw) {
      const scenes = sceneMarked.filter((t) => t.category === category.key);
      if (scenes.length === 0) continue;
      checked += 1;
      const total = sum(scenes.map((t) => t.points as number));
      if (Math.abs(total - (category.raw as number)) > 0.011) bad.push(`${category.short} ${round(total, 3)} vs ${category.raw}`);
    }
    checks.push({
      id: "scene-sum",
      label: "Scene marks add up to each category",
      rule: "Σ scene marks = unrounded category mark (±0.01)",
      detail: bad.length === 0 ? `${checked} categories reconcile with their scenes` : bad.join("; "),
      ok: bad.length === 0,
    });
  }

  // 5. Every scene: earned + lost = offered.
  const offered = report.timeline.filter((t) => t.maxPoints != null && t.points != null);
  if (offered.length > 0) {
    const timedScenes = offered.filter((t) => (t.maxPoints as number) > 0);
    const over = timedScenes.filter((t) => (t.points as number) > (t.maxPoints as number) + 1e-6);
    checks.push({
      id: "scene-bounds",
      label: "No scene earned more than it offered",
      rule: "0 ≤ scene marks ≤ scene maximum",
      detail:
        over.length === 0
          ? `${timedScenes.length} scenes within bounds`
          : `Over: ${over.map((t) => t.scene).join(", ")}`,
      ok: over.length === 0,
    });
  }

  // 6. Time credit follows the scorer's rule.
  const credited = report.timeline.filter(
    (t) => t.timingCredit != null && t.durationS !== null && t.parTimeS !== null && t.maxTimeS != null,
  );
  if (credited.length > 0) {
    const bad = credited.filter((t) => {
      const expected = timingCreditOf(t.durationS as number, t.parTimeS as number, t.maxTimeS as number);
      return expected !== null && Math.abs(expected - (t.timingCredit as number)) > 0.0006;
    });
    checks.push({
      id: "timing",
      label: "Time credit follows the par rule",
      rule: "credit = (limit − time) ÷ (limit − par), held between 0 and 1",
      detail:
        bad.length === 0
          ? `${credited.length} scenes recomputed from their times; all match`
          : `Differs on ${bad.map((t) => t.scene).join(", ")}`,
      ok: bad.length === 0,
    });
  }

  // 7. Every parameter's verdict follows the tolerance rule.
  const gauges = report.parameters.map(gaugeOf).filter((g) => g.ratio !== null);
  if (gauges.length > 0) {
    const bad = gauges.filter((g) => !g.agrees);
    checks.push({
      id: "verdicts",
      label: "Parameter verdicts follow the tolerance rule",
      rule: "pass ≤ ½ tolerance < borderline ≤ tolerance < fail",
      detail:
        bad.length === 0
          ? `${gauges.length} parameters recomputed from planned and achieved; all match`
          : bad.map((g) => `${g.key}: rule says ${g.zone}, stored ${g.stored}`).join("; "),
      ok: bad.length === 0,
    });
  }

  // 8. The pass flag follows the pass mark.
  const expectedPass = report.total >= report.passMark && report.criticalErrors < rules.criticalErrorLimit;
  checks.push({
    id: "verdict",
    label: "The pass verdict follows the pass mark",
    rule: `pass when total ≥ ${report.passMark} and the critical-error limit is not reached`,
    detail: `${report.total} against ${report.passMark}, ${report.criticalErrors} of ${rules.criticalErrorLimit} critical errors → ${expectedPass ? "pass" : "fail"}; stored ${report.passed ? "pass" : "fail"}`,
    ok: expectedPass === report.passed,
  });

  // 9. The deduction list agrees with the marks the scenes lost.
  const lostScenes = report.timeline.filter((t) => t.maxPoints != null && t.points != null);
  if (lostScenes.length > 0 && report.feedback.length > 0) {
    const bad = report.feedback.filter((f) => {
      const scene = lostScenes.find((t) => t.scene === f.scene);
      if (!scene) return false;
      const lost = (scene.maxPoints as number) - (scene.points as number);
      return Math.abs(lost - f.points) > 0.051;
    });
    checks.push({
      id: "deductions",
      label: "Deductions match the scene marks",
      rule: "listed deduction = scene maximum − scene marks (to 0.1)",
      detail: bad.length === 0 ? `${report.feedback.length} deductions agree with their scenes` : `Differs on ${bad.map((f) => f.scene).join(", ")}`,
      ok: bad.length === 0,
    });
  }

  return checks;
}

/* ---------- plain-words findings ---------- */

export type Finding = {
  tone: "good" | "watch" | "act";
  title: string;
  text: string;
};

const pct = (value: number, dp = 0) => `${round(value * 100, dp)}%`;

/**
 * What the figures say, as sentences. Every clause is read off a number computed above; none of it is a
 * judgement the scorer did not make. Ordered by how much it matters to the next attempt.
 */
export function findingsOf(report: Report, ctx: {
  gauges: Gauge[];
  precision: PrecisionSummary;
  leaks: Leak[];
  totalLost: number;
  pace: PaceSummary | null;
  tally: RunTally;
}): Finding[] {
  const out: Finding[] = [];
  const label = new Map(report.parameters.map((p) => [p.key, p.label]));
  const unitOf = new Map(report.parameters.map((p) => [p.key, p.unit]));
  const fmt = (g: Gauge) => {
    const u = unitOf.get(g.key) ?? "";
    const tol = report.parameters.find((p) => p.key === g.key)?.tolerance ?? 0;
    const sign = (g.signed as number) > 0 ? "+" : "";
    return `${label.get(g.key)} ${sign}${g.signed}${u && u !== "°" ? ` ${u}` : u} (limit ±${tol})`;
  };

  // The biggest leak.
  const top = ctx.leaks[0];
  if (top && ctx.totalLost > 0) {
    out.push({
      tone: top.share >= 0.4 ? "act" : "watch",
      title: `${top.label} cost the most`,
      text: `${top.lost} of the ${ctx.totalLost} marks lost (${pct(top.share)}) left through ${top.label.toLowerCase()}. Recovering all of it would have taken the total from ${report.total} to ${report.total + top.lost}.`,
    });
  }

  // Parameters beyond their band.
  if (ctx.precision.outside.length > 0) {
    out.push({
      tone: "act",
      title: `${ctx.precision.outside.length} measurement${ctx.precision.outside.length === 1 ? "" : "s"} outside tolerance`,
      text: ctx.precision.outside.map(fmt).join("; ") + ".",
    });
  }

  // In, but only just.
  if (ctx.precision.onTheEdge.length >= 2) {
    out.push({
      tone: "watch",
      title: `${ctx.precision.onTheEdge.length} measurements finished at the edge of their band`,
      text: `Each used more than 90% of its tolerance without crossing it, so a slightly larger drift would have turned each into a fail. On average the ${ctx.precision.measured} measured parameters used ${pct(ctx.precision.meanUse)} of their tolerance.`,
    });
  }

  // Pace.
  if (ctx.pace) {
    const over = ctx.pace.deltaS > 0;
    const slow = ctx.pace.slowest[0];
    out.push({
      tone: ctx.pace.overLimitCount > 0 ? "act" : over ? "watch" : "good",
      title: over ? "Slower than par" : "Inside par",
      text: `${ctx.pace.overParCount} of ${ctx.pace.scenes.length} scenes ran over par; the operation took ${pct(ctx.pace.overrun)} ${over ? "longer" : "less"} than par overall${slow && slow.deltaS > 0 ? `, and ${slow.label} lost the most time (${slow.deltaS} s over)` : ""}.${ctx.pace.overLimitCount === 0 ? " No scene exceeded its time limit." : ` ${ctx.pace.overLimitCount} scene${ctx.pace.overLimitCount === 1 ? "" : "s"} exceeded the time limit.`}`,
    });
  }

  // Strengths.
  const full = report.categories.filter((c) => c.max > 0 && c.accuracy >= 100);
  const tight = ctx.precision.best;
  if (full.length > 0 || (tight && (tight.ratio as number) <= 0.5)) {
    const parts: string[] = [];
    if (full.length > 0) parts.push(`full technique marks in ${full.map((c) => c.label.toLowerCase()).join(" and ")}`);
    if (tight && (tight.ratio as number) <= 0.5) parts.push(`${label.get(tight.key)?.toLowerCase()} landed ${(tight.abs as number)}${unitOf.get(tight.key) ?? ""} from plan, ${pct(tight.ratio as number)} of its band`);
    out.push({ tone: "good", title: "What held up", text: parts.join("; ").replace(/^./, (c) => c.toUpperCase()) + "." });
  }

  return out;
}
