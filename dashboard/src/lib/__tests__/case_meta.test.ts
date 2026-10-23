import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NOT_RECORDED, parseSide, pathologyText, sideText } from "../case-meta";
import { cardFromApiRow } from "../data/cases";

const row = {
  id: "c1",
  name: "A case",
  difficulty: "Intermediate",
  status: "active",
  version: 2,
  procedure_id: "9d0f1a54-0000-4000-8000-000000000001",
  procedure_name: "Total Knee Replacement",
  pathology_label: "Varus OA",
  side: "Left",
};

describe("case card metadata from the list response", () => {
  it("carries the recorded pathology, side and procedure", () => {
    const card = cardFromApiRow(row);
    assert.equal(card.pathologyLabel, "Varus OA");
    assert.equal(card.side, "left");
    assert.equal(card.procedureId, row.procedure_id);
    assert.equal(card.procedureName, "Total Knee Replacement");
    assert.equal(card.difficulty, "intermediate");
  });

  it("leaves missing metadata missing — no hard-coded pathology or side", () => {
    const card = cardFromApiRow({ ...row, pathology_label: null, side: null, procedure_id: null, procedure_name: null });
    assert.equal(card.pathologyLabel, undefined);
    assert.equal(card.side, undefined);
    assert.equal(card.procedureId, undefined);
  });

  it("treats a blank label or an unknown side as not recorded", () => {
    const card = cardFromApiRow({ ...row, pathology_label: "   ", side: "both" });
    assert.equal(card.pathologyLabel, undefined);
    assert.equal(card.side, undefined);
  });

  it("copes with a response from a backend that does not send the new fields at all", () => {
    const { pathology_label: _p, side: _s, procedure_id: _i, procedure_name: _n, ...old } = row;
    void [_p, _s, _i, _n];
    const card = cardFromApiRow(old);
    assert.equal(card.pathologyLabel, undefined);
    assert.equal(card.side, undefined);
  });
});

describe("how a card says what is not known", () => {
  it("shows the recorded value when there is one", () => {
    assert.equal(pathologyText({ pathologyLabel: "Valgus OA" }), "Valgus OA");
    assert.equal(sideText({ side: "right" }), "Right");
    assert.equal(sideText({ side: "right" }, " knee"), "Right knee");
  });

  it("shows 'Not recorded' otherwise", () => {
    assert.equal(pathologyText({}), NOT_RECORDED);
    assert.equal(pathologyText({ pathologyLabel: "  " }), NOT_RECORDED);
    assert.equal(sideText({}), NOT_RECORDED);
    assert.equal(sideText({}, " knee"), NOT_RECORDED);
  });

  it("only left and right are sides", () => {
    assert.equal(parseSide("LEFT"), "left");
    assert.equal(parseSide(" right "), "right");
    assert.equal(parseSide("bilateral"), undefined);
    assert.equal(parseSide(null), undefined);
    assert.equal(parseSide(undefined), undefined);
  });
});
