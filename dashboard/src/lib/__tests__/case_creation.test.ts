import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  afterCaseSaved,
  caseCreationKind,
  createdCaseHref,
  isCaseInfoComplete,
  shouldMountDialogContent,
} from "../case-creation";

describe("who creates which kind of case", () => {
  it("gives instructors and administrators the institutional workflow", () => {
    assert.equal(caseCreationKind("instructor"), "institutional");
    assert.equal(caseCreationKind("admin"), "institutional");
  });

  it("gives every learner role the personal-case workflow, never the institutional one", () => {
    for (const role of ["student", "intern", "resident", "surgeon"] as const) {
      assert.equal(caseCreationKind(role), "personal", role);
    }
  });

  it("opens the new case where its kind lives", () => {
    assert.equal(createdCaseHref("institutional", "abc"), "/cases/abc");
    assert.equal(createdCaseHref("personal", "abc"), "/personal-cases/abc");
  });
});

describe("what a wizard does when the case is saved", () => {
  it("stays where it is and reports the case when it runs inside the dialog", () => {
    const pushed: string[] = [];
    const done: unknown[] = [];
    afterCaseSaved(
      { id: "c1", published: true },
      { onDone: (saved) => done.push(saved), href: "/cases/c1", push: (h) => pushed.push(h) },
    );
    assert.deepEqual(done, [{ id: "c1", published: true }]);
    assert.deepEqual(pushed, [], "the dialog must not navigate away");
  });

  it("goes to the case, as before, when it runs on its own page", () => {
    const pushed: string[] = [];
    afterCaseSaved({ id: "c1" }, { href: "/cases/c1", push: (h) => pushed.push(h) });
    assert.deepEqual(pushed, ["/cases/c1"]);
  });
});

describe("the dialog keeps a half-filled form", () => {
  it("creates its content when opened and keeps it after it is closed", () => {
    assert.equal(shouldMountDialogContent(false, false), false, "nothing is built before the first open");
    assert.equal(shouldMountDialogContent(true, false), true);
    assert.equal(shouldMountDialogContent(false, true), true, "closing does not discard the form");
  });
});

describe("case information validation", () => {
  const ok = { title: "A case", side: "left", sideChosen: true, pathology: "osteoarthritis" };

  it("accepts a complete case", () => {
    assert.equal(isCaseInfoComplete(ok), true);
  });

  it("needs a title, a pathology and a side", () => {
    assert.equal(isCaseInfoComplete({ ...ok, title: "   " }), false);
    assert.equal(isCaseInfoComplete({ ...ok, pathology: "" }), false);
    assert.equal(isCaseInfoComplete({ ...ok, side: "" }), false);
  });

  it("does not accept a side nobody chose on a case that records none", () => {
    assert.equal(isCaseInfoComplete({ ...ok, sideChosen: false }), false);
  });
});
