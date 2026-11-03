/**
 * The dashboard half of the Quest 3 link, as pure functions (no fetch, no cookies), so they can be tested and
 * used on both sides of the server boundary.
 *
 * The flow (design: mediver_documentation/23_VR_CONNECTIVITY_DESIGN.md):
 *   seal a plan -> the backend keeps it (POST /plans/locked) -> "Send to headset" (POST /assignments) returns a
 *   one-time 6-digit code -> the trainee types it on the headset -> the headset uploads its report -> the report
 *   appears in Sessions / Insights like any other.
 */

import type { FixationType, ImplantDesign, SimMode } from "@/lib/types";
import type { PlanPayload, PlanSnapshot, V1VrPayload } from "@/lib/plan";

/** What GET /assignments returns per row (never the code). */
export type HeadsetAssignment = {
  id: string;
  planId: string;
  status: "pending" | "paired" | "running" | "reported" | "expired" | "cancelled";
  headsetMode: "Guided" | "Practice" | "Exam";
  deviceName?: string;
  codeExpiresAt?: string;
  pairedAt?: string;
  createdAt: string;
  lastOutcome?: "Completed" | "Abandoned" | "InProgress";
  scoringStatus?: "pending" | "scored" | "awaiting_inputs" | "not_scored";
  attemptId?: string;
};

/** What the review page knows about the link for one plan. */
export type HeadsetLink = {
  /** False when the backend has no connectivity tables yet (it answers 404 "not set up"). */
  available: boolean;
  /** Why this plan cannot be sent, in words for the learner; undefined when it can be. */
  blocker?: string;
  /** Choices the plan never recorded and the sender must make before a code is issued (never defaulted). */
  needs?: SetupChoice[];
  assignments: HeadsetAssignment[];
};

export function assignmentFromApi(row: Record<string, unknown>): HeadsetAssignment {
  const s = (k: string) => (typeof row[k] === "string" ? (row[k] as string) : undefined);
  return {
    id: String(row.id),
    planId: String(row.plan_id),
    status: (s("status") ?? "pending") as HeadsetAssignment["status"],
    headsetMode: (s("headset_mode") ?? "Practice") as HeadsetAssignment["headsetMode"],
    deviceName: s("device_name"),
    codeExpiresAt: s("code_expires_at"),
    pairedAt: s("paired_at"),
    createdAt: s("created_at") ?? "",
    lastOutcome: s("last_outcome") as HeadsetAssignment["lastOutcome"],
    scoringStatus: s("scoring_status") as HeadsetAssignment["scoringStatus"],
    attemptId: s("attempt_id"),
  };
}

const DESIGNS: ImplantDesign[] = ["CR", "PS"];
const FIXATIONS: FixationType[] = ["cemented", "cementless"];
const MODES: SimMode[] = ["training", "assessment"];

export type LockedPlanBody = {
  case_id?: string;
  personal_case_id?: string;
  session_config: { mode: SimMode; difficulty: string; implant_design: ImplantDesign; fixation: FixationType };
  payload: PlanPayload;
  step_timings: Record<string, number>;
  vr_payload: V1VrPayload;
  locked_version_id: string;
};

/**
 * The body for POST /plans/locked, or the reason the plan cannot go to a headset. Nothing is filled in: a plan
 * without an implant design or fixation is refused rather than given a default.
 */
export type SetupChoice = "implant_design" | "fixation";

export function lockedPlanBody(input: {
  caseId: string;
  isPersonalCase: boolean;
  /** True for the built-in demo cases, which are not rows in the database. */
  isBuiltInCase: boolean;
  lockedVersion?: PlanSnapshot;
  stepTimings: Record<string, number>;
  /** What the sender chose for a plan that did not record it. Ignored where the plan already has a value. */
  chosen?: { implant_design?: string; fixation?: string };
}): { body: LockedPlanBody } | { error: string; needs?: SetupChoice[] } {
  const snap = input.lockedVersion;
  if (!snap) return { error: "Lock the plan first." };
  if (input.isBuiltInCase) {
    return { error: "This is a built-in practice case, so it cannot be sent to a headset. Plan a case from the library." };
  }
  const vr = snap.payload.v1_vr_payload;
  if (!vr) return { error: "The sealed plan has no VR payload." };
  const recorded = snap.payload.session_config ?? {};
  const pick = <T extends string>(own: T | undefined, chosen: string | undefined, allowed: T[]): T | undefined =>
    own && allowed.includes(own) ? own : chosen && (allowed as string[]).includes(chosen) ? (chosen as T) : undefined;
  const cfg = {
    ...recorded,
    implant_design: pick(recorded.implant_design, input.chosen?.implant_design, DESIGNS),
    fixation: pick(recorded.fixation, input.chosen?.fixation, FIXATIONS),
  };
  if (!cfg.difficulty) return { error: "The plan does not record its difficulty." };
  const needs: SetupChoice[] = [];
  if (!cfg.implant_design) needs.push("implant_design");
  if (!cfg.fixation) needs.push("fixation");
  if (needs.length > 0) {
    return { error: "Choose the implant design and fixation for this run.", needs };
  }
  return {
    body: {
      ...(input.isPersonalCase ? { personal_case_id: input.caseId } : { case_id: input.caseId }),
      session_config: {
        mode: cfg.mode && MODES.includes(cfg.mode) ? cfg.mode : "training",
        difficulty: cfg.difficulty!,
        implant_design: cfg.implant_design!,
        fixation: cfg.fixation!,
      },
      payload: snap.payload,
      step_timings: input.stepTimings,
      vr_payload: vr,
      locked_version_id: snap.versionId,
    },
  };
}

/** "004217" -> "004 217": easier to read across a room and to type on a headset keypad. */
export function formatPairingCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

/** Whole seconds until `expiresAt`, never negative. */
export function secondsLeft(expiresAt: string | undefined, nowMs: number): number {
  if (!expiresAt) return 0;
  const t = Date.parse(expiresAt);
  return Number.isNaN(t) ? 0 : Math.max(0, Math.floor((t - nowMs) / 1000));
}

/** "9:05" */
export function clockText(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** One sentence for where an assignment has got to. */
export function assignmentStatusText(a: HeadsetAssignment): string {
  const device = a.deviceName ? ` (${a.deviceName})` : "";
  switch (a.status) {
    case "pending":
      return "Waiting for the headset. Type the code on the headset's sign-in card.";
    case "paired":
      return `Headset connected${device}. The plan is loaded; the case can start.`;
    case "running":
      return a.lastOutcome === "Abandoned"
        ? `The run was stopped part-way${device}. It can be resumed on the headset.`
        : `Case in progress on the headset${device}.`;
    case "reported":
      if (a.scoringStatus === "scored") return "Run finished. The report is ready.";
      if (a.scoringStatus === "awaiting_inputs") return "Run finished. The report was received but cannot be scored yet: the headset did not send everything the scorer needs.";
      return "Run finished. The report was received.";
    case "expired":
      return "The code expired before the headset used it. Send it again for a new code.";
    case "cancelled":
      return "Replaced by a newer code.";
  }
}

/** The assignment that matters on screen: the newest one that is still live or finished. */
export function currentAssignment(list: HeadsetAssignment[]): HeadsetAssignment | undefined {
  return list.find((a) => a.status !== "cancelled");
}

/** Keep asking the backend for news while the headset might still do something. */
export function shouldPoll(a: HeadsetAssignment | undefined): boolean {
  return !!a && (a.status === "pending" || a.status === "paired" || a.status === "running");
}
