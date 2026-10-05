"use client";

import { useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui";
import {
  FEMORAL_TEMPLATES,
  getFemoralTemplate,
  evaluateFemoralFit,
  suggestFemoralSize,
  type FemoralFitResult,
} from "@/lib/data/tkr_templates";
import type { PlanDetail, V1FemoralComponent } from "@/lib/plan";
import { FitGauge, FitVerdict, KeyboardHint, NudgeRow, SaveBadge, type Tone } from "../components/PlanControls";
import { useNudgeKeys, useSaveStatus } from "../components/planHooks";
import c from "../components/planControls.module.css";

interface FemoralControlsPanelProps {
  femoralComponent: V1FemoralComponent;
  setFemoralComponent: React.Dispatch<React.SetStateAction<V1FemoralComponent>>;
  fitResult: FemoralFitResult;
  plan: PlanDetail;
  patientBone?: { mlMm: number; apMm: number };
}

type Axis = "x_offset_mm" | "y_offset_mm" | "rotation_deg";

const NOT_MEASURED = { apCoveragePct: 0, mlCoveragePct: 0, notchingRiskMm: 0, fitStatus: "incomplete" as never };

const coverageTone = (v: number): Tone => (v >= 90 ? "pass" : v >= 85 ? "warn" : "fail");
const notchTone = (v: number): Tone => (v <= 0.5 ? "pass" : "fail");

const COVERAGE_ZONES = [
  { from: 60, to: 85, tone: "fail" },
  { from: 85, to: 90, tone: "warn" },
  { from: 90, to: 100, tone: "pass" },
] as const;

const NOTCH_ZONES = [
  { from: 0, to: 0.5, tone: "pass" },
  { from: 0.5, to: 2, tone: "fail" },
] as const;

export function FemoralControlsPanel({
  femoralComponent,
  setFemoralComponent,
  fitResult,
  plan,
  patientBone,
}: FemoralControlsPanelProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;

  const currentTemplate = getFemoralTemplate(femoralComponent.implant_size);
  const suggestedSize = patientBone ? suggestFemoralSize(patientBone.apMm) : undefined;
  const measured = Boolean(patientBone);

  const { status, save, retry } = useSaveStatus<V1FemoralComponent>(
    plan.id,
    femoralComponent,
    plan.lockedVersion?.payload.v1_femoral ?? plan.payload.v1_femoral ?? null,
    isReadOnly,
  );

  // Same inputs as the workspace uses for the displayed fit — measured bone and rotation — so
  // what is stored on the component always matches what the surgeon is looking at.
  const evaluate = (size: number, pos: V1FemoralComponent["position_2d"]) =>
    patientBone
      ? evaluateFemoralFit(size, pos.x_offset_mm, pos.y_offset_mm, patientBone.apMm, patientBone.mlMm, pos.rotation_deg)
      : NOT_MEASURED;

  const handleSizeChange = (newSize: number) => {
    if (isReadOnly) return;
    const template = getFemoralTemplate(newSize);
    setFemoralComponent((prev) => {
      const fit = evaluate(newSize, prev.position_2d);
      return {
        ...prev,
        implant_size: newSize,
        ap_dimension_mm: template.apMm,
        ml_dimension_mm: template.mlMm,
        ap_coverage_pct: fit.apCoveragePct,
        ml_coverage_pct: fit.mlCoveragePct,
        notching_risk_mm: fit.notchingRiskMm,
        fit_status: fit.fitStatus,
        is_confirmed: false,
      };
    });
  };

  const handleOffsetChange = (key: Axis, delta: number) => {
    if (isReadOnly) return;
    setFemoralComponent((prev) => {
      const newPos = {
        ...prev.position_2d,
        [key]: Number((prev.position_2d[key] + delta).toFixed(1)),
      };
      const fit = evaluate(prev.implant_size, newPos);
      return {
        ...prev,
        position_2d: newPos,
        ap_coverage_pct: fit.apCoveragePct,
        ml_coverage_pct: fit.mlCoveragePct,
        notching_risk_mm: fit.notchingRiskMm,
        fit_status: fit.fitStatus,
        // Any move invalidates an earlier confirmation.
        is_confirmed: false,
      };
    });
  };

  useNudgeKeys(!isReadOnly, handleOffsetChange);

  const handleConfirmAndSave = async () => {
    if (isReadOnly) return;
    const confirmedComponent: V1FemoralComponent = { ...femoralComponent, is_confirmed: true };
    setFemoralComponent(confirmedComponent);

    const ok = await save(
      {
        v1_femoral: confirmedComponent,
        // Legacy compat fields
        femoral_planning: {
          size: confirmedComponent.implant_size,
          x_offset_mm: confirmedComponent.position_2d.x_offset_mm,
          y_offset_mm: confirmedComponent.position_2d.y_offset_mm,
          rotation_deg: confirmedComponent.position_2d.rotation_deg,
        },
      },
      confirmedComponent,
    );
    // A confirmation the server never accepted must not unlock the next step.
    if (!ok) setFemoralComponent((prev) => ({ ...prev, is_confirmed: false }));
  };

  const handleContinue = () => {
    const planId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    startTransition(() => {
      router.push(`/plan/${planId}/review`);
    });
  };

  const pos = femoralComponent.position_2d;

  return (
    <div
      style={{
        padding: "var(--s-5)",
        backgroundColor: "var(--surface)",
        border: "var(--bw) solid var(--border)",
        borderRadius: "var(--r-md)",
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-5)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "var(--t-h3)", fontWeight: 700, color: "var(--ink)" }}>Femoral Component Sizing</h3>
        <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
          {femoralComponent.is_confirmed && <span className={c.confirmed}>CONFIRMED</span>}
          <SaveBadge status={status} onRetry={retry} />
        </div>
      </div>

      {/* Sizing Toolbar: Discrete Sizes 1 to 8 */}
      <div>
        <label style={{ display: "block", fontSize: "var(--t-label)", fontWeight: 600, marginBottom: "var(--s-2)", color: "var(--text-muted)" }}>
          IMPLANT SIZE (1 to 8)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--s-1)" }}>
          {FEMORAL_TEMPLATES.map((t) => {
            const isSelected = femoralComponent.implant_size === t.size;
            return (
              <button
                key={t.size}
                type="button"
                disabled={isReadOnly}
                onClick={() => handleSizeChange(t.size)}
                aria-pressed={isSelected}
                className={`${c.sizeButton} ${isSelected ? c.sizeSelected : ""}`}
              >
                Size {t.size}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--s-2)", fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
          <span>AP: {currentTemplate.apMm.toFixed(1)} mm</span>
          <span>ML: {currentTemplate.mlMm.toFixed(1)} mm</span>
          {suggestedSize !== undefined ? (
            <button
              type="button"
              className={c.suggest}
              disabled={isReadOnly || suggestedSize === femoralComponent.implant_size}
              onClick={() => handleSizeChange(suggestedSize)}
            >
              {suggestedSize === femoralComponent.implant_size ? `Size ${suggestedSize} is the closest match` : `Use suggested: Size ${suggestedSize}`}
            </button>
          ) : (
            <span>Suggestion needs measurements</span>
          )}
        </div>
      </div>

      {/* 2D Position & Rotation Adjustment */}
      <div style={{ padding: "var(--s-3)", border: "var(--bw) solid var(--border)", borderRadius: "var(--r-sm)", background: "var(--surface-sunken)" }}>
        <h4 style={{ margin: "0 0 var(--s-3)", fontSize: "var(--t-label)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
          2D CAD Position & Alignment
        </h4>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <NudgeRow label="Medial / Lateral (X)" valueText={`${pos.x_offset_mm.toFixed(1)} mm`} step={0.2} unit="mm" disabled={isReadOnly} onDecrease={() => handleOffsetChange("x_offset_mm", -0.2)} onIncrease={() => handleOffsetChange("x_offset_mm", 0.2)} />
          <NudgeRow label="Anterior / Posterior (Y)" valueText={`${pos.y_offset_mm.toFixed(1)} mm`} step={0.2} unit="mm" disabled={isReadOnly} onDecrease={() => handleOffsetChange("y_offset_mm", -0.2)} onIncrease={() => handleOffsetChange("y_offset_mm", 0.2)} />
          <NudgeRow label="Axial Rotation" valueText={`${pos.rotation_deg.toFixed(1)}°`} step={0.5} unit="degrees" disabled={isReadOnly} onDecrease={() => handleOffsetChange("rotation_deg", -0.5)} onIncrease={() => handleOffsetChange("rotation_deg", 0.5)} />
        </div>
        {!isReadOnly && (
          <div style={{ marginTop: "var(--s-3)" }}>
            <KeyboardHint />
          </div>
        )}
      </div>

      {/* Live Fit Metrics (V1 Clinical Tolerances) */}
      <div>
        <h4 style={{ margin: "0 0 var(--s-3)", fontSize: "var(--t-label)", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
          Fit & Sizing Evaluation
        </h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>
          <FitGauge
            label="AP Coverage"
            value={measured ? fitResult.apCoveragePct : undefined}
            unit="%"
            tone={coverageTone(fitResult.apCoveragePct)}
            min={60}
            max={100}
            zones={[...COVERAGE_ZONES]}
            target="≥ 90%"
          />
          <FitGauge
            label="ML Coverage"
            value={measured ? fitResult.mlCoveragePct : undefined}
            unit="%"
            tone={coverageTone(fitResult.mlCoveragePct)}
            min={60}
            max={100}
            zones={[...COVERAGE_ZONES]}
            target="≥ 90%"
          />
          <FitGauge
            label="Anterior Notching Risk (KLAT)"
            value={measured ? fitResult.notchingRiskMm : undefined}
            unit=" mm"
            tone={notchTone(fitResult.notchingRiskMm)}
            min={0}
            max={2}
            zones={[...NOTCH_ZONES]}
            target="≤ 0.5 mm"
            note={measured && fitResult.notchingRiskMm === 0 ? "Flush" : undefined}
          />
          <FitVerdict status={fitResult.fitStatus} />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--s-2)", paddingTop: "var(--s-4)" }}>
        {!isReadOnly && (
          <Button
            variant="secondary"
            onClick={handleConfirmAndSave}
            disabled={status.kind === "saving"}
            style={{ width: "100%", justifyContent: "center", fontWeight: 600 }}
          >
            {status.kind === "saving"
              ? "Saving…"
              : femoralComponent.is_confirmed
                ? "Update Femoral Confirmation"
                : "Confirm Femoral Component"}
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
        {!isReadOnly && !femoralComponent.is_confirmed && (
          <p style={{ margin: 0, fontSize: "var(--t-caption)", color: "var(--text-muted)", textAlign: "center" }}>
            Confirm the component to continue. Moving or resizing it asks for a new confirmation.
          </p>
        )}
      </div>
    </div>
  );
}
