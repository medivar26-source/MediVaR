"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface ScanViewportProps {
  src: string;
  alt?: string;
  children: (props: {
    zoom: number;
    stageRef: React.RefObject<HTMLDivElement | null>;
  }) => React.ReactNode;
}

export function ScanViewport({ src, alt = "Scan Image", children }: ScanViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);

  const panStartRef = useRef({ pointerX: 0, pointerY: 0, panX: 0, panY: 0 });

  // Reset zoom & pan when image source changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setNaturalSize(null);
  }, [src]);

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
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
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

  // Wheel zoom centered on cursor
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      const newZoom = Math.max(0.5, Math.min(5.0, zoom * zoomFactor));

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

  // Background drag-to-pan
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // If pointer hit a landmark or button, do not start canvas pan
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
    setZoom((prev) => Math.min(5.0, Number((prev * 1.25).toFixed(2))));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.max(0.5, Number((prev / 1.25).toFixed(2))));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
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
        cursor: isPanning ? "grabbing" : zoom > 1 ? "grab" : "default",
      }}
    >
      {/* Floating Zoom & Pan HUD Toolbar */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "8px",
          padding: "4px 8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
        }}
      >
        <button
          type="button"
          onClick={handleZoomOut}
          title="Zoom Out"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fff",
            borderRadius: "4px",
            width: "26px",
            height: "26px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          −
        </button>

        <span
          style={{
            color: "#e2e8f0",
            fontSize: "12px",
            fontWeight: 600,
            minWidth: "42px",
            textAlign: "center",
          }}
        >
          {Math.round(zoom * 100)}%
        </span>

        <button
          type="button"
          onClick={handleZoomIn}
          title="Zoom In"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#fff",
            borderRadius: "4px",
            width: "26px",
            height: "26px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>

        <button
          type="button"
          onClick={handleResetZoom}
          title="Reset Zoom & Fit View"
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#94a3b8",
            borderRadius: "4px",
            padding: "2px 8px",
            height: "26px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          Reset
        </button>
      </div>

      {/* Helper text overlay in bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: "10px",
          left: "12px",
          zIndex: 40,
          color: "rgba(255, 255, 255, 0.5)",
          fontSize: "11px",
          pointerEvents: "none",
          background: "rgba(0, 0, 0, 0.4)",
          padding: "2px 6px",
          borderRadius: "4px",
        }}
      >
        Scroll to zoom • Drag background to pan
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
          willChange: "transform",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
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

        {/* Children (SVGs, Landmark Markers, Component Overlays) */}
        {children({ zoom, stageRef })}
      </div>
    </div>
  );
}
