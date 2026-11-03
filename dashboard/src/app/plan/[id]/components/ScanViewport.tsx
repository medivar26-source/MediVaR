"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Minus, Plus } from "lucide-react";
import hud from "./ScanViewport.module.css";
const DicomViewer = dynamic(() => import("@/components/cases/DicomViewer"), { ssr: false });

/**
 * Zoom range, relative to the image fitted in the viewport. A full-length leg film fits at about a fifth of
 * its size, so the knee needs far more than 5x to be worked on comfortably.
 */
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 12;

export interface ViewportContext {
  zoom: number;
  pan: { x: number; y: number };
  naturalWidth: number;
  naturalHeight: number;
  fittedWidth: number;
  fittedHeight: number;
  fitScale: number;
  containerSize: { width: number; height: number };
  stageRef: React.RefObject<HTMLDivElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface ScanViewportProps {
  src: string;
  alt?: string;
  children: (props: ViewportContext) => React.ReactNode;
  /** Drawn over the viewport itself, outside the zoomed stage, so it stays put while zooming and panning. */
  overlay?: React.ReactNode;
  /**
   * Zoom in on the image point (`x`, `y`, natural pixels) so that `spanPx` natural pixels fill about half of
   * the viewport, with that point in the middle. It is applied once for each new `nonce`, as soon as the
   * image size is known, so a click can ask for it.
   */
  focus?: { x: number; y: number; spanPx: number; nonce: string | number };
}

export function ScanViewport({ src, alt = "Scan Image", children, overlay, focus }: ScanViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // The size is tagged with the image it was read from, so nothing uses one scan's size for the next scan.
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number; src: string } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const panStartRef = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });

  // Reset zoom & pan when image source changes.
  //
  // The size is cleared here, but an image that is already cached has finished loading by the time
  // this effect runs, and its load event will not fire again. Clearing it unconditionally left the
  // stage stretched to the container and everything drawn in image pixels in the wrong place, so a
  // finished image keeps its size.
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight, src });
    } else {
      setNaturalSize(null);
    }
  }, [src]);

  const appliedFocus = useRef<string | number | null>(null);

  // Wheel zoom and drag are the user's; a focus request only runs when its nonce is new.
  useEffect(() => {
    if (!focus || appliedFocus.current === focus.nonce) return;
    // Wait for this scan's own size: right after a switch the previous scan's size is still in state.
    if (!naturalSize || naturalSize.src !== src || containerSize.width <= 0 || containerSize.height <= 0) return;
    appliedFocus.current = focus.nonce;
    const fitScale = Math.min(containerSize.width / naturalSize.width, containerSize.height / naturalSize.height);
    const zoomTo = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, (0.5 * Math.min(containerSize.width, containerSize.height)) / (Math.max(focus.spanPx, 1) * fitScale)));
    const dx = (focus.x - naturalSize.width / 2) * fitScale;
    const dy = (focus.y - naturalSize.height / 2) * fitScale;
    // A one-off move of the view, asked for from outside: there is nothing to derive it from during render.
    /* eslint-disable react-hooks/set-state-in-effect */
    setZoom(zoomTo);
    setPan({ x: -zoomTo * dx, y: -zoomTo * dy });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [focus, naturalSize, containerSize, src]);

  // Monitor container dimensions with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Handle image load to capture intrinsic aspect ratio
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight, src });
    }
  };

  const handleDicomLoad = (size: { naturalWidth: number; naturalHeight: number }) => {
    if (size.naturalWidth > 0 && size.naturalHeight > 0) {
      setNaturalSize({ width: size.naturalWidth, height: size.naturalHeight, src });
    }
  };

  // Compute fitted dimensions: image stage exactly matches the image's displayed dimensions
  const { fittedWidth, fittedHeight } = React.useMemo(() => {
    if (!naturalSize || containerSize.width <= 0 || containerSize.height <= 0) {
      return { fittedWidth: containerSize.width || 600, fittedHeight: containerSize.height || 600 };
    }

    const fitScale = Math.min(
      containerSize.width / naturalSize.width,
      containerSize.height / naturalSize.height
    );

    return {
      fittedWidth: Math.round(naturalSize.width * fitScale),
      fittedHeight: Math.round(naturalSize.height * fitScale),
    };
  }, [naturalSize, containerSize]);

  // Wheel zoom centered on cursor. Registered natively below: React attaches wheel listeners as
  // passive, so a preventDefault() in an onWheel prop is ignored and the page scrolls as well as the scan.
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // Floating panels over the scan (marked data-no-wheel) keep their own wheel.
      if ((e.target as Element | null)?.closest("[data-no-wheel]")) return;
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * zoomFactor));

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const ratio = newZoom / zoom;
        setPan((prev) => ({
          x: mouseX - (mouseX - prev.x) * ratio,
          y: mouseY - (mouseY - prev.y) * ratio,
        }));
      }

      setZoom(newZoom);
    },
    [zoom]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Left-drag moves the scan, anywhere on it, including while a point is being placed (points are placed with
  // the right button, so the two never compete). The right button does not pan.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    // If pointer hit a landmark handle or button, do not start canvas pan
    const target = e.target as HTMLElement;
    if (target.closest("[data-landmark]") || target.closest("button")) {
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsPanning(true);
    panStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.pointerX;
    const dy = e.clientY - panStartRef.current.pointerY;
    setPan({
      x: panStartRef.current.panX + dx,
      y: panStartRef.current.panY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
      setIsPanning(false);
    }
  };

  // Zoom button actions
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(MAX_ZOOM, Number((prev * 1.25).toFixed(2))));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(MIN_ZOOM, Number((prev / 1.25).toFixed(2))));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        overflow: "hidden",
        userSelect: "none",
        touchAction: "none",
        overscrollBehavior: "contain",
        cursor: isPanning ? "grabbing" : "grab",
      }}
    >
      {/* Zoom bar. Its buttons stop their own clicks, so pressing one never starts a pan or places a point. */}
      <div className={hud.hud} role="group" aria-label="Zoom">
        <button
          type="button"
          className={hud.hudBtn}
          onClick={handleZoomOut}
          disabled={zoom <= MIN_ZOOM}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <Minus className={hud.hudIcon} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <span className={hud.hudZoom} aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className={hud.hudBtn}
          onClick={handleZoomIn}
          disabled={zoom >= MAX_ZOOM}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <Plus className={hud.hudIcon} strokeWidth={2.25} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${hud.hudBtn} ${hud.hudReset}`}
          onClick={handleResetZoom}
          title="Fit the whole scan in view"
        >
          Reset
        </button>
      </div>

      {overlay}

      <div className={hud.hint}>
        Scroll to zoom • Left-drag to move the scan • Right-click to place a point
      </div>

      {/* Aspect-Ratio-Locked Image & Overlay Stage */}
      <div
        ref={stageRef}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: `${fittedWidth}px`,
          height: `${fittedHeight}px`,
          transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          // Only while the scan is being dragged. A permanent `will-change: transform` makes the browser
          // keep this layer as a bitmap at its original size and merely stretch it when zooming, so the
          // scan, the landmark tags and every label turn soft. At rest the browser redraws the layer at
          // the zoomed size, which keeps text and lines sharp.
          willChange: isPanning ? "transform" : "auto",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(() => {
          const urlWithoutQuery = src.split('?')[0].toLowerCase();
          const isDicom = urlWithoutQuery.endsWith('.dcm') || urlWithoutQuery.endsWith('.dcim');
          return isDicom ? (
          <DicomViewer
            src={src}
            alt={alt}
            onLoad={handleDicomLoad}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ) : (
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            onLoad={handleImageLoad}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        );
        })()}

        {/* Children (SVGs, Landmark Markers, Component Overlays) */}
        {children({
          zoom,
          pan,
          naturalWidth: naturalSize?.width || fittedWidth || 800,
          naturalHeight: naturalSize?.height || fittedHeight || 800,
          fittedWidth,
          fittedHeight,
          fitScale: naturalSize && naturalSize.width > 0 ? fittedWidth / naturalSize.width : 1,
          containerSize,
          stageRef,
          containerRef,
        })}
      </div>
    </div>
  );
}
