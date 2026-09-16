"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./LiveDial.module.css";

export type LiveDialProps = {
  /** "live" ticks a clock; "interrupted" shows where it stopped. */
  state: "live" | "interrupted";
  /** Seconds elapsed at render time, computed on the server. */
  initialElapsedS: number;
  /** 0–1 through the procedure. */
  progress: number;
  href: string;
  /** Read out by assistive tech. */
  label: string;
};

function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * The timer starts from a server-computed value so the first client paint
 * matches the server HTML — ticking from `Date.now()` instead would hydrate
 * with a mismatch. Only the live state advances; an interrupted session's
 * clock is stopped by definition.
 */
export function LiveDial({
  state,
  initialElapsedS,
  progress,
  href,
  label,
}: LiveDialProps) {
  const [elapsed, setElapsed] = useState(initialElapsedS);
  const live = state === "live";

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [live]);

  const R = 29;
  const circumference = 2 * Math.PI * R;
  const clamped = Math.max(0, Math.min(1, progress));
  const ActionIcon = live ? Play : RotateCcw;

  return (
    <Link
      href={href}
      className={cx(s.dial, !live && s.warnDial)}
      aria-label={`${live ? "Live session" : "Interrupted session"}: ${label}. ${clock(
        elapsed,
      )} elapsed, ${Math.round(clamped * 100)}% through the procedure. ${
        live ? "Watch progress." : "Resume."
      }`}
      title={`${live ? "Live" : "Interrupted"} — ${label}`}
    >
      <svg className={s.ring} viewBox="0 0 64 64" aria-hidden="true">
        <circle className={s.track} cx="32" cy="32" r={R} />
        <circle
          className={s.progress}
          cx="32"
          cy="32"
          r={R}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - clamped)}
        />
      </svg>

      <span className={s.face}>
        <span className={s.time} suppressHydrationWarning>
          {clock(elapsed)}
        </span>
        <span className={s.caption}>{live ? "Live" : "Held"}</span>
      </span>

      <span className={s.action} aria-hidden="true">
        <ActionIcon className={s.actionGlyph} strokeWidth={2.25} />
      </span>
    </Link>
  );
}
