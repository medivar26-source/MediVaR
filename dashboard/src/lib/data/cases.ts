/**
 * Case browser and case detail.
 *
 * Attempt counts and best scores are derived **per viewer** from their own
 * sessions, never stored on a case — two learners looking at the same case must
 * see their own history.
 */

import {
  CASES,
  CASE_BY_ID,
  CATEGORY_META,
  PROCEDURES,
} from "@/lib/seed";
import type { Difficulty, SessionSummary, Side } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";
import { apiClient } from "../api-client";
import { caseMetaFromRecord, parseSide } from "../case-meta";
import { getLearnerSessions } from "./learner-sessions";
import { hasRun } from "./session-links";

export type AttemptedFilter = "all" | "attempted" | "unattempted";

export type CaseFilters = {
  q?: string;
  pathology?: string;
  side?: string;
  difficulty?: string;
  attempted?: AttemptedFilter;
};

export type CaseCard = {
  id: string;
  title: string;
  summary?: string;
  /** From the case's version; absent when the record has none (see `lib/case-meta.ts`). */
  pathologyLabel?: string;
  side?: Side;
  /** The procedure the case belongs to, as the backend knows it (a UUID) or the demo catalogue (`tkr`). */
  procedureId?: string;
  procedureName?: string;
  difficulty: Difficulty;
  attempts: number;
  bestScore?: number;
  /** Score of the most recent completed attempt, for the card badge. */
  lastScore?: number;
  status?: string;
  version?: number;
  draft_version_id?: string | null;
  published_version_id?: string | null;
};


/**
 * One selectable value on the filter bar, with the number of cases it would
 * yield **given every other filter currently applied**. A facet count that
 * ignores the rest of the query sends people into empty results.
 */
export type Facet = { value: string; count: number };

export type CaseFacets = {
  pathologies: Facet[];
  sides: Facet[];
  difficulties: Facet[];
  history: Facet[];
};

export type CaseBrowse = {
  cases: CaseCard[];
  facets: CaseFacets;
  /** Active cases in the catalogue, before filtering. */
  total: number;
};

const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "expert"];

type AttemptStats = Map<string, { attempts: number; best?: number; last?: number }>;

/** One pass over the viewer's sessions, keyed by case. */
function statsByCase(sessions: SessionSummary[]): AttemptStats {
  const stats: AttemptStats = new Map();
  const byRecency = [...sessions].sort((a, b) =>
    (b.endedAt ?? "").localeCompare(a.endedAt ?? ""),
  );

  for (const session of byRecency) {
    if (!session.caseId) continue;
    const entry = stats.get(session.caseId) ?? { attempts: 0 };
    entry.attempts += 1;
    if (session.totalScore !== undefined) {
      entry.best = Math.max(entry.best ?? 0, session.totalScore);
      if (entry.last === undefined) entry.last = session.totalScore;
    }
    stats.set(session.caseId, entry);
  }
  return stats;
}

/** Which axes a case has to satisfy. `skip` is how a facet counts itself out. */
type Axis = "q" | "pathology" | "side" | "difficulty" | "attempted";

function matches(item: CaseCard, filters: CaseFilters, skip?: Axis): boolean {
  if (skip !== "q" && filters.q) {
    const term = filters.q.trim().toLowerCase();
    if (
      term &&
      !item.title.toLowerCase().includes(term) &&
      !item.id.toLowerCase().includes(term)
    ) {
      return false;
    }
  }
  if (skip !== "pathology" && filters.pathology) {
    if (item.pathologyLabel !== filters.pathology) return false;
  }
  if (skip !== "side" && filters.side && item.side !== filters.side) return false;
  if (
    skip !== "difficulty" &&
    filters.difficulty &&
    item.difficulty !== filters.difficulty
  ) {
    return false;
  }
  if (skip !== "attempted" && filters.attempted && filters.attempted !== "all") {
    const attempted = item.attempts > 0;
    if (filters.attempted === "attempted" && !attempted) return false;
    if (filters.attempted === "unattempted" && attempted) return false;
  }
  return true;
}

/** Distinct values on one axis, each counted against the other four. */
function facetOf(
  cases: CaseCard[],
  filters: CaseFilters,
  axis: Axis,
  valueOf: (item: CaseCard) => string | undefined,
  order?: string[],
): Facet[] {
  const pool = cases.filter((item) => matches(item, filters, axis));
  const counts = new Map<string, number>();

  // A case with no recorded value for this axis is not a facet value: it simply never matches the filter.
  for (const item of cases) {
    const key = valueOf(item);
    if (key !== undefined) counts.set(key, 0);
  }
  for (const item of pool) {
    const key = valueOf(item);
    if (key === undefined) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) =>
      order
        ? order.indexOf(a.value) - order.indexOf(b.value)
        : a.value.localeCompare(b.value),
    );
}

