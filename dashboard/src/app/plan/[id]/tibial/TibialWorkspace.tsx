"use client";

import { useState } from "react";
import type { PlanDetail, V1TibialComponent } from "@/lib/plan";
import { getTibialTemplate, evaluateTibialFit } from "@/lib/data/tkr_templates";
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

  const initialComponent: V1TibialComponent = (() => {
    if (isReadOnly && plan.lockedVersion?.payload.v1_tibial) {
      return { ...plan.lockedVersion.payload.v1_tibial, is_confirmed: true };
    }
    if (plan.payload.v1_tibial) {
      return { ...plan.payload.v1_tibial, is_confirmed: isReadOnly ? true : plan.payload.v1_tibial.is_confirmed };
    }
    const template = getTibialTemplate(DEFAULT_TIBIAL_COMPONENT.implant_size);
    const fit = evaluateTibialFit(
      DEFAULT_TIBIAL_COMPONENT.implant_size,
      DEFAULT_TIBIAL_COMPONENT.position_2d.x_offset_mm,
      DEFAULT_TIBIAL_COMPONENT.position_2d.y_offset_mm
    );
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

  const fitResult = evaluateTibialFit(
    tibialComponent.implant_size,
    tibialComponent.position_2d.x_offset_mm,
    tibialComponent.position_2d.y_offset_mm
  );

  const rawLandmarks = (plan.payload?.assessment_landmarks as Record<string, any>) || {};
  const assessmentLandmarks = {
    ...rawLandmarks,
    hipCenter: rawLandmarks.hipCenter || rawLandmarks.femoral_head_center,
    kneeCenter: rawLandmarks.kneeCenter || rawLandmarks.femoral_knee_center || rawLandmarks.tibial_knee_center,
    ankleCenter: rawLandmarks.ankleCenter || rawLandmarks.ankle_center,
  };

  const imageMatch = plan.case?.imaging?.find(
    (img) => img.view.toLowerCase() === viewMode.toLowerCase()
  );
  const currentImgSrc = imageMatch?.src || (viewMode === "FLAP" ? "/flap.jpg" : "/klat.jpg");

  const handlePositionChange = (newPos: { x_offset_mm: number; y_offset_mm: number; rotation_deg: number }) => {
    if (isReadOnly) return;
    const fit = evaluateTibialFit(tibialComponent.implant_size, newPos.x_offset_mm, newPos.y_offset_mm);
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
              background: viewMode === "FLAP" ? "var(--accent)" : "var(--surface)",
              color: viewMode === "FLAP" ? "white" : "inherit",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            FLAP View (Full-Length AP)
          </button>
          <button
            onClick={() => setViewMode("KLAT")}
            style={{
              padding: "0.5rem 1rem",
              background: viewMode === "KLAT" ? "var(--accent)" : "var(--surface)",
              color: viewMode === "KLAT" ? "white" : "inherit",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            KLAT View (Localized Knee)
          </button>
        </div>

        <div style={{ display: "flex", gap: "2rem", height: "700px" }}>
          {/* Main Imaging/Planning Workspace */}
          <div style={{ flex: "2", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
            <TibialCanvas
              viewMode={viewMode}
              tibialComponent={tibialComponent}
              onPositionChange={handlePositionChange}
              assessmentLandmarks={assessmentLandmarks}
              isReadOnly={isReadOnly}
              src={currentImgSrc}
            />
          </div>

          {/* Controls Panel */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <TibialControlsPanel
              tibialComponent={tibialComponent}
              setTibialComponent={setTibialComponent}
              fitResult={fitResult}
              plan={plan}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
