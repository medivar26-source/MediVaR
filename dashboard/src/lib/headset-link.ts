/**
 * The dashboard half of the Quest 3 link, as pure functions (no fetch, no cookies), so they can be tested and
 * used on both sides of the server boundary.
 *
 * The flow (design: mediver_documentation/23_VR_CONNECTIVITY_DESIGN.md):
 *   lock a plan (POST /plans/{id}/lock; the plan is already stored, every edit was saved as it was made) ->
 *   "Send to headset" (POST /assignments) returns a one-time 6-digit code -> the trainee types it on the headset
 *   -> the headset uploads its report -> the report appears in Sessions / Insights like any other.
 */

import type { FixationType, ImplantDesign } from "@/lib/types";

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

/** Said for a plan on a built-in practice case: those are not database rows, so there is nothing to send. */
export const BUILT_IN_NOT_SENDABLE =
  "This is a built-in practice case, so it cannot be sent to a headset. Plan a case from the library.";

/** Setup choices the headset runs and that nothing may default: the implant design and the fixation. */
export type SetupChoice = "implant_design" | "fixation";

/**
 * Which of those a plan never recorded. They are asked for when the plan is locked (the database freezes a
 * locked plan's setup, so they cannot be added afterwards), and never preselected.
 */
export function missingSetup(config: { implant_design?: string; fixation?: string } | undefined): SetupChoice[] {
  const missing: SetupChoice[] = [];
  if (!config?.implant_design || !(DESIGNS as string[]).includes(config.implant_design)) missing.push("implant_design");
  if (!config?.fixation || !(FIXATIONS as string[]).includes(config.fixation)) missing.push("fixation");
  return missing;
}

/** The sender's choices, kept only for what the plan never recorded and only when they are real values. */
export function chosenSetup(
  recorded: { implant_design?: string; fixation?: string } | undefined,
  asked: { implant_design?: string | null; fixation?: string | null },
): { implant_design?: string; fixation?: string } {
  const needs = missingSetup(recorded);
  return {
    ...(needs.includes("implant_design") && asked.implant_design && (DESIGNS as string[]).includes(asked.implant_design)
      ? { implant_design: asked.implant_design }
      : {}),
    ...(needs.includes("fixation") && asked.fixation && (FIXATIONS as string[]).includes(asked.fixation)
      ? { fixation: asked.fixation }
      : {}),
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
