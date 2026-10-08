"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { RefObject } from "react";

type Props = {
  /** Show the lens: while a point is being placed or dragged. */
  active: boolean;
  stageRef: RefObject<HTMLDivElement | null>;
  src: string;
  naturalWidth: number;
  naturalHeight: number;
  /** Stage pixels per natural image pixel at zoom 1. */
  fitScale: number;
  zoom: number;
  /** How much larger than the current on-screen scale the lens draws the image. */
  magnification?: number;
};

const SIZE = 132;

/**
 * Magnifying-lens hover assistance (V1 PDF p.3: "A vector node appears with magnifying lens hover
 * assistance"). While a point is being placed or moved, a round lens follows the pointer and shows the
 * scan magnified around it with a cross-hair, so a landmark can be placed to a pixel.
 *
 * DICOM files are drawn by a canvas viewer rather than an <img>, so the lens cannot read them and stays
 * hidden for those (the placement itself still works).
 */
export function Loupe({ active, stageRef, src, naturalWidth, naturalHeight, fitScale, zoom, magnification = 3 }: Props) {
  const [pointer, setPointer] = useState<{ cx: number; cy: number; ix: number; iy: number } | null>(null);
  const drawable = Boolean(src) && !/\.(dcm|dcim)$/i.test(src.split("?")[0]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!active || !stage || !drawable) {
      setPointer(null);
      return;
    }
    const onMove = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setPointer({
        cx: e.clientX,
        cy: e.clientY,
        ix: ((e.clientX - rect.left) / rect.width) * naturalWidth,
        iy: ((e.clientY - rect.top) / rect.height) * naturalHeight,
      });
    };
    const onLeave = () => setPointer(null);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, [active, drawable, stageRef, naturalWidth, naturalHeight]);

  if (!active || !drawable || !pointer || typeof document === "undefined") return null;

  const s = Math.max(0.0001, fitScale * zoom * magnification); // lens pixels per natural image pixel
  const left = Math.min(pointer.cx + 26, window.innerWidth - SIZE - 8);
  const top = Math.max(8, pointer.cy - SIZE - 26);

  return createPortal(
    <div
      aria-hidden="true"
      data-loupe
      style={{
        position: "fixed",
        left,
        top,
        width: SIZE,
        height: SIZE,
        borderRadius: "50%",
        border: "2px solid #fff",
        boxShadow: "0 4px 14px rgba(0,0,0,0.55), 0 0 0 1px rgba(15,23,42,0.6)",
        backgroundColor: "#020617",
        backgroundImage: `url("${src}")`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${naturalWidth * s}px ${naturalHeight * s}px`,
        backgroundPosition: `${SIZE / 2 - pointer.ix * s}px ${SIZE / 2 - pointer.iy * s}px`,
        pointerEvents: "none",
        zIndex: 10000,
        overflow: "hidden",
      }}
    >
      <span style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(250,204,21,0.9)" }} />
      <span style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(250,204,21,0.9)" }} />
    </div>,
    document.body,
  );
}
