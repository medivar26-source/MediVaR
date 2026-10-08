/**
 * Plain-language reading of a fit, for someone seeing it for the first time.
 *
 * The gauges give the numbers; this says what they mean and what to do next, in the order a
 * surgeon would think about it: are the bone edges marked, is the size right, is the position right.
 * It never invents a rule: every threshold it mentions comes from the fit engine.
 */

import {
  FEMORAL_NOTCH_LIMIT_MM,
  DEFAULT_TIBIAL_FIT_THRESHOLDS,
  evaluateFemoralFit,
  evaluateTibialFit,
  type FemoralFitResult,
  type FitTone,
  type TibialFitResult,
} from "./tkr_templates";
import {
  MARKER_KEYS,
  autoFitFemoral,
  autoFitTibial,
  type BoneModel,
  type FemoralSizeRow,
  type MarkerKey,
  type TibialSizeRow,
} from "./fit_markers";

export type AdviceStep = 1 | 2 | 3 | 4;

export type Advice = {
  /** "none" while there is nothing to judge yet. */
  tone: FitTone | "none";
  /** 1 mark the edges, 2 choose the size, 3 position it, 4 confirm. */
  step: AdviceStep;
  headline: string;
  detail: string;
};

export const ADVICE_STEPS: { step: AdviceStep; label: string }[] = [
  { step: 1, label: "Mark edges" },
  { step: 2, label: "Choose size" },
  { step: 3, label: "Position" },
  { step: 4, label: "Confirm" },
];

const SIDE_NAME: Record<MarkerKey, string> = {
  medial: "inner (medial)",
  lateral: "outer (lateral)",
  anterior: "front (anterior)",
  posterior: "back (posterior)",
};

/** Moving away from the side that sticks out. */
const MOVE_AWAY: Record<MarkerKey, string> = {
  medial: "towards the outer (lateral) side",
  lateral: "towards the inner (medial) side",
  anterior: "backwards",
  posterior: "forwards",
};

const LIMIT = DEFAULT_TIBIAL_FIT_THRESHOLDS.maxOverhangMm;
const mm = (v: number) => `${v.toFixed(1)} mm`;

type Common = {
  placed: number;
  markersConfirmed: boolean;
  bone: BoneModel;
  size: number;
  rotationDeg: number;
};

/** What to say before there is a fit to judge. */
function beforeFit({ placed, markersConfirmed, bone }: Common): Advice | undefined {
  if (placed < MARKER_KEYS.length) {
    const left = MARKER_KEYS.length - placed;
    return {
      tone: "none",
      step: 1,
      headline: "Start by marking the edges of the bone",
      detail: `${left} edge${left === 1 ? "" : "s"} left to place. The implant is measured against these marks, so put each one on the outer edge of the bone.`,
    };
  }
  if (!bone.complete) {
    return { tone: "none", step: 1, headline: "Loading the scans…", detail: "The fit appears as soon as both scans have loaded." };
  }
  if (!markersConfirmed) {
    return {
      tone: "none",
      step: 1,
      headline: "Check the four marks, then confirm them",
      detail: "Make sure each mark sits on the outer edge of the bone. When they look right, press “These edges are right”.",
    };
  }
  return undefined;
}

function overhangList(sides: Record<MarkerKey, number>) {
  return (Object.entries(sides) as [MarkerKey, number][])
    .filter(([, v]) => v > LIMIT)
    .sort((a, b) => b[1] - a[1]);
}