/**
 * The whole active catalogue is fetched and filtered here rather than in SQL.
 *
 * Faceted counts have to be computed against every axis *except* the one being
 * counted, which is five queries in SQL and one pass in memory. The catalogue
 * is authored content — six cases today, and a few hundred at the outside. If
 * it ever passes roughly a thousand, move the filtering back into the query and
 * compute the counts with `group by` instead.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

import { cookies } from "next/headers";

async function getOptionalToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("mediver-token")?.value ?? null;
  } catch {
    return null;
  }
}

/** One row of `GET /cases`. Pathology, side and procedure are optional: the record may not have them. */
export type ApiCaseListRow = {
  id: string;
  name: string;
  description?: string | null;
  difficulty?: string | null;
  status?: string;
  version?: number;
  pathology_label?: string | null;
  side?: string | null;
  procedure_id?: string | null;
  procedure_name?: string | null;
  draft_version_id?: string | null;
  published_version_id?: string | null;
};

/**
 * A list row as a card. Nothing is invented for a field the backend left empty: a case with
 * no recorded pathology or side stays without one, and the card says "Not recorded".
 */
export function cardFromApiRow(
  r: ApiCaseListRow,
  stat?: { attempts: number; best?: number; last?: number },
): CaseCard {
  return {
    id: r.id,
    title: r.name,
    summary: r.description ?? undefined,
    pathologyLabel: r.pathology_label?.trim() || undefined,
    side: parseSide(r.side),
    procedureId: r.procedure_id ?? undefined,
    procedureName: r.procedure_name ?? undefined,
    difficulty: (r.difficulty || "intermediate").toLowerCase() as Difficulty,
    attempts: stat?.attempts ?? 0,
    bestScore: stat?.best,
    lastScore: stat?.last,
    status: r.status,
    version: r.version,
    draft_version_id: r.draft_version_id,
    published_version_id: r.published_version_id,
  };
}

export async function listCases(
  userId: string,
  filters: CaseFilters = {},
): Promise<CaseBrowse> {
  const token = await getOptionalToken();

  // The viewer's sessions and the case list do not depend on each other, so they are fetched together
  // (they used to be fetched one after the other, which added a full round trip to every case page).
  const [sessions, listed] = await Promise.all([
    getLearnerSessions(userId),
    token
      ? fetch(`${API_BASE}/cases`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }).then(
          (res) => ({ res }),
          (error: unknown) => ({ error }),
        )
      : null,
  ]);
  const stats = statsByCase(sessions.filter(hasRun));

  let dbCases: CaseCard[] = [];
  // When the backend answers, the library is exactly what it holds, even if that is nothing. The built-in
  // demo catalogue is only a stand-in for when it cannot be reached.
  let backendAnswered = false;
  if (listed && "res" in listed) {
    try {
      if (listed.res.ok) {
        backendAnswered = true;
        const rows = await listed.res.json();
        dbCases = rows.map((r: ApiCaseListRow) => cardFromApiRow(r, stats.get(r.id)));
      }
    } catch (e) {
      console.warn("Failed to read cases from API, falling back to seed catalogue:", e);
    }
  } else if (listed) {
    console.warn("Failed to fetch cases from API, falling back to seed catalogue:", listed.error);
  }

  // Combine with seed catalogue, deduplicating by ID
  const seenIds = new Set(dbCases.map((c) => c.id));
  const seedCases: CaseCard[] = CASES.filter((row) => !backendAnswered && row.isActive && !seenIds.has(row.id))
    .map((row) => {
      const stat = stats.get(row.id);
      return {
        id: row.id,
        title: row.title,
        summary: row.summary,
        pathologyLabel: row.pathologyLabel,
        side: row.side,
        procedureId: row.procedureId,
        procedureName: PROCEDURES.find((p) => p.id === row.procedureId)?.name,
        difficulty: row.difficulty,
        attempts: stat?.attempts ?? 0,
        bestScore: stat?.best,
        lastScore: stat?.last,
        status: "active" as const,
        version: 1,
      };
    });

  const all: CaseCard[] = [...dbCases, ...seedCases].sort(
    (a, b) =>
      DIFFICULTY_ORDER.indexOf(a.difficulty) -
        DIFFICULTY_ORDER.indexOf(b.difficulty) || a.title.localeCompare(b.title),
  );

  return {
    cases: all.filter((item) => matches(item, filters)),
    total: all.length,
    facets: {
      pathologies: facetOf(all, filters, "pathology", (c) => c.pathologyLabel),
      sides: facetOf(all, filters, "side", (c) => c.side, ["left", "right"]),
      difficulties: facetOf(
        all,
        filters,
        "difficulty",
        (c) => c.difficulty,
        DIFFICULTY_ORDER,
      ),
      history: (["attempted", "unattempted"] as const).map((value) => ({
        value,
        count: all.filter(
          (item) =>
            matches(item, filters, "attempted") &&
            (value === "attempted" ? item.attempts > 0 : item.attempts === 0),
        ).length,
      })),
    },
  };
}

