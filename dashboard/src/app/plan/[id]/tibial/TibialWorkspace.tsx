"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui";
import type { PlanDetail, V1TibialComponent } from "@/lib/plan";
import { evaluateTibialFit, getTibialTemplate } from "@/lib/data/tkr_templates";
import { autoFitTibial, clearanceText, rankTibialSizes, seedMarkers, sideGaps, type MarkerKey } from "@/lib/data/fit_markers";
import { mapShapes, type MapPosition } from "@/lib/data/fit_map";
import { resolvePlanScales, sameScale } from "@/lib/data/scan_scale";
import { useFitSession } from "../components/useFitSession";
import { FitMap, type MapSide } from "../components/FitMap";
import { FitChip } from "../components/FitPanels";
import s from "../plan.module.css";
import { TibialCanvas } from "./TibialCanvas";
import { TibialControlsPanel } from "./TibialControlsPanel";

export type TibialViewMode = "FLAP" | "KLAT";

const DEFAULT_TIBIAL_COMPONENT: V1TibialComponent = {
  implant_size: 3,
  position_2d: { x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0 },
  is_confirmed: false,
};

export function TibialWorkspace({ plan }: { plan: PlanDetail }) {
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;

  const [tibialComponent, setTibialComponent] = useState<V1TibialComponent>(() => {
    const saved =
      isReadOnly && plan.lockedVersion?.payload.v1_tibial
        ? { ...plan.lockedVersion.payload.v1_tibial, is_confirmed: true }
        : plan.payload.v1_tibial
          ? { ...plan.payload.v1_tibial, is_confirmed: isReadOnly ? true : plan.payload.v1_tibial.is_confirmed }
          : { ...DEFAULT_TIBIAL_COMPONENT };

    // Plans saved before bone-edge markers existed start from a guess taken from the assessment.
    const markers = saved.fit_markers ?? seedMarkers("tibial", plan.payload);
    const template = getTibialTemplate(saved.implant_size);
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

  const session = useFitSession<V1TibialComponent>({
    kind: "tibial",
    plan,
    component: tibialComponent,
    setComponent: setTibialComponent,
    isReadOnly,
  });
  const { bone } = session;

  const pos = tibialComponent.position_2d;
  const fitResult = useMemo(
    () =>
      bone.complete
        ? evaluateTibialFit(
            tibialComponent.implant_size,
            pos.x_offset_mm,
            pos.y_offset_mm,
            bone.apMm!,
            bone.mlMm!,
            pos.rotation_deg,
            undefined,
            undefined,
            bone.orientation,
          )
        : undefined,
    [bone, tibialComponent.implant_size, pos.x_offset_mm, pos.y_offset_mm, pos.rotation_deg],
  );

  const ranking = useMemo(() => rankTibialSizes(bone, pos.rotation_deg), [bone, pos.rotation_deg]);

  // Any move, from the scan, the map or the keys, goes through here and asks for a new confirmation.
  const handleMove = (next: Partial<MapPosition> & { level_offset_mm?: number }) => {
    if (isReadOnly) return;
    const { level_offset_mm, ...position } = next;
    setTibialComponent((prev) => ({
      ...prev,
      position_2d: { ...prev.position_2d, ...position },
      ...(level_offset_mm !== undefined ? { level_offset_mm } : {}),
      is_confirmed: false,
    }));
  };

  const shapes = useMemo(
    () => mapShapes("tibial", tibialComponent.implant_size, bone, pos),
    [bone, tibialComponent.implant_size, pos],
  );

  const gaps = fitResult ? sideGaps(fitResult.extents, bone) : undefined;
  const mapSides: Record<MarkerKey, MapSide> | undefined =
    fitResult && gaps
      ? {
          medial: { text: clearanceText(fitResult.medialOverhangMm, gaps.medial), tone: fitResult.medialTone },
          lateral: { text: clearanceText(fitResult.lateralOverhangMm, gaps.lateral), tone: fitResult.lateralTone },
          anterior: { text: clearanceText(fitResult.anteriorOverhangMm, gaps.anterior), tone: fitResult.anteriorTone },
          posterior: { text: clearanceText(fitResult.posteriorOverhangMm, gaps.posterior), tone: fitResult.posteriorTone },
        }
      : undefined;

  const bestPosition = () => {
    const best = autoFitTibial(tibialComponent.implant_size, bone, pos.rotation_deg);
    handleMove({ x_offset_mm: best.x, y_offset_mm: best.y });
  };

  const maxOverhang = fitResult
    ? Math.max(fitResult.medialOverhangMm, fitResult.lateralOverhangMm, fitResult.anteriorOverhangMm, fitResult.posteriorOverhangMm)
    : 0;

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
                      `Coverage ${fitResult.coveragePct.toFixed(0)}% (aim ≥ 90%)`,
                      maxOverhang > 0 ? `Largest overhang ${maxOverhang.toFixed(1)} mm (aim ≤ 1.0)` : "No overhang",
                      ...fitResult.cautionTags,
                    ]
                  : []
              }
            />
            <TibialCanvas
              viewMode={session.viewMode}
              tibialComponent={tibialComponent}
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
              kind="tibial"
              shapes={shapes}
              position={pos}
              orientation={bone.orientation}
              sides={mapSides}
              headline={fitResult ? { value: `${fitResult.coveragePct.toFixed(0)}%`, caption: "of the bone covered" } : undefined}
              tone={fitResult?.worstTone}
              readOnly={isReadOnly}
              onChange={handleMove}
              onCentre={() => handleMove({ x_offset_mm: 0, y_offset_mm: 0, rotation_deg: 0, level_offset_mm: 0 })}
              onBest={bestPosition}
            />
            <TibialControlsPanel
              tibialComponent={tibialComponent}
              setTibialComponent={setTibialComponent}
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
