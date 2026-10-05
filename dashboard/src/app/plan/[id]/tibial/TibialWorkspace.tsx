"use client";

import { useState } from "react";
import { fallbackNotice, resolveScan } from "@/lib/plan-scans";
import type { PlanDetail, V1TibialComponent } from "@/lib/plan";
import { getTibialTemplate, evaluateTibialFit } from "@/lib/data/tkr_templates";
import { normalizeCalibration } from "@/lib/data/coordinates";
import s from "../plan.module.css";
import { TibialCanvas } from "./TibialCanvas";
import { TibialControlsPanel } from "./TibialControlsPanel";

export type TibialViewMode = "FLAP" | "KLAT";

const DEFAULT_TIBIAL_COMPONENT: V1TibialComponent = {
  implant_size: 3,
  position_2d: {
    x_offset_mm: 1.2,
    y_offset_mm: -0.4,
    rotation_deg: 0.5,
  },
  ap_dimension_mm: 42.5,
  ml_dimension_mm: 68.2,
  cortical_coverage_pct: 91.5,
  medial_overhang_mm: 0.4,
  lateral_overhang_mm: 0.6,
  fit_status: "ACCEPTABLE FIT",
  is_confirmed: false,
};

export function TibialWorkspace({ plan }: { plan: PlanDetail }) {
  const [viewMode, setViewMode] = useState<TibialViewMode>("FLAP");

  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;

  const patientBone = (() => {
    const tp = plan.payload?.tibial_planning as Record<string, any> | undefined;
    if (tp?.patient_ml_mm && tp?.patient_ap_mm) {
      return { mlMm: Number(tp.patient_ml_mm), apMm: Number(tp.patient_ap_mm) };
    }
    const v1Ass = plan.payload?.v1_assessment as Record<string, any> | undefined;
    if (v1Ass?.patient_tibial_ml_mm && v1Ass?.patient_tibial_ap_mm) {
      return { mlMm: Number(v1Ass.patient_tibial_ml_mm), apMm: Number(v1Ass.patient_tibial_ap_mm) };
    }
    return undefined;
  })();

  const initialComponent: V1TibialComponent = (() => {
    if (isReadOnly && plan.lockedVersion?.payload.v1_tibial) {
      return { ...plan.lockedVersion.payload.v1_tibial, is_confirmed: true };
    }
    if (plan.payload.v1_tibial) {
      return { ...plan.payload.v1_tibial, is_confirmed: isReadOnly ? true : plan.payload.v1_tibial.is_confirmed };
    }
    const template = getTibialTemplate(DEFAULT_TIBIAL_COMPONENT.implant_size);
    const fit = patientBone ? evaluateTibialFit(
      DEFAULT_TIBIAL_COMPONENT.implant_size,
      DEFAULT_TIBIAL_COMPONENT.position_2d.x_offset_mm,
      DEFAULT_TIBIAL_COMPONENT.position_2d.y_offset_mm,
      patientBone.apMm,
      patientBone.mlMm,
      DEFAULT_TIBIAL_COMPONENT.position_2d.rotation_deg
    ) : { coveragePct: 0, medialOverhangMm: 0, lateralOverhangMm: 0, fitStatus: "incomplete" as any };
    return {
      ...DEFAULT_TIBIAL_COMPONENT,
      ap_dimension_mm: template.apMm,
      ml_dimension_mm: template.mlMm,
      cortical_coverage_pct: fit.coveragePct,
      medial_overhang_mm: fit.medialOverhangMm,
      lateral_overhang_mm: fit.lateralOverhangMm,
      fit_status: fit.fitStatus,
      is_confirmed: isReadOnly,
    };
  })();

  const [tibialComponent, setTibialComponent] = useState<V1TibialComponent>(initialComponent);

  const fitResult = patientBone ? evaluateTibialFit(
    tibialComponent.implant_size,
    tibialComponent.position_2d.x_offset_mm,
    tibialComponent.position_2d.y_offset_mm,
    patientBone.apMm,
    patientBone.mlMm,
    tibialComponent.position_2d.rotation_deg
  ) : { coveragePct: 0, medialOverhangMm: 0, lateralOverhangMm: 0, fitStatus: "incomplete" as any };

  const rawLandmarks = (plan.payload?.assessment_landmarks as Record<string, any>) || {};
  const assessmentLandmarks = {
    ...rawLandmarks,
    hipCenter: rawLandmarks.hipCenter || rawLandmarks.femoral_head_center,
    kneeCenter: rawLandmarks.kneeCenter || rawLandmarks.femoral_knee_center || rawLandmarks.tibial_knee_center,
    ankleCenter: rawLandmarks.ankleCenter || rawLandmarks.ankle_center,
  };

  const apImage =
    plan.case?.imaging?.find((img) => img.view.toLowerCase() === "ap") ||
    plan.case?.imaging?.find((img) => img.view.toLowerCase() === "flap") ||
    plan.case?.imaging?.find((img) => img.view.toLowerCase() === "long_leg");

  const klatImage =
    plan.case?.imaging?.find((img) => img.view.toLowerCase() === "klat") ||
    plan.case?.imaging?.find((img) => img.view.toLowerCase() === "lateral");

  const imageMatch = viewMode === "FLAP" ? apImage : klatImage;
  const scan = resolveScan(imageMatch, viewMode);
  const currentImgSrc = scan.src;
  const activeCalibration = normalizeCalibration(
    imageMatch?.calibration || plan.payload.calibration,
    `${viewMode} ${currentImgSrc}`
  );

  const handlePositionChange = (newPos: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number }) => {
    if (isReadOnly) return;
    
    const fit = patientBone ? evaluateTibialFit(
      tibialComponent.implant_size,
      newPos.x_offset_mm,
      newPos.y_offset_mm,
      patientBone.apMm,
      patientBone.mlMm,
      newPos.rotation_deg
    ) : { coveragePct: 0, medialOverhangMm: 0, lateralOverhangMm: 0, fitStatus: "incomplete" as any };

    setTibialComponent((prev) => ({
      ...prev,
      position_2d: newPos,
      cortical_coverage_pct: fit.coveragePct,
      medial_overhang_mm: fit.medialOverhangMm,
      lateral_overhang_mm: fit.lateralOverhangMm,
      fit_status: fit.fitStatus,
    }));
  };

  return (
    <div className={s.body}>
      <div className={s.card}>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <button
            onClick={() => setViewMode("FLAP")}
            style={{
              padding: "0.5rem 1rem",
              background: viewMode === "FLAP" ? "var(--brand)" : "var(--surface)",
              color: viewMode === "FLAP" ? "var(--on-brand)" : "var(--ink)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            AP View (Coronal Sizing)
          </button>
          <button
            onClick={() => setViewMode("KLAT")}
            style={{
              padding: "0.5rem 1rem",
              background: viewMode === "KLAT" ? "var(--brand)" : "var(--surface)",
              color: viewMode === "KLAT" ? "var(--on-brand)" : "var(--ink)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            KLAT View (Localized Lateral)
          </button>
        </div>

        <div style={{ display: "flex", gap: "2rem", height: "700px" }}>
          {/* Main Imaging/Planning Workspace */}
          <div style={{ flex: "2", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
            {scan.isFallback && (
              <div
                role="status"
                style={{ position: "absolute", top: 10, right: 10, zIndex: 100, backgroundColor: "rgba(154,98,18,0.95)", color: "white", padding: "6px 12px", borderRadius: "4px", fontSize: "0.8125rem", fontWeight: 600, maxWidth: "60%" }}
              >
                {fallbackNotice(viewMode)}
              </div>
            )}
            <TibialCanvas
              viewMode={viewMode}
              tibialComponent={tibialComponent}
              onPositionChange={handlePositionChange}
              assessmentLandmarks={assessmentLandmarks}
              isReadOnly={isReadOnly}
              src={currentImgSrc}
              calibration={activeCalibration}
              patientBone={patientBone}
            />
          </div>

          {/* Controls Panel */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <TibialControlsPanel
              tibialComponent={tibialComponent}
              setTibialComponent={setTibialComponent}
              fitResult={fitResult}
              plan={plan}
              patientBone={patientBone}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
