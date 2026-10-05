"use client";

import { useState } from "react";
import { fallbackNotice, resolveScan } from "@/lib/plan-scans";
import type { PlanDetail, V1FemoralComponent } from "@/lib/plan";
import { getFemoralTemplate, evaluateFemoralFit } from "@/lib/data/tkr_templates";
import { normalizeCalibration } from "@/lib/data/coordinates";
import s from "../plan.module.css";
import { FemoralCanvas } from "./FemoralCanvas";
import { FemoralControlsPanel } from "./FemoralControlsPanel";

export type FemoralViewMode = "FLAP" | "KLAT";

const DEFAULT_FEMORAL_COMPONENT: V1FemoralComponent = {
  implant_size: 4,
  position_2d: {
    x_offset_mm: 0.5,
    y_offset_mm: 0.0,
    rotation_deg: 0.0,
  },
  ap_dimension_mm: 58.4,
  ml_dimension_mm: 64.1,
  ap_coverage_pct: 94.2,
  ml_coverage_pct: 92.8,
  notching_risk_mm: 0.0,
  fit_status: "ACCEPTABLE FIT",
  is_confirmed: false,
};

export function FemoralWorkspace({ plan }: { plan: PlanDetail }) {
  const [viewMode, setViewMode] = useState<FemoralViewMode>("FLAP");

  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;

  const patientBone = (() => {
    const v1Ass = plan.payload?.v1_assessment as Record<string, any>;
    if (v1Ass?.patient_femoral_ml_mm && v1Ass?.patient_femoral_ap_mm) {
      return {
        mlMm: Number(v1Ass.patient_femoral_ml_mm),
        apMm: Number(v1Ass.patient_femoral_ap_mm)
      };
    }
    return undefined;
  })();

  const initialComponent: V1FemoralComponent = (() => {
    if (isReadOnly && plan.lockedVersion?.payload.v1_femoral) {
      return { ...plan.lockedVersion.payload.v1_femoral, is_confirmed: true };
    }
    if (plan.payload.v1_femoral) {
      return { ...plan.payload.v1_femoral, is_confirmed: isReadOnly ? true : plan.payload.v1_femoral.is_confirmed };
    }
    const template = getFemoralTemplate(DEFAULT_FEMORAL_COMPONENT.implant_size);
    const fit = patientBone ? evaluateFemoralFit(
      DEFAULT_FEMORAL_COMPONENT.implant_size,
      DEFAULT_FEMORAL_COMPONENT.position_2d.x_offset_mm,
      DEFAULT_FEMORAL_COMPONENT.position_2d.y_offset_mm,
      patientBone.apMm,
      patientBone.mlMm,
      DEFAULT_FEMORAL_COMPONENT.position_2d.rotation_deg
    ) : { apCoveragePct: 0, mlCoveragePct: 0, notchingRiskMm: 0, fitStatus: "incomplete" as any };
    return {
      ...DEFAULT_FEMORAL_COMPONENT,
      ap_dimension_mm: template.apMm,
      ml_dimension_mm: template.mlMm,
      ap_coverage_pct: fit.apCoveragePct,
      ml_coverage_pct: fit.mlCoveragePct,
      notching_risk_mm: fit.notchingRiskMm,
      fit_status: fit.fitStatus,
      is_confirmed: isReadOnly,
    };
  })();

  const [femoralComponent, setFemoralComponent] = useState<V1FemoralComponent>(initialComponent);

  const fitResult = patientBone ? evaluateFemoralFit(
    femoralComponent.implant_size,
    femoralComponent.position_2d.x_offset_mm,
    femoralComponent.position_2d.y_offset_mm,
    patientBone.apMm,
    patientBone.mlMm,
    femoralComponent.position_2d.rotation_deg
  ) : { apCoveragePct: 0, mlCoveragePct: 0, notchingRiskMm: 0, fitStatus: "incomplete" as any };

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
    
    const fit = patientBone ? evaluateFemoralFit(
      femoralComponent.implant_size, 
      newPos.x_offset_mm, 
      newPos.y_offset_mm, 
      patientBone.apMm, 
      patientBone.mlMm,
      newPos.rotation_deg
    ) : { apCoveragePct: 0, mlCoveragePct: 0, notchingRiskMm: 0, fitStatus: "incomplete" as any };

    setFemoralComponent((prev) => ({
      ...prev,
      position_2d: newPos,
      ap_coverage_pct: fit.apCoveragePct,
      ml_coverage_pct: fit.mlCoveragePct,
      notching_risk_mm: fit.notchingRiskMm,
      fit_status: fit.fitStatus,
      // Moving the implant invalidates an earlier confirmation.
      is_confirmed: false,
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
            <FemoralCanvas
              viewMode={viewMode}
              femoralComponent={femoralComponent}
              onPositionChange={handlePositionChange}
              assessmentLandmarks={assessmentLandmarks}
              patientBone={patientBone}
              isReadOnly={isReadOnly}
              src={currentImgSrc}
              calibration={activeCalibration}
            />
          </div>

          {/* Controls Panel */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <FemoralControlsPanel
              femoralComponent={femoralComponent}
              setFemoralComponent={setFemoralComponent}
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
