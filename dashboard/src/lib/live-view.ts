/**
 * Live view: what the dashboard shows while a resident operates, as pure functions (no fetch, no DOM), so the
 * rules can be tested and shared by the live page, the "Live now" strips and the review page.
 *
 * The headset posts small events and a heartbeat every 5 s to the backend; the backend keeps the run's latest
 * state and the newest eye-view snapshot; the dashboard polls once a second. Live is advisory: nothing here is a
 * score, and the report stays the record. Design: mediver_documentation/25_LIVE_VIEW_AND_RUN_JOURNEY.md.
 */

export type LiveState = "waiting" | "live" | "paused" | "stale" | "lost" | "ended";

export type LiveValue = { value: number; committed: boolean; elapsedS: number };

/** The run's latest state as the backend reduced it (a heartbeat carries all of it). */
export type LiveRunState = {
  mode: string;
  appVersion: string;
  partId: string;
  partName: string;
  stepId: string;
  sceneId: string;
  label: string;
  stepsDone: number;
  stepsTotal: number;
  paused: boolean;
  elapsedS: number;
  warnings: number;
  values: Record<string, LiveValue>;
  lastType: string;
  lastSeq: number;
};

export type LiveEventType =
  | "run_started" | "part_started" | "step_started" | "step_completed" | "warning" | "value"
  | "run_paused" | "run_resumed" | "run_ended";

export type LiveEvent = {
  seq: number;
  type: LiveEventType | string;
  tUtc?: string | null;
  elapsedS?: number | null;
  stepId?: string;
  sceneId?: string;
  label?: string;
  status?: "Done" | "Skipped" | "Failed";
  timeSeconds?: number;
  warnings?: number;
  value?: number;
  planKey?: string;
  committed?: boolean;
  code?: string;
  text?: string;
  partId?: string;
  partName?: string;
  outcome?: string;
  mode?: string;
};

export type LiveFrameMeta = { seq: number; width: number; height: number; capturedAtUtc?: string | null; receivedAtUtc?: string | null };

export type PlanValue = { key: string; label: string; value: number; tolerance: number; unit: string };

export type LiveSummary = {
  assignmentId: string;
  planId: string;
  residentId: string;
  resident: string;
  caseTitle: string;
  mode?: string;
  design?: string;
  fixation?: string;
  assignmentStatus: string;
  liveState: LiveState;
  runId?: string;
  lastSeq: number;
  state: LiveRunState;
  startedAtUtc?: string | null;
  lastEventAtUtc?: string | null;
  secondsSinceEvent?: number | null;
  endedAtUtc?: string | null;
  outcome?: string | null;
  reportOutcome?: string | null;
  scoringStatus?: string | null;
  attemptId?: string | null;
  serverTimeUtc: string;
  events: LiveEvent[];
  frame: LiveFrameMeta | null;
  planValues: PlanValue[];
};

export const EMPTY_STATE: LiveRunState = {
  mode: "", appVersion: "", partId: "", partName: "", stepId: "", sceneId: "", label: "",
  stepsDone: 0, stepsTotal: 0, paused: false, elapsedS: 0, warnings: 0, values: {}, lastType: "", lastSeq: 0,
};

