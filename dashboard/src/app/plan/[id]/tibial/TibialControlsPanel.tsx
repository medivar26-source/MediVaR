"use client";

import { useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { updatePlanPayload } from "@/app/actions";
import { Button } from "@/components/ui";
import {
  TIBIAL_TEMPLATES,
  getTibialTemplate,
  evaluateTibialFit,
  type TibialFitResult,
} from "@/lib/data/tkr_templates";
import type { PlanDetail, V1TibialComponent } from "@/lib/plan";

interface TibialControlsPanelProps {
  tibialComponent: V1TibialComponent;
  setTibialComponent: React.Dispatch<React.SetStateAction<V1TibialComponent>>;
  fitResult: TibialFitResult;
  plan: PlanDetail;
}

export function TibialControlsPanel({
  tibialComponent,
  setTibialComponent,
  fitResult,
  plan,
}: TibialControlsPanelProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;

  const currentTemplate = getTibialTemplate(tibialComponent.implant_size);

  const handleSizeChange = (newSize: number) => {
    if (isReadOnly) return;
    const template = getTibialTemplate(newSize);
    const fit = evaluateTibialFit(
      newSize,
      tibialComponent.position_2d.x_offset_mm,
      tibialComponent.position_2d.y_offset_mm
    );
    setTibialComponent((prev) => ({
      ...prev,
      implant_size: newSize,
      ap_dimension_mm: template.apMm,
      ml_dimension_mm: template.mlMm,
      cortical_coverage_pct: fit.coveragePct,
      medial_overhang_mm: fit.medialOverhangMm,
      lateral_overhang_mm: fit.lateralOverhangMm,
      fit_status: fit.fitStatus,
      is_confirmed: false,
    }));
  };

  const handleOffsetChange = (
    key: "x_offset_mm" | "y_offset_mm" | "rotation_deg",
    delta: number
  ) => {
    if (isReadOnly) return;
    setTibialComponent((prev) => {
      const newPos = {
        ...prev.position_2d,
        [key]: Number((prev.position_2d[key] + delta).toFixed(1)),
      };
      const fit = evaluateTibialFit(
        prev.implant_size,
        newPos.x_offset_mm,
        newPos.y_offset_mm
      );
      return {
        ...prev,
        position_2d: newPos,
        cortical_coverage_pct: fit.coveragePct,
        medial_overhang_mm: fit.medialOverhangMm,
        lateral_overhang_mm: fit.lateralOverhangMm,
        fit_status: fit.fitStatus,
      };
    });
  };

  const handleConfirmAndSave = async () => {
    if (isReadOnly) return;
    const confirmedComponent: V1TibialComponent = {
      ...tibialComponent,
      is_confirmed: true,
    };
    setTibialComponent(confirmedComponent);

    try {
      await updatePlanPayload(plan.id, {
        v1_tibial: confirmedComponent,
        // Also write legacy compat fields
        tibial_planning: {
          size: confirmedComponent.implant_size,
          x_offset_mm: confirmedComponent.position_2d.x_offset_mm,
          y_offset_mm: confirmedComponent.position_2d.y_offset_mm,
          rotation_deg: confirmedComponent.position_2d.rotation_deg,
        },
      });
    } catch {
      // best-effort local save
    }
  };

  const handleContinue = () => {
    const planId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    startTransition(() => {
      router.push(`/plan/${planId}/femoral`);
    });
  };

  return (
    <div
      style={{
        padding: "1.25rem",
        backgroundColor: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: "700" }}>
          Tibial Component Sizing
        </h3>
        {tibialComponent.is_confirmed && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: "4px",
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              fontSize: "0.75rem",
              fontWeight: 700,
            }}
          >
            CONFIRMED
          </span>
        )}
      </div>

      {/* Sizing Toolbar: Discrete Sizes 1 to 6 */}
      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-muted)" }}>
          IMPLANT SIZE (1 to 6)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "4px" }}>
          {TIBIAL_TEMPLATES.map((t) => {
            const isSelected = tibialComponent.implant_size === t.size;
            return (
              <button
                key={t.size}
                disabled={isReadOnly}
                onClick={() => handleSizeChange(t.size)}
                style={{
                  padding: "0.5rem 0",
                  borderRadius: "4px",
                  border: isSelected ? "2px solid #0284c7" : "1px solid var(--border)",
                  background: isSelected ? "#e0f2fe" : "var(--surface)",
                  color: isSelected ? "#0369a1" : "inherit",
                  fontWeight: isSelected ? "700" : "500",
                  cursor: isReadOnly ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  transition: "all 0.15s",
                }}
              >
                {t.size}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <span>AP: {currentTemplate.apMm.toFixed(1)} mm</span>
          <span>ML: {currentTemplate.mlMm.toFixed(1)} mm</span>
          <span style={{ color: "#0284c7", fontWeight: 600 }}>Size 3 Suggested</span>
        </div>
      </div>

      {/* 2D Position & Rotation Adjustment */}
      <div style={{ padding: "0.75rem", border: "1px solid var(--border)", borderRadius: "6px", background: "rgba(0,0,0,0.015)" }}>
        <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
          2D CAD Position & Alignment
        </h4>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {/* X Offset */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem" }}>Medial / Lateral (X)</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                disabled={isReadOnly}
                onClick={() => handleOffsetChange("x_offset_mm", -0.2)}
                style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid var(--border)", cursor: isReadOnly ? "not-allowed" : "pointer" }}
              >
                -
              </button>
              <span style={{ width: "50px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                {tibialComponent.position_2d.x_offset_mm.toFixed(1)} mm
              </span>
              <button
                disabled={isReadOnly}
                onClick={() => handleOffsetChange("x_offset_mm", 0.2)}
                style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid var(--border)", cursor: isReadOnly ? "not-allowed" : "pointer" }}
              >
                +
              </button>
            </div>
          </div>

          {/* Y Offset */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem" }}>Anterior / Posterior (Y)</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                disabled={isReadOnly}
                onClick={() => handleOffsetChange("y_offset_mm", -0.2)}
                style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid var(--border)", cursor: isReadOnly ? "not-allowed" : "pointer" }}
              >
                -
              </button>
              <span style={{ width: "50px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                {tibialComponent.position_2d.y_offset_mm.toFixed(1)} mm
              </span>
              <button
                disabled={isReadOnly}
                onClick={() => handleOffsetChange("y_offset_mm", 0.2)}
                style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid var(--border)", cursor: isReadOnly ? "not-allowed" : "pointer" }}
              >
                +
              </button>
            </div>
          </div>

          {/* Rotation */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem" }}>Axial Rotation</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                disabled={isReadOnly}
                onClick={() => handleOffsetChange("rotation_deg", -0.5)}
                style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid var(--border)", cursor: isReadOnly ? "not-allowed" : "pointer" }}
              >
                -
              </button>
              <span style={{ width: "50px", textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                {tibialComponent.position_2d.rotation_deg.toFixed(1)}°
              </span>
              <button
                disabled={isReadOnly}
                onClick={() => handleOffsetChange("rotation_deg", 0.5)}
                style={{ width: "26px", height: "26px", borderRadius: "4px", border: "1px solid var(--border)", cursor: isReadOnly ? "not-allowed" : "pointer" }}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Fit Metrics (V1 Clinical Tolerances) */}
      <div>
        <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.8125rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
          Fit & Sizing Evaluation
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Cortical Coverage */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Cortical Coverage (Target ≥ 90%)</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: fitResult.coveragePct >= 90.0 ? "#10b981" : fitResult.coveragePct >= 85.0 ? "#f59e0b" : "#ef4444",
              }}
            >
              {fitResult.coveragePct.toFixed(1)}%
            </span>
          </div>

          {/* Medial Overhang */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Medial Overhang (Target ≤ 1.0 mm)</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: fitResult.medialOverhangMm <= 1.0 ? "#10b981" : fitResult.medialOverhangMm <= 1.5 ? "#f59e0b" : "#ef4444",
              }}
            >
              {fitResult.medialOverhangMm.toFixed(1)} mm
            </span>
          </div>

          {/* Lateral Overhang */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Lateral Overhang (Target ≤ 1.0 mm)</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: fitResult.lateralOverhangMm <= 1.0 ? "#10b981" : fitResult.lateralOverhangMm <= 1.5 ? "#f59e0b" : "#ef4444",
              }}
            >
              {fitResult.lateralOverhangMm.toFixed(1)} mm
            </span>
          </div>

          {/* Status Verdict */}
          <div style={{ marginTop: "0.5rem", padding: "0.5rem", borderRadius: "4px", background: fitResult.fitStatus === "ACCEPTABLE FIT" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", textAlign: "center" }}>
            <strong style={{ fontSize: "0.8125rem", color: fitResult.fitStatus === "ACCEPTABLE FIT" ? "#10b981" : "#ef4444" }}>
              {fitResult.fitStatus}
            </strong>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem", paddingTop: "1rem" }}>
        {!isReadOnly && (
          <Button
            variant="secondary"
            onClick={handleConfirmAndSave}
            style={{ width: "100%", justifyContent: "center", fontWeight: 600 }}
          >
            {tibialComponent.is_confirmed ? "Update Tibial Confirmation" : "Confirm Tibial Component"}
          </Button>
        )}

        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={isPending || (!tibialComponent.is_confirmed && !isReadOnly)}
          style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
        >
          {isPending ? "Loading..." : "Continue to Femoral Planning →"}
        </Button>
      </div>
    </div>
  );
}
