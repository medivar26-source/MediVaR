"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updatePlanPayload } from "@/app/actions";

export type SaveStatus =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at?: string }
  | { kind: "dirty" }
  | { kind: "error"; message: string }
  | { kind: "locked" };

/** JSON with sorted keys, so two equal objects built in different key order compare equal. */
function stable(value: unknown): string {
  const sort = (v: unknown): unknown =>
    Array.isArray(v)
      ? v.map(sort)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.entries(v as Record<string, unknown>)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([k, val]) => [k, sort(val)]),
          )
        : v;
  return JSON.stringify(sort(value));
}

const clock = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

/**
 * Tracks whether a planning component matches what the server last accepted.
 *
 * `current` is the live component; `initiallySaved` is what the plan already held when the page
 * opened (or null when nothing was stored yet). `save` writes to the plan and reports the real
 * outcome — `updatePlanPayload` returns `{ success: false }` rather than throwing, so a failed
 * save used to look identical to a good one.
 */
export function useSaveStatus<T>(
  planId: string,
  current: T,
  initiallySaved: T | null,
  locked: boolean,
): {
  status: SaveStatus;
  save: (updates: Record<string, unknown>, savedValue: T) => Promise<boolean>;
  retry: () => void;
} {
  const [initialJson] = useState(() => stable(current));
  const [savedJson, setSavedJson] = useState<string | null>(
    initiallySaved ? stable(initiallySaved) : null,
  );
  const [savedAt, setSavedAt] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastAttempt = useRef<{ updates: Record<string, unknown>; value: T } | null>(null);

  const currentJson = stable(current);
  const edited = currentJson !== initialJson;
  const dirty = currentJson !== savedJson && (savedJson !== null || edited);

  const save = useCallback(
    async (updates: Record<string, unknown>, savedValue: T) => {
      lastAttempt.current = { updates, value: savedValue };
      setSaving(true);
      setError(null);
      try {
        const result = await updatePlanPayload(planId, updates);
        if (!result.success) {
          setError(result.error ?? "The plan could not be saved.");
          return false;
        }
        setSavedJson(stable(savedValue));
        setSavedAt(clock(new Date()));
        return true;
      } catch {
        setError("Could not reach the server.");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [planId],
  );

  const retry = useCallback(() => {
    if (lastAttempt.current) void save(lastAttempt.current.updates, lastAttempt.current.value);
  }, [save]);

  // Leaving with edits that were never saved loses them (plans live in server memory only
  // until confirmed), so ask first.
  useEffect(() => {
    if (!dirty || locked) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, locked]);

  const status: SaveStatus = locked
    ? { kind: "locked" }
    : saving
      ? { kind: "saving" }
      : error
        ? { kind: "error", message: error }
        : dirty
          ? { kind: "dirty" }
          : savedJson !== null
            ? { kind: "saved", at: savedAt }
            : { kind: "idle" };

  return { status, save, retry };
}

/** Keys move the implant the way it looks on screen: sideways, up and down, or turning. */
export type NudgeAxis = "horizontal" | "vertical" | "rotation_deg";

/**
 * Arrow keys nudge the implant 0.1 mm (Shift: 1 mm); `[` and `]` rotate 0.5° (Shift: 2°).
 * Ignored while typing in a field, and when a modifier is held so browser shortcuts still work.
 * Right and down are positive, matching dragging on the canvas.
 */
export function useNudgeKeys(enabled: boolean, nudge: (axis: NudgeAxis, delta: number) => void) {
  const nudgeRef = useRef(nudge);
  useEffect(() => {
    nudgeRef.current = nudge;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      const move = e.shiftKey ? 1 : 0.1;
      const turn = e.shiftKey ? 2 : 0.5;
      switch (e.key) {
        case "ArrowLeft":
          nudgeRef.current("horizontal", -move);
          break;
        case "ArrowRight":
          nudgeRef.current("horizontal", move);
          break;
        case "ArrowUp":
          nudgeRef.current("vertical", -move);
          break;
        case "ArrowDown":
          nudgeRef.current("vertical", move);
          break;
        case "[":
        case "{":
          nudgeRef.current("rotation_deg", -turn);
          break;
        case "]":
        case "}":
          nudgeRef.current("rotation_deg", turn);
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}

/**
 * The natural size of an image, loaded ahead of time so a measurement never depends on which scan
 * happened to be open. DICOM files are skipped here (the viewer reports their size when shown).
 */
export function useImageDims(src: string | undefined): { width: number; height: number } | null {
  // Keyed by the source, so a size that was read for a previous image is never returned for the new one.
  const [loaded, setLoaded] = useState<{ src: string; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!src || /\.(dcm|dcim)$/i.test(src.split("?")[0])) return;
    let live = true;
    const img = new Image();
    img.onload = () => {
      if (live && img.naturalWidth > 0 && img.naturalHeight > 0) {
        setLoaded({ src, width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  return loaded && loaded.src === src ? { width: loaded.width, height: loaded.height } : null;
}