const LIVE_STATES: LiveState[] = ["waiting", "live", "paused", "stale", "lost", "ended"];

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function optNum(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function optStr(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

export function liveSummaryFromApi(row: Record<string, unknown>): LiveSummary {
  const rawState = (row.state ?? {}) as Record<string, unknown>;
  const values: Record<string, LiveValue> = {};
  for (const [k, v] of Object.entries((rawState.values ?? {}) as Record<string, Record<string, unknown>>)) {
    if (v && typeof v === "object") values[k] = { value: num(v.value), committed: v.committed === true, elapsedS: num(v.elapsedS) };
  }
  const liveState = str(row.liveState) as LiveState;
  const frame = row.frame && typeof row.frame === "object" ? (row.frame as Record<string, unknown>) : null;
  return {
    assignmentId: str(row.assignmentId),
    planId: str(row.planId),
    residentId: str(row.residentId),
    resident: str(row.resident),
    caseTitle: str(row.caseTitle),
    mode: optStr(row.mode) ?? undefined,
    design: optStr(row.design) ?? undefined,
    fixation: optStr(row.fixation) ?? undefined,
    assignmentStatus: str(row.assignmentStatus, "pending"),
    liveState: LIVE_STATES.includes(liveState) ? liveState : "waiting",
    runId: optStr(row.runId) ?? undefined,
    lastSeq: num(row.lastSeq),
    state: {
      ...EMPTY_STATE,
      mode: str(rawState.mode), appVersion: str(rawState.appVersion),
      partId: str(rawState.partId), partName: str(rawState.partName),
      stepId: str(rawState.stepId), sceneId: str(rawState.sceneId), label: str(rawState.label),
      stepsDone: num(rawState.stepsDone), stepsTotal: num(rawState.stepsTotal),
      paused: rawState.paused === true, elapsedS: num(rawState.elapsedS), warnings: num(rawState.warnings),
      values, lastType: str(rawState.lastType), lastSeq: num(rawState.lastSeq),
    },
    startedAtUtc: optStr(row.startedAtUtc),
    lastEventAtUtc: optStr(row.lastEventAtUtc),
    secondsSinceEvent: optNum(row.secondsSinceEvent),
    endedAtUtc: optStr(row.endedAtUtc),
    outcome: optStr(row.outcome),
    reportOutcome: optStr(row.reportOutcome),
    scoringStatus: optStr(row.scoringStatus),
    attemptId: optStr(row.attemptId),
    serverTimeUtc: str(row.serverTimeUtc),
    events: Array.isArray(row.events) ? (row.events as LiveEvent[]).filter((e) => e && typeof e.seq === "number") : [],
    frame: frame && typeof frame.seq === "number"
      ? { seq: frame.seq, width: num(frame.width), height: num(frame.height),
          capturedAtUtc: optStr(frame.capturedAtUtc), receivedAtUtc: optStr(frame.receivedAtUtc) }
      : null,
    planValues: Array.isArray(row.planValues)
      ? (row.planValues as Record<string, unknown>[]).map((p) => ({
          key: str(p.key), label: str(p.label, str(p.key)), value: num(p.value), tolerance: num(p.tolerance), unit: str(p.unit),
        }))
      : [],
  };
}

/* ---------- one vocabulary ---------- */

export type LiveWording = { label: string; sentence: string };

/** The words for each state, the same on every screen (design section 4.2). */
export function liveWording(s: Pick<LiveSummary, "liveState" | "assignmentStatus" | "state" | "scoringStatus" | "attemptId">): LiveWording {
  switch (s.liveState) {
    case "waiting":
      return s.assignmentStatus === "paired"
        ? { label: "Headset connected", sentence: "The plan is loaded. The picture appears when the case starts." }
        : { label: "Waiting for the headset", sentence: "Nothing has arrived from the headset yet." };
    case "live": {
      const where = s.state.sceneId ? `Scene ${s.state.sceneId}` : "Case started";
      const count = s.state.stepsTotal > 0 ? `, step ${Math.min(s.state.stepsDone + 1, s.state.stepsTotal)} of ${s.state.stepsTotal}` : "";
      return { label: "Live", sentence: `${where}${count}.` };
    }
    case "paused":
      return { label: "Paused", sentence: "Paused on the headset." };
    case "stale":
      return { label: "Headset not responding", sentence: "It may be a network drop. The run continues on the headset." };
    case "lost":
      return { label: "Connection lost", sentence: "The run continues on the headset. Its report arrives when it reconnects." };
    case "ended":
      if (s.attemptId && s.scoringStatus === "scored") return { label: "Finished", sentence: "The run is finished and scored." };
      if (s.attemptId) return { label: "Finished", sentence: "The run is finished. The report was received." };
      return { label: "Finished", sentence: "The report is being prepared." };
  }
}

/** The one-word chip other screens show beside a learner or a plan. */
export function liveChipText(liveState: LiveState): string {
  return liveWording({ liveState, assignmentStatus: "running", state: EMPTY_STATE, scoringStatus: null, attemptId: null }).label;
}

/* ---------- polling ---------- */

/**
 * How long to wait before asking again, in ms; 0 means stop. A run that has ENDED is still polled every
 * 5 s until its report has landed (`attemptId` set): `run_ended` arrives seconds before the report is
 * ingested, and the band must move from "being prepared" to "View report" without a reload.
 */
export function pollIntervalMs(s: Pick<LiveSummary, "liveState" | "attemptId">, hidden: boolean): number {
  if (s.liveState === "ended") return s.attemptId ? 0 : 5000;
  return hidden ? 5000 : 1000;
}

/** Events are keyed on seq; a poll may repeat some. Keeps the newest `cap`, sorted. */
export function mergeEvents(have: LiveEvent[], incoming: LiveEvent[], cap = 500): LiveEvent[] {
  const bySeq = new Map<number, LiveEvent>();
  for (const e of have) bySeq.set(e.seq, e);
  for (const e of incoming) bySeq.set(e.seq, e);
  const all = [...bySeq.values()].sort((a, b) => a.seq - b.seq);
  return all.length > cap ? all.slice(all.length - cap) : all;
}

/** The live clock: the headset's elapsed seconds, counted on while the run is live, frozen otherwise. */
export function elapsedNow(s: Pick<LiveSummary, "liveState" | "state" | "secondsSinceEvent">, secondsSinceRead: number): number {
  const base = s.state.elapsedS;
  if (s.liveState !== "live") return Math.floor(base);
  return Math.floor(base + Math.max(0, s.secondsSinceEvent ?? 0) + Math.max(0, secondsSinceRead));
}

/* ---------- the running order ---------- */

export type SceneLiveState = "pending" | "current" | "done" | "skipped" | "failed" | "attention";

/**
 * What each scene shows in the running order, from the events so far and the current scene. A scene with any
 * warning and no failure reads "attention"; the scorer decides verdicts, so nothing here says pass or fail
 * in the scoring sense.
 */
export function sceneStates(events: LiveEvent[], currentSceneId: string, ended: boolean): Map<string, SceneLiveState> {
  const out = new Map<string, SceneLiveState>();
  const warned = new Set<string>();
  for (const e of events) {
    if (!e.sceneId) continue;
    if (e.type === "warning") warned.add(e.sceneId);
    if (e.type === "step_completed") {
      const had = out.get(e.sceneId);
      if (e.status === "Failed") out.set(e.sceneId, "failed");
      else if (e.status === "Skipped") out.set(e.sceneId, had === "done" ? "done" : "skipped");
      else out.set(e.sceneId, had === "failed" ? "failed" : "done");
      if ((e.warnings ?? 0) > 0) warned.add(e.sceneId);
    }
  }
  for (const id of warned) if (out.get(id) === "done") out.set(id, "attention");
  if (currentSceneId && !ended) out.set(currentSceneId, "current");
  return out;
}

/** The step log the page shows: starts, completions, warnings, pauses and the end, newest last. */
export function stepLog(events: LiveEvent[]): LiveEvent[] {
  return events.filter((e) => e.type !== "value" && e.type !== "part_started");
}

export function stepLogLine(e: LiveEvent): string {
  switch (e.type) {
    case "run_started": return `Case started${e.mode ? ` (${e.mode})` : ""}`;
    case "step_started": return `Started ${e.label || e.stepId || "a step"}${e.sceneId ? ` · scene ${e.sceneId}` : ""}`;
    case "step_completed": {
      const word = e.status === "Skipped" ? "Skipped" : e.status === "Failed" ? "Failed" : "Completed";
      const took = typeof e.timeSeconds === "number" && e.timeSeconds > 0 ? ` in ${Math.round(e.timeSeconds)} s` : "";
      const warn = (e.warnings ?? 0) > 0 ? ` · ${e.warnings} warning${e.warnings === 1 ? "" : "s"}` : "";
      return `${word} ${e.stepId || "a step"}${e.sceneId ? ` · scene ${e.sceneId}` : ""}${took}${warn}`;
    }
    case "warning": return `Warning${e.stepId ? ` on ${e.stepId}` : ""}: ${e.text || e.code || "something needed attention"}`;
    case "run_paused": return "Paused";
    case "run_resumed": return "Resumed";
    case "run_ended": return e.outcome === "Abandoned" ? "Stopped part-way" : "Case finished";
    default: return e.type;
  }
}

/* ---------- where to reach it ---------- */

/** A "Watch live" link makes sense while the headset holds the plan or is operating. */
export function canWatchLive(assignmentStatus: string): boolean {
  return assignmentStatus === "paired" || assignmentStatus === "running";
}

export function livePagePath(assignmentId: string): string {
  return `/live/${encodeURIComponent(assignmentId)}`;
}

/** The snapshot URL; the seq makes the browser fetch a new image only when there is one. */
export function frameUrl(assignmentId: string, seq: number): string {
  return `/api/live/${encodeURIComponent(assignmentId)}/frame?v=${seq}`;
}

export function clockText(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
    : `${m}:${sec.toString().padStart(2, "0")}`;
}

/** "2 s ago", "1 min ago", for the "Last update" line. */
export function agoText(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return "never";
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) return `${s} s ago`;
  const m = Math.floor(s / 60);
  return `${m} min ago`;
}
