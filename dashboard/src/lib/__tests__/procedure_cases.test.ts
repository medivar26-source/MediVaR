import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { groupCasesByProcedure } from "../data/procedure-cases";
import type { CaseCard } from "../data/cases";

const card = (over: Partial<CaseCard>): CaseCard => ({
  id: "c",
  title: "A case",
  difficulty: "intermediate",
  attempts: 0,
  ...over,
});

const procedures = [
  { id: "tkr", name: "Total Knee Replacement" },
  { id: "uka", name: "Unicompartmental Knee" },
];

describe("cases under their procedure", () => {
  it("groups a demo case by the short procedure id", () => {
    const { groups, other } = groupCasesByProcedure(procedures, [card({ id: "1", procedureId: "tkr" })]);
    assert.deepEqual(groups.get("tkr")!.map((c) => c.id), ["1"]);
    assert.equal(other.length, 0);
  });

  it("groups a backend case by the procedure's name when its id is a UUID", () => {
    const { groups } = groupCasesByProcedure(procedures, [
      card({ id: "2", procedureId: "9d0f1a54-0000-4000-8000-000000000001", procedureName: " total knee replacement " }),
    ]);
    assert.deepEqual(groups.get("tkr")!.map((c) => c.id), ["2"]);
  });

  it("keeps a case with no recorded procedure, rather than dropping it", () => {
    const { groups, other } = groupCasesByProcedure(procedures, [card({ id: "3" })]);
    assert.equal(groups.get("tkr")!.length + groups.get("uka")!.length, 0);
    assert.deepEqual(other.map((c) => c.id), ["3"]);
  });

  it("keeps a case whose procedure is not on the page", () => {
    const { other } = groupCasesByProcedure(procedures, [card({ id: "4", procedureName: "Hip Replacement" })]);
    assert.deepEqual(other.map((c) => c.id), ["4"]);
  });

  it("gives every procedure a group, empty when it has no cases, and keeps the order given", () => {
    const { groups } = groupCasesByProcedure(procedures, [
      card({ id: "a", procedureId: "tkr" }),
      card({ id: "b", procedureId: "tkr" }),
    ]);
    assert.deepEqual([...groups.keys()], ["tkr", "uka"]);
    assert.deepEqual(groups.get("tkr")!.map((c) => c.id), ["a", "b"]);
    assert.equal(groups.get("uka")!.length, 0);
  });
});
