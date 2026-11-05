import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { timeUntil } from "../format";

const NOW = "2026-11-05T10:00:00Z";

describe("timeUntil", () => {
  it("counts the minutes left on a code, rounding up so a live code never reads as expired", () => {
    assert.equal(timeUntil("2026-11-05T10:10:00Z", NOW), "in 10 min");
    assert.equal(timeUntil("2026-11-05T10:00:30Z", NOW), "in 1 min");
    assert.equal(timeUntil("2026-11-05T10:59:00Z", NOW), "in 59 min");
  });

  it("moves to hours and days for far-off times", () => {
    assert.equal(timeUntil("2026-11-05T13:00:00Z", NOW), "in 3 h");
    assert.equal(timeUntil("2026-11-08T10:00:00Z", NOW), "in 3 days");
  });

  it("says now for a time that has arrived or passed, never a negative", () => {
    assert.equal(timeUntil("2026-11-05T10:00:00Z", NOW), "now");
    assert.equal(timeUntil("2026-11-05T09:00:00Z", NOW), "now");
  });

  it("copes with a missing or unreadable time", () => {
    assert.equal(timeUntil(undefined, NOW), "never");
    assert.equal(timeUntil("not a date", NOW), "now");
  });
});
