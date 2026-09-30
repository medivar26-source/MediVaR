import test from "node:test";
import assert from "node:assert/strict";
import { normalizeStatus, orderSessions, pickUpcoming } from "../data/session-order";

const s = (id: string, status: string, scheduledAt: string) => ({ id, status, scheduledAt });

test("upcoming sessions", async (t) => {
  await t.test("keeps only sessions still ahead, soonest first", () => {
    const rows = [
      s("done", "completed", "2026-09-29T06:00:00Z"),
      s("later", "scheduled", "2026-10-05T09:00:00Z"),
      s("cancelled", "cancelled", "2026-10-01T09:00:00Z"),
      s("soon", "scheduled", "2026-10-01T09:00:00Z"),
      s("now", "in_progress", "2026-09-29T12:00:00Z"),
    ];
    assert.deepEqual(pickUpcoming(rows).map((r) => r.id), ["now", "soon", "later"]);
  });

  await t.test("is empty when nothing is ahead (all history)", () => {
    const rows = [s("a", "completed", "2026-09-01T09:00:00Z"), s("b", "cancelled", "2026-09-02T09:00:00Z")];
    assert.deepEqual(pickUpcoming(rows), []);
  });

  await t.test("respects the limit", () => {
    const rows = Array.from({ length: 8 }, (_, i) => s(`s${i}`, "scheduled", `2026-10-0${i + 1}T09:00:00Z`));
    assert.equal(pickUpcoming(rows, 3).length, 3);
  });
});

test("session list order", async (t) => {
  await t.test("live, then upcoming soonest-first, then history newest-first", () => {
    const rows = [
      s("old", "completed", "2026-09-01T09:00:00Z"),
      s("newer", "completed", "2026-09-20T09:00:00Z"),
      s("far", "scheduled", "2026-11-01T09:00:00Z"),
      s("near", "scheduled", "2026-10-01T09:00:00Z"),
      s("live", "live", "2026-09-29T11:00:00Z"),
      s("cancel", "cancelled", "2026-09-25T09:00:00Z"),
    ];
    assert.deepEqual(orderSessions(rows).map((r) => r.id), ["live", "near", "far", "cancel", "newer", "old"]);
  });

  await t.test("an upcoming session is never buried under old ones", () => {
    const rows = Array.from({ length: 10 }, (_, i) => s(`h${i}`, "completed", `2026-08-0${(i % 9) + 1}T09:00:00Z`));
    const ordered = orderSessions([...rows, s("next", "scheduled", "2026-10-10T09:00:00Z")]);
    assert.equal(ordered[0].id, "next");
  });

  await t.test("does not mutate its input", () => {
    const rows = [s("b", "completed", "2026-09-01T09:00:00Z"), s("a", "scheduled", "2026-10-01T09:00:00Z")];
    orderSessions(rows);
    assert.equal(rows[0].id, "b");
  });
});

test("status vocabulary", () => {
  assert.equal(normalizeStatus("in_progress"), "live");
  assert.equal(normalizeStatus("scheduled"), "scheduled");
  assert.equal(normalizeStatus("cancelled"), "cancelled");
});
