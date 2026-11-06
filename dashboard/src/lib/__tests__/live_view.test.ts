import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EMPTY_STATE,
  agoText,
  canWatchLive,
  clockText,
  elapsedNow,
  frameUrl,
  pictureSource,
  streamUrl,
  liveChipText,
  livePagePath,
  liveSummaryFromApi,
  liveWording,
  mergeEvents,
  pollIntervalMs,
  sceneStates,
  stepLog,
  stepLogLine,
  type LiveEvent,
} from "../live-view";

const row = {
  assignmentId: "a-1", planId: "p-1", residentId: "u-1", resident: "Meera Pillai", caseTitle: "Varus right knee",
  mode: "Practice", design: "CR", fixation: "cemented", assignmentStatus: "running", liveState: "live", runId: "run-1",
  lastSeq: 9, state: { stepId: "P2_02", sceneId: "4.2", label: "Set the depth", stepsDone: 12, stepsTotal: 61, paused: false,
                       elapsedS: 400.5, warnings: 1, values: { "P2.tibialDepthMm": { value: 8.5, committed: false, elapsedS: 399 } } },
  startedAtUtc: "2026-11-05T10:00:00+00:00", lastEventAtUtc: "2026-11-05T10:06:40+00:00", secondsSinceEvent: 2.5,
  endedAtUtc: null, outcome: null, reportOutcome: null, scoringStatus: null, attemptId: null, serverTimeUtc: "2026-11-05T10:06:42Z",
  events: [{ seq: 9, type: "step_started", tUtc: null, elapsedS: 390, stepId: "P2_02", sceneId: "4.2", label: "Set the depth" }],
  frame: { seq: 31, width: 640, height: 360, capturedAtUtc: null, receivedAtUtc: null },
  planValues: [{ key: "P2.tibialDepthMm", label: "Proximal tibial resection", value: 9, tolerance: 2, unit: "mm" }],
};

describe("the live summary from the API", () => {
  it("maps every field and defaults what is missing", () => {
    const s = liveSummaryFromApi(row);
    assert.equal(s.liveState, "live");
    assert.equal(s.state.sceneId, "4.2");
    assert.equal(s.state.values["P2.tibialDepthMm"].value, 8.5);
    assert.equal(s.frame?.seq, 31);
    assert.equal(s.planValues[0].label, "Proximal tibial resection");
    const bare = liveSummaryFromApi({ assignmentId: "a-2", liveState: "nonsense" });
    assert.equal(bare.liveState, "waiting");
    assert.deepEqual(bare.state, EMPTY_STATE);
    assert.deepEqual(bare.events, []);
    assert.equal(bare.frame, null);
  });
});

describe("one vocabulary", () => {
  const base = { assignmentStatus: "running", state: { ...EMPTY_STATE, sceneId: "4.2", stepsDone: 12, stepsTotal: 61 }, scoringStatus: null, attemptId: null };
  it("says the same thing for the same state everywhere", () => {
    assert.equal(liveWording({ ...base, liveState: "waiting", assignmentStatus: "paired" }).label, "Headset connected");
    assert.equal(liveWording({ ...base, liveState: "waiting", assignmentStatus: "pending" }).label, "Waiting for the headset");
    assert.equal(liveWording({ ...base, liveState: "live" }).sentence, "Scene 4.2, step 13 of 61.");
    assert.equal(liveWording({ ...base, liveState: "paused" }).label, "Paused");
    assert.equal(liveWording({ ...base, liveState: "stale" }).label, "Headset not responding");
    assert.match(liveWording({ ...base, liveState: "lost" }).sentence, /continues on the headset/);
    assert.equal(liveWording({ ...base, liveState: "ended" }).sentence, "The report is being prepared.");
    assert.equal(liveWording({ ...base, liveState: "ended", attemptId: "att-1", scoringStatus: "scored" }).sentence, "The run is finished and scored.");
    assert.equal(liveChipText("live"), "Live");
    assert.equal(liveChipText("lost"), "Connection lost");
  });
});