export function adviseTibial(
  input: Common & { fit?: TibialFitResult; ranking: { rows: TibialSizeRow[]; recommended?: number } },
): Advice {
  const early = beforeFit(input);
  if (early) return early;
  const { fit, bone, size, rotationDeg, ranking } = input;
  if (!fit) return { tone: "none", step: 1, headline: "Waiting for a fit", detail: "Place the implant to see how it sits." };

  if (fit.worstTone === "pass") {
    return {
      tone: "pass",
      step: 4,
      headline: `Size ${size} fits well`,
      detail: `It covers ${fit.coveragePct.toFixed(0)}% of the bone and nothing sticks out by more than ${mm(LIMIT)}. If you are happy with it, confirm.`,
    };
  }

  const tone = fit.worstTone;
  const best = autoFitTibial(size, bone, rotationDeg);
  const afterAuto = evaluateTibialFit(size, best.x, best.y, bone.apMm!, bone.mlMm!, rotationDeg, undefined, undefined, bone.orientation);
  const recommended = ranking.recommended;
  const tryOther = recommended !== undefined && recommended !== size;

  const over = overhangList({
    medial: fit.medialOverhangMm,
    lateral: fit.lateralOverhangMm,
    anterior: fit.anteriorOverhangMm,
    posterior: fit.posteriorOverhangMm,
  } as Record<MarkerKey, number>);

  // If re-centring alone gives a good fit, the size is fine and the position is what to fix.
  if (afterAuto.worstTone === "pass") {
    if (over.length > 0) {
      const [side, value] = over[0];
      return {
        tone,
        step: 3,
        headline: `The ${SIDE_NAME[side]} edge sticks out ${mm(value)}`,
        detail: `Size ${size} suits this bone, it is just off-centre. Move the implant about ${mm(value)} ${MOVE_AWAY[side]}, or press Auto-fit position. The limit is ${mm(LIMIT)}.`,
      };
    }
    return {
      tone,
      step: 3,
      headline: `Size ${size} is not centred on the bone`,
      detail: `It covers ${fit.coveragePct.toFixed(0)}% of the bone (target ${DEFAULT_TIBIAL_FIT_THRESHOLDS.minCoveragePct}%). Press Auto-fit position to centre it.`,
    };
  }

  // Moving will not fix it, so the size is the problem.
  if (over.length >= 1) {
    const names = over.map(([k]) => SIDE_NAME[k]).join(" and ");
    return {
      tone,
      step: 2,
      headline: over.length >= 2 ? `Size ${size} is too big for this bone` : `Size ${size} is a poor match for this bone`,
      detail: tryOther
        ? `It sticks out on the ${names} side${over.length > 1 ? "s" : ""}. Try size ${recommended}, the best fit for these marks.`
        : `It sticks out on the ${names} side${over.length > 1 ? "s" : ""}, and no other size does better. Check that the four marks sit on the outer edge of the bone.`,
    };
  }

  return {
    tone,
    step: 2,
    headline: `Size ${size} leaves part of the bone uncovered`,
    detail: tryOther
      ? `It covers ${fit.coveragePct.toFixed(0)}% of the bone (target ${DEFAULT_TIBIAL_FIT_THRESHOLDS.minCoveragePct}%). Try size ${recommended}, the best fit for these marks.`
      : `It covers ${fit.coveragePct.toFixed(0)}% of the bone (target ${DEFAULT_TIBIAL_FIT_THRESHOLDS.minCoveragePct}%), and no other size does better. Check that the four marks sit on the outer edge of the bone.`,
  };
}

export function adviseFemoral(
  input: Common & { fit?: FemoralFitResult; ranking: { rows: FemoralSizeRow[]; recommended?: number } },
): Advice {
  const early = beforeFit(input);
  if (early) return early;
  const { fit, bone, size, rotationDeg, ranking } = input;
  if (!fit) return { tone: "none", step: 1, headline: "Waiting for a fit", detail: "Place the component to see how it sits." };

  const recommended = ranking.recommended;
  const tryOther = recommended !== undefined && recommended !== size;

  if (fit.worstTone === "pass") {
    return {
      tone: "pass",
      step: 4,
      headline: `Size ${size} fits well`,
      detail: `It spans ${fit.apCoveragePct.toFixed(0)}% of the bone's depth and ${fit.mlCoveragePct.toFixed(0)}% of its width, with ${fit.notchingRiskMm > 0 ? `a ${mm(fit.notchingRiskMm)} gap` : "no gap"} at the front. If you are happy with it, confirm.`,
    };
  }

  const tone = fit.worstTone;
  const coverageShort = fit.apCoverageTone !== "pass" || fit.mlCoverageTone !== "pass";

  const best = autoFitFemoral(size, bone, rotationDeg);
  const afterAuto = evaluateFemoralFit(size, best.x, best.y, bone.apMm!, bone.mlMm!, rotationDeg, bone.orientation);

  if (coverageShort) {
    if (afterAuto.worstTone === "pass") {
      return {
        tone,
        step: 3,
        headline: `Size ${size} is not centred on the bone`,
        detail: `Coverage should be at least 90%. Press Auto-fit position to centre it.`,
      };
    }
    const which = fit.apCoverageTone !== "pass" && fit.mlCoverageTone !== "pass" ? "depth and width" : fit.apCoverageTone !== "pass" ? "depth" : "width";
    return {
      tone,
      step: 2,
      headline: `Size ${size} does not span the bone's ${which}`,
      detail: tryOther
        ? `Coverage should be at least 90%. Try size ${recommended}, the best fit for these marks.`
        : `Coverage should be at least 90%, and no other size does better. Check that the four marks sit on the outer edge of the bone.`,
    };
  }

  // Only the front gap is off.
  const fixable = afterAuto.notchTone === "pass";
  return {
    tone,
    step: fixable || !tryOther ? 3 : 2,
    headline: `A ${mm(fit.notchingRiskMm)} gap at the front of the bone`,
    detail: fixable
      ? `A gap above ${mm(FEMORAL_NOTCH_LIMIT_MM)} at the front raises the risk of notching. Move the component about ${mm(fit.notchingRiskMm)} forwards, or press Auto-fit position.`
      : tryOther
        ? `A gap above ${mm(FEMORAL_NOTCH_LIMIT_MM)} at the front raises the risk of notching, and moving alone will not close it. Try size ${recommended}.`
        : `A gap above ${mm(FEMORAL_NOTCH_LIMIT_MM)} at the front raises the risk of notching. Move the component forwards, or press Auto-fit position.`,
  };
}
