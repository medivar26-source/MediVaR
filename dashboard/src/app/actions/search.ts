"use server";

import { listCases } from "@/lib/data/cases";
import { getCohorts, getSupervisedLearners } from "@/lib/data/cohorts";
import { getEnrolledPrograms, getPrograms } from "@/lib/data/programs";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";

export type SearchHit = {
  kind: "case" | "program" | "cohort" | "learner";
  title: string;
  meta: string;
  href: string;
};

const PER_KIND = 4;

/**
 * Finds records by name for the ⌘K palette: cases, programs, cohorts and, for
 * instructors, learners. Read-only, built from the same accessors the pages use,
 * so a hit always opens something the person is allowed to see.
 */
export async function searchRecords(query: string): Promise<SearchHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const user = await getCurrentUser();
  // The platform administrator has no cases, cohorts or learners to search.
  if (personaFor(user.role) === "admin") return [];
  const instructor = personaFor(user.role) !== "learner";
  const has = (text?: string) => (text ?? "").toLowerCase().includes(q);

  const [cases, programs, cohorts, learners] = await Promise.all([
    listCases(user.id, { q: query.trim(), attempted: "all" })
      .then((r) => r.cases)
      .catch(() => []),
    (instructor ? getPrograms() : getEnrolledPrograms()).catch(() => []),
    instructor ? getCohorts() : Promise.resolve([]),
    instructor ? getSupervisedLearners().catch(() => []) : Promise.resolve([]),
  ]);

  const hits: SearchHit[] = [];

  for (const c of cases.slice(0, PER_KIND)) {
    hits.push({ kind: "case", title: c.title, meta: "Case", href: `/cases/${c.id}` });
  }
  for (const p of programs.filter((p) => has(p.name)).slice(0, PER_KIND)) {
    hits.push({ kind: "program", title: p.name, meta: "Program", href: `/programs/${p.id}` });
  }
  const programName = new Map(programs.map((p) => [p.id, p.name]));
  for (const c of cohorts.filter((c) => has(c.name)).slice(0, PER_KIND)) {
    hits.push({
      kind: "cohort",
      title: c.name,
      meta: `Cohort · ${programName.get(c.program_id) ?? "Program"}`,
      href: `/programs/${c.program_id}/cohorts/${c.id}`,
    });
  }
  for (const l of learners.filter((l) => has(l.displayName)).slice(0, PER_KIND)) {
    hits.push({ kind: "learner", title: l.displayName, meta: "Learner", href: `/learners/${l.id}` });
  }

  return hits;
}