export type PatientField = { label: string; value: string };
export type PatientSnapshot = {
  vitals: PatientField[];
  notes: PatientField[];
};

export type ScoringCategory = { key: string; label: string; max: number };

export type CaseDetail = {
  id: string;
  title: string;
  summary?: string;
  /** The case's procedure as the backend records it; absent when it cannot be resolved (shown as unavailable). */
  procedureId?: string;
  procedureName?: string;
  /** Absent when the record has none; shown as "Not recorded" (`lib/case-meta.ts`). */
  pathologyLabel?: string;
  side?: Side;
  difficulty: Difficulty;
  patient: PatientSnapshot;
  imaging: { view: string; label: string; url?: string; calibration?: any }[];
  objectives: string[];
  attempts: SessionSummary[];
  bestScore?: number;
  passed: number;
  timeSpentS: number;
  scoring: ScoringCategory[];
  status?: string;
  version?: number;
  draft_version_id?: string | null;
  published_version_id?: string | null;
  reference_plan?: any;
  criteria?: any[];
  validation_errors?: string[];
  is_publishable?: boolean;
};

const PATIENT_FIELDS: {
  key: string;
  label: string;
  suffix?: string;
  block: "vital" | "note";
}[] = [
  { key: "patient_id", label: "Patient ID", block: "vital" },
  { key: "age", label: "Age", suffix: " years", block: "vital" },
  { key: "gender", label: "Gender", block: "vital" },
  { key: "sex", label: "Sex", block: "vital" },
  { key: "bmi", label: "BMI", block: "vital" },
  { key: "occupation", label: "Occupation", block: "vital" },
  { key: "walking_distance_m", label: "Walking distance", suffix: " m", block: "vital" },
  { key: "rom", label: "Range of motion", block: "vital" },
  { key: "fixed_flexion_deg", label: "Fixed flexion", suffix: "°", block: "vital" },
  { key: "deformity", label: "Deformity", block: "vital" },
  { key: "complaint", label: "Chief complaint", block: "note" },
  { key: "clinical_notes", label: "Clinical presentation", block: "note" },
  { key: "history", label: "History", block: "note" },
  { key: "past_management", label: "Past management", block: "note" },
];

function toSnapshot(record: Record<string, unknown>): PatientSnapshot {
  const fields = PATIENT_FIELDS.flatMap(({ key, label, suffix, block }) => {
    const value = record[key];
    if (value === undefined || value === null || value === "") return [];
    const text = String(value);
    return [
      {
        block,
        label,
        value: suffix
          ? `${text}${suffix}`
          : text.charAt(0).toUpperCase() + text.slice(1),
      },
    ];
  });

  return {
    vitals: fields.filter((f) => f.block === "vital"),
    notes: fields.filter((f) => f.block === "note"),
  };
}

