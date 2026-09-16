"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { clock } from "@/lib/format";
import { SESSION_STATUS_LABEL } from "@/lib/report";
import s from "./live.module.css";

/**
 * The part of the live mirror that moves.
 *
 * One thing ticks today: the elapsed clock, counting on from a server-computed
 * `elapsedS` rather than from `Date.now()` against `startedAt`, so the first
 * client paint matches the server HTML (the `LiveDial` rule).
 *
 * The scene marker and the completed count are rendered from the state the
 * session had at request time and then hold still. Moving them as the operation
 * runs needs a live channel from the headset, and there is nothing on the other
 * end of one yet — so this component subscribes to nothing rather than opening
 * a socket that could only ever stay silent.
 *
 * The scene list itself is **server-rendered** with each scene's recorded state
 * and passed through `children`. This component reaches into the DOM to mark
 * the current scene rather than owning the list, because owning it would mean
 * passing every scene across the RSC boundary and re-rendering thirty rows to
 * change one attribute.
 */
export function LiveMirror({
  status: initialStatus,
  elapsedS,
  initialScene,
  initialDone,
  scenesTotal,
  children,
}: {
  status: string;
  /** Seconds elapsed at render time, computed on the server. */
  elapsedS: number;
  initialScene: string | null;
  initialDone: number;
  scenesTotal: number;
  children: ReactNode;
}) {
  const status = initialStatus;
  const currentScene = initialScene;
  const done = initialDone;
  const [elapsed, setElapsed] = useState(elapsedS);

  const live = status === "live";

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  useEffect(() => {
    if (!currentScene) return;
    const node = document.querySelector<HTMLElement>(
      `[data-scene="${CSS.escape(currentScene)}"]`,
    );
    node?.setAttribute("data-current", "true");
    return () => node?.removeAttribute("data-current");
  }, [currentScene]);

  const progress = scenesTotal > 0 ? Math.min(1, done / scenesTotal) : 0;

  return (
    <>
      <section className={live ? s.banner : s.bannerIdle}>
        <div className={s.bannerMain}>
          <p className={s.bannerLabel}>{SESSION_STATUS_LABEL[status] ?? status}</p>
          <p className={s.bannerScene}>
            {currentScene ? `Scene ${currentScene}` : "Waiting for the headset"}
          </p>
        </div>

        <div className={s.bannerStats}>
          <div className={s.bannerStat}>
            <span className={s.bannerStatLabel}>Elapsed</span>
            {/* Seeded from the server's `elapsedS`, so the first client paint
                is the server HTML and nothing needs suppressing. */}
            <span className={s.bannerStatValue}>{clock(elapsed)}</span>
          </div>
          <div className={s.bannerStat}>
            <span className={s.bannerStatLabel}>Scenes</span>
            <span className={s.bannerStatValue}>
              {done} / {scenesTotal}
            </span>
          </div>
        </div>

        <div
          className={s.bannerTrack}
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={scenesTotal}
          aria-label="Scenes completed"
        >
          <span className={s.bannerFill} style={{ width: `${progress * 100}%` }} />
        </div>
      </section>

      {children}
    </>
  );
}
