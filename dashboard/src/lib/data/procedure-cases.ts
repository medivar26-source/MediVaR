/**
 * Which cases sit under which procedure on the Procedures page.
 *
 * A case names its procedure two ways. The backend knows it by a UUID and (since the case list
 * began returning it) by name; the built-in demo catalogue knows it by the short id the
 * Procedures page itself uses (`tkr`). A case belongs to a procedure when either matches. A case
 * that matches none is not dropped: it is returned in `other` so it stays reachable.
 *
 * Pure and type-only on purpose, so the rule is testable without a request.
 */

import type { CaseCard } from "./cases";

export type ProcedureKey = { id: string; name: string };

const same = (a?: string, b?: string) =>
  Boolean(a && b) && a!.trim().toLowerCase() === b!.trim().toLowerCase();

export function groupCasesByProcedure(
  procedures: ProcedureKey[],
  cases: CaseCard[],
): { groups: Map<string, CaseCard[]>; other: CaseCard[] } {
  const groups = new Map<string, CaseCard[]>(procedures.map((p) => [p.id, []]));
  const other: CaseCard[] = [];

  for (const item of cases) {
    const match = procedures.find(
      (p) => same(item.procedureId, p.id) || same(item.procedureName, p.name),
    );
    if (match) groups.get(match.id)!.push(item);
    else other.push(item);
  }

  return { groups, other };
}
