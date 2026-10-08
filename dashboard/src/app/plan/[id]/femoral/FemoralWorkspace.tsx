"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui";
import type { PlanDetail, V1FemoralComponent } from "@/lib/plan";
import { evaluateFemoralFit, getFemoralTemplate } from "@/lib/data/tkr_templates";
import { autoFitFemoral, clearanceText, rankFemoralSizes, seedMarkers, sideGaps, type MarkerKey } from "@/lib/data/fit_markers";
import { mapShapes, type MapPosition } from "@/lib/data/fit_map";
import { resolvePlanScales, sameScale } from "@/lib/data/scan_scale";
import { useFitSession } from "../components/useFitSession";
import { FitMap, type MapSide } from "../components/FitMap";
import { FitChip } from "../components/FitPanels";
import s from "../plan.module.css";
import { FemoralCanvas } from "./FemoralCanvas";
import { FemoralControlsPanel } from "./FemoralControlsPanel";

export type FemoralViewMode = "FLAP" | "KLAT";

const DEFAULT_FEMORAL_COMPONENT: V1FemoralComponent = {
  implant_size: 4,
  position_2d: { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0 },
  is_confirmed: false,
};

export function FemoralWorkspace({ plan }: { plan: PlanDetail }) {
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;

  const [femoralComponent, setFemoralComponent] = useState<V1FemoralComponent>(() => {
    const saved =
      isReadOnly && plan.lockedVersion?.payload.v1_femoral
        ? { ...plan.lockedVersion.payload.v1_femoral, is_confirmed: true }
        : plan.payload.v1_femoral
          ? { ...plan.payload.v1_femoral, is_confirmed: isReadOnly ? true : plan.payload.v1_femoral.is_confirmed }
          : { ...DEFAULT_FEMORAL_COMPONENT };

    // Plans saved before bone-edge markers existed start from a guess taken from the assessment.
    const markers = saved.fit_markers ?? seedMarkers("femoral", plan.payload);
    const template = getFemoralTemplate(saved.implant_size);
    // A fit confirmed at one scale says nothing about another: if either scan's scale has changed since,
    // the confirmation is withdrawn and the fit has to be looked at again.
    const now = resolvePlanScales(plan);
    const scaleChanged =
      !isReadOnly &&
      Boolean(saved.is_confirmed) &&
      Boolean(saved.scales) &&
      (!sameScale(saved.scales?.FLAP, now.FLAP.mmPerPx) || !sameScale(saved.scales?.KLAT, now.KLAT.mmPerPx));

    return {
      ...saved,
      is_confirmed: scaleChanged ? false : saved.is_confirmed,
      fit_markers: markers,
      ap_dimension_mm: template.apMm,
      ml_dimension_mm: template.mlMm,
    };
  });

  const session = useFitSession<V1FemoralComponent>({
    kind: "femoral",
    plan,
    component: femoralComponent,
    setComponent: setFemoralComponent,
    isReadOnly,
  });
  const { bone } = session;

  const pos = femoralComponent.position_2d;
  const fitResult = useMemo(
    () =>
      bone.complete
        ? evaluateFemoralFit(
            femoralComponent.implant_size,
            pos.x_offset_mm,
            pos.y_offset_mm,
            bone.apMm!,
            bone.mlMm!,
            pos.rotation_deg,
            bone.orientation,
          )
        : undefined,
    [bone, femoralComponent.implant_size, pos.x_offset_mm, pos.y_offset_mm, pos.rotation_deg],
  );

  const ranking = useMemo(() => rankFemoralSizes(bone, pos.rotation_deg), [bone, pos.rotation_deg]);

  // Any move, from the scan, the map or the keys, goes through here and asks for a new confirmation.
  const handleMove = (next: Partial<MapPosition> & { level_offset_mm?: number }) => {
    if (isReadOnly) return;
    const { level_offset_mm, ...position } = next;
    setFemoralComponent((prev) => ({
      ...prev,
      position_2d: { ...prev.position_2d, ...position },
      ...(level_offset_mm !== undefined ? { level_offset_mm } : {}),
      is_confirmed: false,
    }));
  };

  const shapes = useMemo(
    () => mapShapes("femoral", femoralComponent.implant_size, bone, pos),
    [bone, femoralComponent.implant_size, pos],
  );

  const gaps = fitResult ? sideGaps(fitResult.extents, bone) : undefined;
  // The spec sets no limit for the sides or the back, so they are shown in plain grey, not judged.
  const mapSides: Record<MarkerKey, MapSide> | undefined =
    fitResult && gaps
      ? {
          medial: { text: clearanceText(fitResult.medialOverhangMm, gaps.medial), tone: "info" },
          lateral: { text: clearanceText(fitResult.lateralOverhangMm, gaps.lateral), tone: "info" },
          anterior: { text: clearanceText(fitResult.anteriorProudMm, fitResult.notchingRiskMm), tone: fitResult.notchTone },
          posterior: { text: clearanceText(fitResult.posteriorOverhangMm, gaps.posterior), tone: "info" },
        }
      : undefined;

  const bestPosition = () => {
    const best = autoFitFemoral(femoralComponent.implant_size, bone, pos.rotation_deg);
    handleMove({ x_offset_mm: best.x, y_offset_mm: best.y });
  };

  const currentScan = session.scanOf(session.viewMode);

  return (
    <div className={s.body}>
      <div className={s.card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)", alignItems: "center", marginBottom: "var(--s-4)" }}>
          <Segmented
            label="Scan view"
            value={session.viewMode}
            onChange={session.setViewMode}
            options={[
              { value: "FLAP", label: "FLAP · AP view (width)" },
              { value: "KLAT", label: "KLAT · Lateral view (depth)" },
            ]}
          />
        </div>

        <div style={{ display: "flex", gap: "2rem", height: "min(900px, max(720px, calc(100vh - 150px)))" }}>
          <div style={{ flex: "2", order: 2, border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
            {currentScan.isFallback && (
              <div
                role="status"
                style={{ position: "absolute", top: 10, left: 10, maxWidth: "calc(100% - 210px)", zIndex: 100, backgroundColor: "rgba(154,98,18,0.95)", color: "white", padding: "6px 12px", borderRadius: "var(--r-xs)", fontSize: "0.8125rem", fontWeight: 600 }}
              >
                {currentScan.notice}
              </div>
            )}
            <FitChip
              status={fitResult?.fitStatus}
              tone={fitResult?.worstTone}
              lines={
                fitResult
                  ? [
                      `Coverage AP ${fitResult.apCoveragePct.toFixed(0)}% · ML ${fitResult.mlCoveragePct.toFixed(0)}% (aim ≥ 90%)`,
                      fitResult.notchingRiskMm > 0 ? `Gap to front of bone ${fitResult.notchingRiskMm.toFixed(1)} mm (aim ≤ 0.5)` : "Flange flush with the front of the bone",
                    ]
                  : []
              }
            />
            <FemoralCanvas
              viewMode={session.viewMode}
              femoralComponent={femoralComponent}
              onMove={handleMove}
              onRotate={(deg) => handleMove({ rotation_deg: deg })}
              bone={bone}
              markers={session.markers}
              fit={fitResult}
              placing={session.placing}
              onMoveMarker={session.setMarker}
              onPlaceMarker={session.placeMarker}
              onCancelPlace={() => session.setPlacing(null)}
              onDimsLoaded={session.reportDims}
              isReadOnly={isReadOnly}
              src={currentScan.src}
              mmPerPx={currentScan.mmPerPx}
              scale={{
                calibrated: currentScan.calibrated,
                calibrating: session.calibration.calibrating,
                knownMm: session.calibration.knownMm,
                onMeasured: session.calibration.completeCalibration,
                onCancel: session.calibration.cancelCalibrating,
                candidate: session.calibration.detection?.status === "found" ? { view: session.calibration.detection.view, ...session.calibration.detection.candidate } : undefined,
              }}
            />
          </div>

          <div style={{ flex: "1", order: 1, display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0, minHeight: 0 }}>
            <FitMap
              kind="femoral"
              shapes={shapes}
              position={pos}
              orientation={bone.orientation}
              sides={mapSides}
              headline={
                fitResult
                  ? { value: `${fitResult.apCoveragePct.toFixed(0)}% · ${fitResult.mlCoveragePct.toFixed(0)}%`, caption: "AP · ML coverage" }
                  : undefined
              }
              tone={fitResult?.worstTone}
              readOnly={isReadOnly}
              onChange={handleMove}
              onCentre={() => handleMove({ x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0, level_offset_mm: 0 })}
              onBest={bestPosition}
            />
            <FemoralControlsPanel
              femoralComponent={femoralComponent}
              setFemoralComponent={setFemoralComponent}
              fitResult={fitResult}
              ranking={ranking}
              session={session}
              plan={plan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
