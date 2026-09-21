"use client";

import { useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { updatePlanPayload } from "@/app/actions";
import { Button } from "@/components/ui";
import {
  FEMORAL_TEMPLATES,
  getFemoralTemplate,
  evaluateFemoralFit,
  type FemoralFitResult,
} from "@/lib/data/tkr_templates";
import type { PlanDetail, V1FemoralComponent } from "@/lib/plan";

interface FemoralControlsPanelProps {
  femoralComponent: V1FemoralComponent;
  setFemoralComponent: React.Dispatch<React.SetStateAction<V1FemoralComponent>>;
  fitResult: FemoralFitResult;
  plan: PlanDetail;
}

export function FemoralControlsPanel({
  femoralComponent,
  setFemoralComponent,
  fitResult,
  plan,
}: FemoralControlsPanelProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;

  const currentTemplate = getFemoralTemplate(femoralComponent.implant_size);

  const handleSizeChange = (newSize: number) => {
    if (isReadOnly) return;
    const template = getFemoralTemplate(newSize);
    const fit = evaluateFemoralFit(
      newSize,
      femoralComponent.position_2d.x_offset_mm,
      femoralComponent.position_2d.y_offset_mm
    );
    setFemoralComponent((prev) => ({
      ...prev,
      implant_size: newSize,
      ap_dimension_mm: template.apMm,
      ml_dimension_mm: template.mlMm,
      ap_coverage_pct: fit.apCoveragePct,
      ml_coverage_pct: fit.mlCoveragePct,
      notching_risk_mm: fit.notchingRiskMm,
      fit_status: fit.fitStatus,
      is_confirmed: false,
    }));
  };

  const handleOffsetChange = (
    key: "x_offset_mm" | "y_offset_mm" | "rotation_deg",
    delta: number
  ) => {
    if (isReadOnly) return;
    setFemoralComponent((prev) => {
      const newPos = {
        ...prev.position_2d,
        [key]: Number((prev.position_2d[key] + delta).toFixed(1)),
      };
      const fit = evaluateFemoralFit(
        prev.implant_size,
        newPos.x_offset_mm,
        newPos.y_offset_mm
      );
      return {
        ...prev,
        position_2d: newPos,
        ap_coverage_pct: fit.apCoveragePct,
        ml_coverage_pct: fit.mlCoveragePct,
        notching_risk_mm: fit.notchingRiskMm,
        fit_status: fit.fitStatus,
      };
    });
  };

  const handleConfirmAndSave = async () => {
    if (isReadOnly) return;
    const confirmedComponent: V1FemoralComponent = {
      ...femoralComponent,
      is_confirmed: true,
    };
    setFemoralComponent(confirmedComponent);

    try {
      await updatePlanPayload(plan.id, {
        v1_femoral: confirmedComponent,
        // Legacy compat fields
        femoral_planning: {
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
      router.push(`/plan/${planId}/review`);
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
          Femoral Component Sizing
        </h3>
        {femoralComponent.is_confirmed && (
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

      {/* Sizing Toolbar: Discrete Sizes 1 to 8 */}
      <div>
        <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "600", marginBottom: "0.5rem", color: "var(--text-muted)" }}>
          IMPLANT SIZE (1 to 8)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
          {FEMORAL_TEMPLATES.map((t) => {
            const isSelected = femoralComponent.implant_size === t.size;
            return (
              <button
                key={t.size}
                disabled={isReadOnly}
                onClick={() => handleSizeChange(t.size)}
                style={{
                  padding: "0.45rem 0",
                  borderRadius: "4px",
                  border: isSelected ? "2px solid #0284c7" : "1px solid var(--border)",
                  background: isSelected ? "#e0f2fe" : "var(--surface)",
                  color: isSelected ? "#0369a1" : "inherit",
                  fontWeight: isSelected ? "700" : "500",
                  cursor: isReadOnly ? "not-allowed" : "pointer",
                  fontSize: "0.8125rem",
                  transition: "all 0.15s",
                }}
              >
                Size {t.size}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          <span>AP: {currentTemplate.apMm.toFixed(1)} mm</span>
          <span>ML: {currentTemplate.mlMm.toFixed(1)} mm</span>
          <span style={{ color: "#0284c7", fontWeight: 600 }}>Size 4 Suggested</span>
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
                {femoralComponent.position_2d.x_offset_mm.toFixed(1)} mm
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
                {femoralComponent.position_2d.y_offset_mm.toFixed(1)} mm
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
                {femoralComponent.position_2d.rotation_deg.toFixed(1)}°
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
          {/* AP Coverage */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>AP Coverage</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: fitResult.apCoveragePct >= 90.0 ? "#10b981" : "#f59e0b",
              }}
            >
              {fitResult.apCoveragePct.toFixed(1)}%
            </span>
          </div>

          {/* ML Coverage */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>ML Coverage</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: fitResult.mlCoveragePct >= 90.0 ? "#10b981" : "#f59e0b",
              }}
            >
              {fitResult.mlCoveragePct.toFixed(1)}%
            </span>
          </div>

          {/* Anterior Notching Risk */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Anterior Notching Risk (KLAT)</span>
            <span
              style={{
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: fitResult.notchingRiskMm === 0.0 ? "#10b981" : "#ef4444",
              }}
            >
              {fitResult.notchingRiskMm === 0.0 ? "0.0 mm (Flush)" : `${fitResult.notchingRiskMm.toFixed(1)} mm`}
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
            {femoralComponent.is_confirmed ? "Update Femoral Confirmation" : "Confirm Femoral Component"}
          </Button>
        )}

        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={isPending || (!femoralComponent.is_confirmed && !isReadOnly)}
          style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
        >
          {isPending ? "Loading..." : "Continue to Review →"}
        </Button>
      </div>
    </div>
  );
}
