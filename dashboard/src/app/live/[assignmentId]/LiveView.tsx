"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui";
import {
  agoText,
  clockText,
  elapsedNow,
  frameUrl,
  liveSummaryFromApi,
  liveWording,
  mergeEvents,
  pollIntervalMs,
  sceneStates,
  stepLog,
  stepLogLine,
  type LiveEvent,
  type LiveSummary,
} from "@/lib/live-view";
import s from "./live.module.css";

type SceneRowLite = { scene: string; label: string; part: string };

/**
 * The part of the live page that moves.
 *
 * Polls `/api/live/{id}?after=<seq>` once a second while the tab is visible, every 5 s while hidden, and stops at
 * `ended`. The elapsed clock counts on from the headset's own `elapsedS` (the same clock as the report's
 * duration), resynced by every poll. The snapshot `<img>` swaps only once the next image has loaded, so the
 * picture never flickers to blank between frames. Nothing here scores anything: states read "done", "skipped",
 * "needs attention", never pass or fail.
 */
export function LiveView({ initial, scenes }: { initial: LiveSummary; scenes: SceneRowLite[] }) {
  const [summary, setSummary] = useState(initial);
  const [events, setEvents] = useState<LiveEvent[]>(initial.events);
  const [readAt, setReadAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [shownFrame, setShownFrame] = useState<string | null>(initial.frame ? frameUrl(initial.assignmentId, initial.frame.seq) : null);
  const [offline, setOffline] = useState(false);
  const lastSeq = useRef(initial.events.reduce((m, e) => Math.max(m, e.seq), 0));
  const loadingFrame = useRef<number | null>(null);

  // The clock.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // The poll. One timer at a time; the interval follows the state and the tab's visibility.
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (s: Pick<LiveSummary, "liveState" | "attemptId">) => {
      const wait = pollIntervalMs(s, typeof document !== "undefined" && document.hidden);
      if (wait === 0) return;
      timer = setTimeout(tick, wait);
    };

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/live/${encodeURIComponent(initial.assignmentId)}?after=${lastSeq.current}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = liveSummaryFromApi((await res.json()) as Record<string, unknown>);
        if (cancelled) return;
        setOffline(false);
        setSummary(next);
        setReadAt(Date.now());
        if (next.events.length) {
          lastSeq.current = Math.max(lastSeq.current, ...next.events.map((e) => e.seq));
          setEvents((have) => mergeEvents(have, next.events));
        }
        schedule(next);
      } catch {
        if (cancelled) return;
        setOffline(true);
        schedule({ liveState: "stale", attemptId: null });
      }
    };

    const onVisibility = () => {
      if (timer) clearTimeout(timer);
      void tick();
    };
    document.addEventListener("visibilitychange", onVisibility);
    schedule(initial);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [initial]);

  // The snapshot: fetch the next frame off-screen, show it only once it has loaded.
  const frameSeq = summary.frame?.seq ?? null;
  useEffect(() => {
    if (frameSeq === null || loadingFrame.current === frameSeq) return;
    const url = frameUrl(summary.assignmentId, frameSeq);
    if (shownFrame === url) return;
    loadingFrame.current = frameSeq;
    const img = new Image();
    img.onload = () => setShownFrame(url);
    img.src = url;
  }, [frameSeq, summary.assignmentId, shownFrame]);

  const wording = liveWording(summary);
  const ended = summary.liveState === "ended";
  const elapsed = elapsedNow(summary, (now - readAt) / 1000);
  const sinceRead = (now - readAt) / 1000;
  const lastUpdate = summary.secondsSinceEvent === null || summary.secondsSinceEvent === undefined
    ? null
    : summary.secondsSinceEvent + sinceRead;
  const states = sceneStates(events, summary.state.sceneId, ended);
  const log = stepLog(events).slice(-12).reverse();
  const banner = summary.liveState === "live" ? s.banner : s.bannerIdle;
  const progress = summary.state.stepsTotal > 0 ? Math.min(1, summary.state.stepsDone / summary.state.stepsTotal) : 0;
  const reportHref = summary.attemptId && summary.scoringStatus === "scored" ? `/sessions/${summary.attemptId}/report` : null;

  return (
    <>
      <section className={banner} aria-live="polite">
        <div className={s.bannerMain}>
          <p className={s.bannerLabel}>{wording.label}</p>
          <p className={s.bannerScene}>
            {summary.state.sceneId ? `Scene ${summary.state.sceneId}` : wording.label}
          </p>
          <p className={s.bannerText}>
            {summary.state.label ? `${summary.state.label}. ` : ""}
            {wording.sentence}
            {offline ? " The dashboard cannot reach the server right now." : ""}
          </p>
        </div>
        <div className={s.bannerStats}>
          <div className={s.bannerStat}>
            <span className={s.bannerStatLabel}>Elapsed</span>
            <span className={s.bannerStatValue}>{clockText(elapsed)}</span>
          </div>
          <div className={s.bannerStat}>
            <span className={s.bannerStatLabel}>Steps</span>
            <span className={s.bannerStatValue}>
              {summary.state.stepsTotal > 0 ? `${summary.state.stepsDone} / ${summary.state.stepsTotal}` : "—"}
            </span>
          </div>
          <div className={s.bannerStat}>
            <span className={s.bannerStatLabel}>Last update</span>
            <span className={s.bannerStatValue}>{agoText(lastUpdate)}</span>
          </div>
        </div>
        <div className={s.bannerTrack} aria-hidden="true">
          <div className={s.bannerFill} style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        {ended && (
          <div className={s.bannerActions}>
            {reportHref ? (
              <Link className={s.bannerLink} href={reportHref}>View report</Link>
            ) : (
              <span className={s.bannerMuted}>{summary.attemptId ? "The report was received." : "The report is being prepared."}</span>
            )}
          </div>
        )}
      </section>

      <div className={s.grid}>
        <Card padding="none" className={s.frameCard}>
          <CardHeader flush title="What the resident sees" subtitle="Snapshot, about once a second. Not video." />
          <div className={s.frameBox}>
            {shownFrame ? (
              // The frame is a plain <img>: it is a live JPEG served through a route handler, never optimised or cached.
              // eslint-disable-next-line @next/next/no-img-element
              <img className={s.frame} src={shownFrame} alt={`Headset view, scene ${summary.state.sceneId || "unknown"}`} />
            ) : (
              <p className={s.frameEmpty}>
                {ended ? "The run has finished. The picture is no longer kept." : "No picture yet. It appears when the case starts and somebody is watching."}
              </p>
            )}
          </div>
        </Card>

        <Card padding="none" className={s.valuesCard}>
          <CardHeader flush title="Live values against the plan" subtitle="Committed values are what the report will carry." />
          {summary.planValues.length === 0 && Object.keys(summary.state.values).length === 0 ? (
            <p className={s.cardEmpty}>No values yet.</p>
          ) : (
            <ul className={s.values}>
              {summary.planValues.map((p) => {
                const live = summary.state.values[p.key];
                return (
                  <li key={p.key} className={s.value}>
                    <span className={s.valueLabel}>{p.label}</span>
                    <span className={s.valuePlan}>plan {fmt(p.value)} {unit(p.unit)}</span>
                    <span className={s.valueLive} data-committed={live?.committed ? "true" : "false"}>
                      {live ? `${fmt(live.value)} ${unit(p.unit)}` : "—"}
                      {live ? <small>{live.committed ? " committed" : " live"}</small> : null}
                    </span>
                  </li>
                );
              })}
              {Object.entries(summary.state.values)
                .filter(([k]) => !summary.planValues.some((p) => p.key === k))
                .map(([k, v]) => (
                  <li key={k} className={s.value}>
                    <span className={s.valueLabel}>{k}</span>
                    <span className={s.valuePlan}>no plan</span>
                    <span className={s.valueLive} data-committed={v.committed ? "true" : "false"}>
                      {fmt(v.value)}<small>{v.committed ? " committed" : " live"}</small>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card padding="none" className={s.orderCard}>
          <CardHeader flush title="Running order" subtitle={`${scenes.length} scenes for this variant`} />
          <ol className={s.scenes}>
            {scenes.map((sc) => {
              const state = states.get(sc.scene) ?? "pending";
              return (
                <li key={sc.scene} className={s.scene} data-current={state === "current" ? "true" : undefined}>
                  <span className={s.sceneTag}>{sc.scene}</span>
                  <span className={s.sceneBody}>
                    <span className={s.sceneLabel}>{sc.label}</span>
                    <span className={s.sceneMeta}>{sc.part}</span>
                  </span>
                  <span className={s.sceneState} data-state={state} />
                </li>
              );
            })}
          </ol>
        </Card>

        <Card padding="none" className={s.logCard}>
          <CardHeader flush title="What happened" subtitle="Newest first. The report is the record; this is the trail." />
          {log.length === 0 ? (
            <p className={s.cardEmpty}>Nothing yet.</p>
          ) : (
            <ol className={s.log}>
              {log.map((e) => (
                <li key={e.seq} className={s.logRow} data-kind={e.type}>
                  <span className={s.logTime}>{typeof e.elapsedS === "number" ? clockText(e.elapsedS) : "—"}</span>
                  <span className={s.logText}>{stepLogLine(e)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}

function fmt(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function unit(u: string): string {
  return u === "deg" ? "°" : u;
}