/** The case list as the backend returns it, or null when it cannot be read. */
export async function fetchCaseListRows(token: string): Promise<ApiCaseListRow[] | null> {
  try {
    const res = await fetch(`${API_BASE}/cases`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return res.ok ? ((await res.json()) as ApiCaseListRow[]) : null;
  } catch {
    return null;
  }
}

/**
 * The name of a case's procedure. The detail response carries only the procedure's id; the case list
 * carries id and name together, so the name is read from there. A learner cannot call `GET /procedures`.
 * When the name cannot be resolved it is simply absent, and the page says so.
 */
function procedureNameIn(rows: ApiCaseListRow[] | null, procedureId: string | null | undefined): string | undefined {
  if (!procedureId || !rows) return undefined;
  return rows.find((r) => r.procedure_id === procedureId && r.procedure_name)?.procedure_name ?? undefined;
}

export async function getCase(
  caseId: string,
  userId: string,
): Promise<CaseDetail | null> {
  const token = await getOptionalToken();

  // Try API first
  if (token) {
    try {
      // The case, the viewer's sessions and the case list (for the procedure's name) are independent,
      // so they are fetched together instead of one after the other.
      const [res, sessions, listRows] = await Promise.all([
        fetch(`${API_BASE}/cases/${caseId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        }),
        getLearnerSessions(userId),
        fetchCaseListRows(token),
      ]);
      if (res.ok) {
        const row = await res.json();
        const attempts = sessions.filter((s) => s.caseId === caseId && hasRun(s));
        const scores = attempts
          .map((a) => a.totalScore)
          .filter((s): s is number => s !== undefined);

        const diff = (row.difficulty || "intermediate").toLowerCase() as Difficulty;
        const passMark = PASS_MARK[diff] ?? 70;
        const passed = attempts.filter(
          (a) => a.totalScore !== undefined && a.totalScore >= passMark,
        ).length;

        const patientObj = (row.active_version?.patient || row.patient || {});
        const objectivesList = (row.active_version?.objectives || row.objectives || []);

        const imagingViews = (row.imaging || []).map((img: any) => ({
          view: img.view_type,
          label: img.label,
          url: img.signed_url,
          calibration: img.calibration,
        }));

        return {
          id: row.id,
          title: row.active_version?.title || row.title || row.name,
          summary: row.active_version?.description || row.description,
          procedureId: row.procedure_id ?? undefined,
          procedureName: procedureNameIn(listRows, row.procedure_id),
          ...caseMetaFromRecord(row),
          difficulty: diff,
          patient: toSnapshot(patientObj),
          imaging: imagingViews.length > 0 ? imagingViews : [
            { view: "FLAP", label: "Full Leg Anteroposterior (FLAP)" },
            { view: "KLAT", label: "Knee Lateral (KLAT)" },
          ],
          objectives: objectivesList,
          attempts,
          bestScore: scores.length ? Math.max(...scores) : undefined,
          passed,
          timeSpentS: attempts.reduce((total, a) => total + (a.durationS ?? 0), 0),
          scoring: CATEGORY_META.map((category) => ({
            key: category.key,
            label: category.label,
            max: category.max,
          })),
          status: row.status,
          version: row.version,
          draft_version_id: row.draft_version_id,
          published_version_id: row.published_version_id,
          reference_plan: row.reference_plan,
          criteria: row.criteria,
          validation_errors: row.validation_errors,
          is_publishable: row.is_publishable,
        };
      }
    } catch (e) {
      console.warn("API case detail lookup failed, falling back to seed:", e);
    }
  }

  // Seed Fallback
  const row = CASE_BY_ID.get(caseId);
  if (!row) return null;

  const attempts = (await getLearnerSessions(userId)).filter(
    (s) => s.caseId === caseId && hasRun(s),
  );
  const scores = attempts
    .map((a) => a.totalScore)
    .filter((s): s is number => s !== undefined);

  const procedure = PROCEDURES.find((p) => p.id === row.procedureId);
  const passed = attempts.filter(
    (a) => a.totalScore !== undefined && a.totalScore >= PASS_MARK[a.difficulty],
  ).length;

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    procedureId: row.procedureId,
    procedureName: procedure?.name ?? row.procedureId.toUpperCase(),
    pathologyLabel: row.pathologyLabel,
    side: row.side,
    difficulty: row.difficulty,
    patient: toSnapshot(row.patient),
    imaging: row.imaging,
    objectives: row.objectives,
    attempts,
    bestScore: scores.length ? Math.max(...scores) : undefined,
    passed,
    timeSpentS: attempts.reduce((total, a) => total + (a.durationS ?? 0), 0),
    scoring: CATEGORY_META.map((category) => ({
      key: category.key,
      label: category.label,
      max: category.max,
    })),
    status: "active",
    version: 1,
  };
}

export type InstructorConfig = {
  id: string;
  name: string;
  caseId?: string;
  overrides: Record<string, unknown>;
  createdAt: string;
};

export async function getInstructorConfigs(
  caseId: string,
): Promise<InstructorConfig[]> {
  void caseId;
  return [];
}

export async function getCaseTitle(caseId: string): Promise<string | null> {
  const token = await getOptionalToken();
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const row = await res.json();
        return row.active_version?.title || row.title || row.name;
      }
    } catch {}
  }
  return CASE_BY_ID.get(caseId)?.title ?? null;
}

