/**
 * How a case card says what the record does and does not know.
 *
 * Pathology and side come from the case's version. When the backend has no value for
 * them the card says so; it never shows a default that looks like a recorded fact (the
 * list used to fill in "Osteoarthritis" and "right" for every case it knew nothing about).
 */

import { titleCase } from "@/lib/format";

export const NOT_RECORDED = "Not recorded";

export function pathologyText(item: { pathologyLabel?: string }): string {
  return item.pathologyLabel?.trim() || NOT_RECORDED;
}

/** "Left", or "Left knee" with a suffix; "Not recorded" when the case has no side. */
export function sideText(item: { side?: string }, suffix = ""): string {
  return item.side ? `${titleCase(item.side)}${suffix}` : NOT_RECORDED;
}

/** Only `left` or `right` are sides; anything else from the API is treated as not recorded. */
export function parseSide(value: unknown): "left" | "right" | undefined {
  const side = typeof value === "string" ? value.trim().toLowerCase() : "";
  return side === "left" || side === "right" ? side : undefined;
}

/** The operative knee as the planner and the VR payload write it, or null when the case does not record one. */
export function operativeSideOf(side: unknown): "LEFT" | "RIGHT" | null {
  const parsed = parseSide(side);
  return parsed ? (parsed.toUpperCase() as "LEFT" | "RIGHT") : null;
}

/**
 * Why a case cannot be planned yet, or null when it can.
 *
 * The operative side decides which way the anatomy is read (varus or valgus, which edge is
 * medial) and goes into the plan that is sent to the headset. It is never assumed: a case that
 * does not record it is not planned until somebody records it. Pathology is shown but plays no part in
 * the plan, so it never blocks.
 */
export function planningBlocker(
  item: { side?: unknown },
  options: { personal?: boolean } = {},
): string | null {
  if (operativeSideOf(item.side)) return null;
  return options.personal
    ? "This case has no operative side recorded. Open it, choose Left or Right, and save before planning."
    : "This case has no operative side recorded, so it cannot be planned yet. Ask the instructor who authored it to record the side.";
}

/** Pathology and side as the case record carries them, from either the version or the case itself. */
export function caseMetaFromRecord(row: {
  active_version?: { pathology_label?: string | null; side?: string | null } | null;
  pathology_label?: string | null;
  side?: string | null;
}): { pathologyLabel?: string; side?: "left" | "right" } {
  const version = row.active_version ?? undefined;
  return {
    pathologyLabel: (version?.pathology_label || row.pathology_label)?.trim() || undefined,
    side: parseSide(version?.side || row.side),
  };
}

/**
 * The procedures the planner can plan. The planner implements the V1 total knee arthroplasty workflow
 * (Assessment, Tibial, Femoral, Review & Send to VR) and nothing else, so a case is planned only when its
 * procedure is known to be one of these. Matched by the short id the demo catalogue uses or by name.
 */
export const PLANNABLE_PROCEDURES: { id: string; name: string }[] = [
  { id: "tkr", name: "Total Knee Replacement" },
];

const sameText = (a?: string, b?: string) =>
  Boolean(a && b) && a!.trim().toLowerCase() === b!.trim().toLowerCase();

export function isPlannableProcedure(item: { procedureId?: string; procedureName?: string }): boolean {
  return PLANNABLE_PROCEDURES.some(
    (p) => sameText(item.procedureId, p.id) || sameText(item.procedureName, p.name),
  );
}

/** The procedure's name, or the unavailable state; never an assumed procedure. */
export function procedureText(item: { procedureName?: string }): string {
  return item.procedureName?.trim() || "Procedure not recorded";
}

/**
 * Why the planner cannot be used for this case's procedure, or null. A case whose procedure is not
 * recorded (or is not one the planner handles) is not planned: choosing the TKA planner for it would
 * be an assumption about a clinical procedure. A learner's own case is created in the TKA wizard, so it is exempt.
 */
export function procedureBlocker(
  item: { procedureId?: string; procedureName?: string },
  options: { personal?: boolean } = {},
): string | null {
  if (options.personal || isPlannableProcedure(item)) return null;
  const known = item.procedureName?.trim();
  return known
    ? `There is no planner for ${known} yet, so this case cannot be planned.`
    : "This case's procedure is not recorded, so the planner cannot be chosen for it. Try again shortly, or ask the instructor who authored the case.";
}

/** Everything that must be true before a case is planned: a supported procedure, then a recorded operative side. */
export function casePlanBlocker(
  item: { side?: unknown; procedureId?: string; procedureName?: string },
  options: { personal?: boolean } = {},
): string | null {
  return procedureBlocker(item, options) ?? planningBlocker(item, options);
}
