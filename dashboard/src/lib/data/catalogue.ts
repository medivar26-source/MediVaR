/**
 * The procedure catalogue.
 *
 * `/simulations` holds no literals: the eleven parts, the scene list, the
 * variant notes and the "in development" cards are all rows in `procedures`,
 * `procedure_parts` and `procedure_scenes`. Adding a procedure
 * is a migration, not a code change.
 */

import { CASES, PARTS, PROCEDURES, SCENES } from "@/lib/seed";
import type { PublishState } from "@/lib/seed";

export type { PublishState };

export type ProcedureCard = {
  id: string;
  name: string;
  status: PublishState;
  tagline?: string;
  summary?: string;
  typicalDurationS?: number;
  parts: number;
  scenes: number;
  cases: number;
};

export type ProcedureScene = {
  scene: string;
  name: string;
  short: string;
  variantNote?: string;
};

export type ProcedurePart = {
  part: string;
  name: string;
  variantNote?: string;
  scenes: ProcedureScene[];
};

export type ProcedureDetail = ProcedureCard & {
  parts_detail: ProcedurePart[];
};

/** Published first, then planned, then exploratory; `sort_order` within each. */
const STATUS_RANK: Record<PublishState, number> = {
  published: 0,
  planned: 1,
  exploratory: 2,
};

export async function getProcedures(): Promise<ProcedureCard[]> {
  const count = <T extends { procedureId: string }>(rows: T[], id: string) =>
    rows.filter((row) => row.procedureId === id).length;

  const activeCases = CASES.filter((c) => c.isActive);

  return PROCEDURES.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    tagline: row.tagline,
    summary: row.summary,
    typicalDurationS: row.typicalDurationS,
    parts: count(PARTS, row.id),
    scenes: count(SCENES, row.id),
    cases: count(activeCases, row.id),
  })).sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      a.name.localeCompare(b.name),
  );
}

export async function getProcedure(
  id: string,
): Promise<ProcedureDetail | null> {
  const row = PROCEDURES.find((p) => p.id === id);
  if (!row) return null;

  const parts = PARTS.filter((p) => p.procedureId === id);
  const scenes = SCENES.filter((s) => s.procedureId === id);

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    tagline: row.tagline,
    summary: row.summary,
    typicalDurationS: row.typicalDurationS,
    parts: parts.length,
    scenes: scenes.length,
    cases: CASES.filter((c) => c.isActive && c.procedureId === id).length,
    parts_detail: parts.map((part) => ({
      part: part.part,
      name: part.name,
      variantNote: part.variantNote,
      scenes: scenes
        .filter((scene) => scene.part === part.part)
        .map((scene) => ({
          scene: scene.scene,
          name: scene.name,
          short: scene.short,
          variantNote: scene.variantNote,
        })),
    })),
  };
}
