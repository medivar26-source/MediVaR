import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { V1_TKR_STEPS, planStepLabel } from "../plan";

const read = (rel: string) => readFileSync(join(__dirname, "..", "..", rel), "utf8");

describe("planning workflow wording", () => {
  it("names the four V1 pages in order", () => {
    assert.deepEqual(
      V1_TKR_STEPS.map((s) => s.title),
      ["Assessment", "Tibial Planning", "Femoral Planning", "Review & Send to VR"],
    );
  });

  it("labels a draft with the step it is on", () => {
    assert.equal(planStepLabel(0, 4), "Step 1 of 4 · Assessment");
    assert.equal(planStepLabel(1, 4), "Step 2 of 4 · Tibial Planning");
    assert.equal(planStepLabel(3, 4), "Step 4 of 4 · Review & Send to VR");
  });

  it("never runs past the last step, and keeps the plain form for other step counts", () => {
    assert.equal(planStepLabel(9, 4), "Step 4 of 4 · Review & Send to VR");
    assert.equal(planStepLabel(2, 6), "Step 3 of 6");
  });
});

describe("learner Programs wording", () => {
  const list = read("app/programs/page.tsx");
  const detail = read("app/programs/[id]/page.tsx");

  it("has no Curriculum or Pathways headings or subtext", () => {
    assert.ok(!/Curriculum & Pathways/.test(list));
    assert.ok(!/Curriculum Cases/.test(detail));
    assert.ok(!/your curriculum/i.test(list));
    assert.ok(!/pathway/i.test(list));
  });

  it("shows the enrolled count as a header badge, not a stat card", () => {
    assert.ok(/count=\{programs\.length/.test(list));
    assert.ok(!/Enrolled programs/.test(list));
  });

  it("gives each case card one action and no keyword chips", () => {
    assert.ok(!/Unattempted|Plan case|Not attempted/.test(detail));
    assert.ok(/Open case →/.test(detail));
    assert.ok(!/pathologyLabel/.test(detail));
  });
});
