"use client";

import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  MARKER_KEYS,
  MARKER_VIEW,
  allMarkersPlaced,
  deriveBone,
  type BoneModel,
  type ComponentKind,
  type MarkerKey,
  type ScanView,
  type ViewScale,
} from "@/lib/data/fit_markers";
import { SCAN_VIEW_NAME, type ScanScale } from "@/lib/data/scan_scale";
import type { PlanDetail, V1FitMarkers } from "@/lib/plan";
import { useScanCalibration } from "./useScanCalibration";

type WithMarkers = {
  fit_markers?: V1FitMarkers;
  is_confirmed?: boolean;
  estimated_scale_accepted?: boolean;
};

export type SessionScan = ScanScale;

/**
 * Everything a planning screen needs to measure fit against marked bone edges, shared by the tibial
 * and femoral workspaces: the two scans with their scale, the markers and what they measure, which
 * marker is being placed, and which scan is showing.
 *
 * The markers live on the component itself, so moving one marks the plan as having unsaved changes
 * and withdraws an earlier confirmation, exactly as moving the implant does. So does a change of scale.
 */
export function useFitSession<T extends WithMarkers>({
  kind,
  plan,
  component,
  setComponent,
  isReadOnly,
}: {
  kind: ComponentKind;
  plan: PlanDetail;
  component: T;
  setComponent: Dispatch<SetStateAction<T>>;
  isReadOnly: boolean;
}) {
  const [viewMode, setViewMode] = useState<ScanView>("FLAP");
  const [placing, setPlacing] = useState<MarkerKey | null>(null);

  const cal = useScanCalibration({
    plan,
    isReadOnly,
    // A fit confirmed at one scale says nothing about another.
    onScaleChanged: () => setComponent((prev) => ({ ...prev, is_confirmed: false })),
  });
  const { scales, dims } = cal;

  const scaleOf = (view: ScanView): ViewScale | undefined => {
    const d = dims[view];
    return d
      ? { widthPx: d.width, heightPx: d.height, mmPerPx: scales[view].mmPerPx, calibrated: scales[view].calibrated }
      : undefined;
  };
  const flapScale = scaleOf("FLAP");
  const klatScale = scaleOf("KLAT");

  const markers: V1FitMarkers = component.fit_markers ?? {};

  const bone: BoneModel = useMemo(
    () => deriveBone(kind, markers, flapScale, klatScale),
    // The scale objects are rebuilt every render; their numbers are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      kind,
      markers.medial?.x, markers.medial?.y, markers.lateral?.x, markers.lateral?.y,
      markers.anterior?.x, markers.anterior?.y, markers.posterior?.x, markers.posterior?.y,
      flapScale?.widthPx, flapScale?.heightPx, flapScale?.mmPerPx, flapScale?.calibrated,
      klatScale?.widthPx, klatScale?.heightPx, klatScale?.mmPerPx, klatScale?.calibrated,
    ],
  );

  const setMarker = useCallback(
    (key: MarkerKey, point: { x: number; y: number }) => {
      if (isReadOnly) return;
      setComponent((prev) => ({
        ...prev,
        fit_markers: { ...prev.fit_markers, [key]: point, confirmed: false },
        // A different bone means any earlier confirmation no longer describes what is on screen.
        is_confirmed: false,
      }));
    },
    [isReadOnly, setComponent],
  );

  const placeMarker = useCallback(
    (key: MarkerKey, point: { x: number; y: number }) => {
      setMarker(key, point);
      // Carry on to the next missing marker so four clicks mark the whole bone.
      const next = MARKER_KEYS.find((k) => k !== key && !markers[k]);
      setPlacing(next ?? null);
      if (next) setViewMode(MARKER_VIEW[next]);
    },
    [markers, setMarker],
  );

  const startPlacing = useCallback((key: MarkerKey) => {
    cal.cancelCalibrating();
    setPlacing((current) => (current === key ? null : key));
    setViewMode(MARKER_VIEW[key]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cal.cancelCalibrating]);

  const startCalibrating = useCallback(
    (view: ScanView) => {
      setPlacing(null);
      setViewMode(view);
      cal.startCalibrating(view);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cal.startCalibrating],
  );

  const confirmMarkers = useCallback(() => {
    if (isReadOnly) return;
    setComponent((prev) =>
      allMarkersPlaced(prev.fit_markers)
        ? { ...prev, fit_markers: { ...prev.fit_markers, confirmed: true }, is_confirmed: false }
        : prev,
    );
    setPlacing(null);
  }, [isReadOnly, setComponent]);

  const acceptEstimatedScale = useCallback(
    (accepted: boolean) => {
      if (isReadOnly) return;
      setComponent((prev) => ({ ...prev, estimated_scale_accepted: accepted, is_confirmed: false }));
    },
    [isReadOnly, setComponent],
  );

  /** Each scan that has no verified scale, unless the surgeon has knowingly accepted the estimate. */
  const scaleBlockers: string[] = component.estimated_scale_accepted
    ? []
    : (["FLAP", "KLAT"] as ScanView[])
        .filter((v) => !scales[v].calibrated)
        .map((v) => `Set the scale of the ${SCAN_VIEW_NAME[v]} scan, or accept the estimate.`);

  return {
    viewMode,
    setViewMode,
    placing,
    setPlacing,
    startPlacing,
    placeMarker,
    setMarker,
    confirmMarkers,
    markers,
    markersConfirmed: Boolean(markers.confirmed) && allMarkersPlaced(markers),
    bone,
    scanOf: (view: ScanView): SessionScan => scales[view],
    reportDims: cal.reportDims,
    calibration: { ...cal, startCalibrating },
    estimatedScaleAccepted: Boolean(component.estimated_scale_accepted),
    acceptEstimatedScale,
    scaleBlockers,
  };
}