describe("polling", () => {
  it("asks once a second while visible, every five while hidden, and after the end until the report lands", () => {
    assert.equal(pollIntervalMs({ liveState: "live", attemptId: null }, false), 1000);
    assert.equal(pollIntervalMs({ liveState: "waiting", attemptId: null }, false), 1000);
    assert.equal(pollIntervalMs({ liveState: "live", attemptId: null }, true), 5000);
    assert.equal(pollIntervalMs({ liveState: "ended", attemptId: null }, false), 5000, "run_ended came, the report has not");
    assert.equal(pollIntervalMs({ liveState: "ended", attemptId: "att-1" }, false), 0);
  });

  it("merges events by seq and keeps them in order", () => {
    const have: LiveEvent[] = [{ seq: 1, type: "run_started" }, { seq: 3, type: "step_started" }];
    const merged = mergeEvents(have, [{ seq: 2, type: "part_started" }, { seq: 3, type: "step_started", label: "again" }]);
    assert.deepEqual(merged.map((e) => e.seq), [1, 2, 3]);
    assert.equal(merged[2].label, "again");
    const capped = mergeEvents([], Array.from({ length: 600 }, (_, i) => ({ seq: i + 1, type: "value" })), 500);
    assert.equal(capped.length, 500);
    assert.equal(capped[0].seq, 101);
  });

  it("counts the clock on only while live", () => {
    const live = { liveState: "live" as const, state: { ...EMPTY_STATE, elapsedS: 100 }, secondsSinceEvent: 2 };
    assert.equal(elapsedNow(live, 3), 105);
    assert.equal(elapsedNow({ ...live, liveState: "paused" }, 30), 100);
    assert.equal(elapsedNow({ ...live, liveState: "ended" }, 30), 100);
  });
});

describe("the running order", () => {
  const events: LiveEvent[] = [
    { seq: 1, type: "step_started", sceneId: "1.1" },
    { seq: 2, type: "step_completed", sceneId: "1.1", status: "Done", warnings: 0 },
    { seq: 3, type: "step_completed", sceneId: "1.2", status: "Skipped", warnings: 0 },
    { seq: 4, type: "warning", sceneId: "2.1", text: "Off the line." },
    { seq: 5, type: "step_completed", sceneId: "2.1", status: "Done", warnings: 1 },
    { seq: 6, type: "step_completed", sceneId: "3.1", status: "Failed", warnings: 0 },
    { seq: 7, type: "step_completed", sceneId: "3.1", status: "Done", warnings: 0 },
    { seq: 8, type: "step_started", sceneId: "4.2" },
  ];

  it("says done, skipped, needs attention, not completed, now; never pass or fail", () => {
    const st = sceneStates(events, "4.2", false);
    assert.equal(st.get("1.1"), "done");
    assert.equal(st.get("1.2"), "skipped");
    assert.equal(st.get("2.1"), "attention");
    assert.equal(st.get("3.1"), "failed", "a failure on a scene is not undone by a later success in it");
    assert.equal(st.get("4.2"), "current");
    assert.equal(st.get("9.9"), undefined);
    assert.equal(sceneStates(events, "4.2", true).get("4.2"), undefined, "an ended run has no current scene");
  });

  it("writes the trail in plain words and leaves values out of it", () => {
    const log = stepLog([...events, { seq: 9, type: "value", planKey: "k", value: 1 }, { seq: 10, type: "part_started", partId: "P5" }]);
    assert.equal(log.length, events.length);
    assert.equal(stepLogLine({ seq: 2, type: "step_completed", stepId: "P1_01", sceneId: "1.1", status: "Done", timeSeconds: 12.4, warnings: 2 }),
                 "Completed P1_01 · scene 1.1 in 12 s · 2 warnings");
    assert.equal(stepLogLine({ seq: 3, type: "step_completed", stepId: "P1_02", status: "Skipped", timeSeconds: 0 }), "Skipped P1_02");
    assert.equal(stepLogLine({ seq: 4, type: "warning", stepId: "P1_02", text: "Off the line." }), "Warning on P1_02: Off the line.");
    assert.equal(stepLogLine({ seq: 5, type: "run_ended", outcome: "Abandoned" }), "Stopped part-way");
    assert.equal(stepLogLine({ seq: 6, type: "run_started", mode: "Exam" }), "Case started (Exam)");
  });
});

describe("where to reach it", () => {
  it("offers Watch live while the headset holds the plan or is operating", () => {
    assert.equal(canWatchLive("paired"), true);
    assert.equal(canWatchLive("running"), true);
    assert.equal(canWatchLive("pending"), false);
    assert.equal(canWatchLive("reported"), false);
    assert.equal(livePagePath("a b"), "/live/a%20b");
    assert.equal(frameUrl("a-1", 7), "/api/live/a-1/frame?v=7");
  });

  it("formats the clock and the age", () => {
    assert.equal(clockText(65), "1:05");
    assert.equal(clockText(3725), "1:02:05");
    assert.equal(agoText(2.6), "2 s ago");
    assert.equal(agoText(125), "2 min ago");
    assert.equal(agoText(null), "never");
  });
});

describe("the picture", () => {
  it("is the stream only while the run is live, the headset is on it and the <img> has not broken", () => {
    assert.equal(pictureSource({ liveState: "live" }, true, false), "stream");
    assert.equal(pictureSource({ liveState: "live" }, false, false), "snapshot");
    assert.equal(pictureSource({ liveState: "live" }, true, true), "snapshot");
    assert.equal(pictureSource({ liveState: "paused" }, true, false), "snapshot");
  });
  it("restarts the stream with a new attempt number", () => {
    assert.equal(streamUrl("a b", 3), "/api/live/a%20b/stream?v=3");
  });
});
