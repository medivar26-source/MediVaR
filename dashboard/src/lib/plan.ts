/**
 * The planning vocabulary: the seven steps, the six angles, the shapes they
 * produce, and the two helpers that read a set of gates.
 *
 * Pure on purpose. `lib/data/plan.ts` holds the accessor, and that file imports
 * server-only modules — so a `"use client"`
 * step component importing `MEASUREMENTS` from there would drag the whole
 * server module into the browser bundle and fail the build.
 *
 * Constants and pure helpers that both sides need live here. Only the query
 * lives in `lib/data/`.
 */

import type {
  Difficulty,
  FixationType,
  ImplantDesign,
  SimMode,
  Side,
} from "@/lib/types";

export const PLAN_STEPS = [
  { step: 1, title: "Case history", budget: "45–60 s" },
  { step: 2, title: "Imaging review", budget: "1.5–2 min" },
  { step: 3, title: "Deformity measurement", budget: "1 min" },
  { step: 4, title: "Alignment planning", budget: "1 min" },
  { step: 5, title: "Implant selection", budget: "45–60 s" },
  { step: 6, title: "Risk & strategy", budget: "30–45 s" },
  { step: 7, title: "Plan summary", budget: "15–20 s" },
] as const;

export const LAST_STEP = 7;

/**
 * Where a plan has got to. Derived from the plan's own columns in
 * `lib/data/plans.ts`, and named here because `/plans`' filter chips are a
 * client component — the same reason `MEASUREMENTS` lives in this file.
 *
 * `paired` is not a fifth column on `plans`: it is "sealed, and a PIN issued
 * for it is still alive", which is `my_pin_status()`'s answer rather than the
 * table's. Reading it as a state keeps the three nav destinations that used to
 * point at three screens pointing at one list.
 */
export type PlanState = "draft" | "ready" | "paired" | "performed";

export const PLAN_STATES: { value: PlanState; label: string }[] = [
  { value: "draft", label: "In progress" },
  { value: "ready", label: "Ready for VR" },
  { value: "paired", label: "PIN issued" },
  { value: "performed", label: "Performed" },
];

/** The six angles, in the order a surgeon reads them off a long-leg film. */
export const MEASUREMENTS = [
  { key: "hka_deg", label: "Hip–knee–ankle", short: "HKA", unit: "°" },
  { key: "mad_mm", label: "Mechanical axis deviation", short: "MAD", unit: "mm" },
  { key: "mpta_deg", label: "Medial proximal tibial angle", short: "MPTA", unit: "°" },
  { key: "mldfa_deg", label: "Mechanical lateral distal femoral angle", short: "mLDFA", unit: "°" },
  { key: "jlca_deg", label: "Joint line convergence angle", short: "JLCA", unit: "°" },
  { key: "ldta_deg", label: "Lateral distal tibial angle", short: "LDTA", unit: "°" },
] as const;

export type MeasurementKey = (typeof MEASUREMENTS)[number]["key"];

export type StepGate = { step: number; passed: boolean; reason: string };

export type StepOption = {
  value: string;
  label: string;
  detail?: string;
};

export type CaseRisk = {
  id: string;
  label: string;
  detail: string;
  severity: "critical" | "high" | "moderate";
};

export type SessionConfig = {
  mode: SimMode;
  difficulty: Difficulty;
  implant_design: ImplantDesign;
  fixation: FixationType;
  patella_resurfacing: boolean | null;
};

/** What the seven steps accumulate. Each step owns one branch of it. */
export type PlanPayload = {
  case_id?: string;
  session_config?: Partial<SessionConfig>;
  diagnosis?: string;
  imaging_reading?: { kl_grade?: string; compartment?: string };
  measurements?: Partial<Record<MeasurementKey, number>>;
  alignment_plan?: {
    target_hka_deg?: number;
    planned_correction_deg?: number;
    resection_strategy?: string;
  };
  resections?: {
    distal_femur_mm?: number;
    proximal_tibia_medial_mm?: number;
    posterior_tibial_slope_deg?: number;
    distal_femur_valgus_deg?: number;
  };
  implants?: {
    design?: ImplantDesign;
    femoral_size?: number;
    tibial_tray_size?: number;
    pe_insert_mm?: number;
    patellar_button_mm?: number;
  };
  risks?: { acknowledged?: string[]; tight_side?: string };
};

/**
 * The data model also lists `implants.femoral_fit` and
 * `implants.patellar_button_mm`. Neither is written here, and that is
 * deliberate rather than an omission:
 *
 *   - **`femoral_fit`** is the *verdict* of the fit check, not an answer. It
 *     was being written as the literal `"standard"` on every plan regardless of
 *     what was chosen — a value nobody supplied, sitting in the payload as
 *     though somebody had. It lands when the component geometry ships and the
 *     overhang overlay can actually compute it.
 *   - **`patellar_button_mm`** follows `patella_resurfacing`, which is
 *     decided intra-operatively at scene 9.1 from the cartilage grade. A
 *     button size chosen at the desk would be a decision taken before the
 *     evidence for it exists.
 *
 *
 */

/** What the headset is told to release, derived from the answer step 6 grades. */
export function releaseStrategy(tightSide: string | undefined): string | undefined {
  if (tightSide === "medial") return "medial_release";
  if (tightSide === "lateral") return "lateral_release";
  if (tightSide === "balanced") return "no_release";
  return undefined;
}

/**
 * The numeric values of a discrete option list — component sizes, insert
 * thicknesses — in the order the catalogue holds them.
 *
 * Non-numeric rows are dropped rather than coerced, so a mistyped catalogue row
 * costs one option rather than producing `NaN` on a control.
 */
export function numericOptions(options: StepOption[] | undefined): number[] {
  return (options ?? []).flatMap((option) => {
    const value = Number(option.value);
    return Number.isFinite(value) ? [value] : [];
  });
}

export type PlanCase = {
  id: string;
  title: string;
  summary?: string;
  side: Side;
  difficulty: Difficulty;
  pathologyLabel: string;
  patient: { label: string; value: string }[];
  narrative: { label: string; value: string }[];
  imaging: { view: string; label: string }[];
  objectives: string[];
  referenceRanges: Partial<Record<MeasurementKey, [number, number]>>;
};

export type PlanDetail = {
  id: string;
  caseId: string;
  isReadyForVr: boolean;
  hasSession: boolean;
  payload: PlanPayload;
  stepTimings: Record<string, number>;
  case: PlanCase;
  gates: StepGate[];
  /** Choices, keyed by the payload field they answer. Procedure-scoped. */
  options: Record<string, StepOption[]>;
  /** Step 6's intra-operative points — authored guidance, not a choice. */
  guidance: string[];
  risks: CaseRisk[];
  updatedAt: string;
};

/** The gate for one step, or a safe placeholder if the RPC returned nothing. */
export function gateFor(gates: StepGate[], step: number): StepGate {
  return (
    gates.find((g) => g.step === step) ?? {
      step,
      passed: false,
      reason: "This step has not been graded yet.",
    }
  );
}

/** How far the learner may jump ahead: the first open step, and no further. */
export function furthestOpenStep(gates: StepGate[]): number {
  for (const { step } of PLAN_STEPS) {
    if (!gateFor(gates, step).passed) return step;
  }
  return LAST_STEP;
}
