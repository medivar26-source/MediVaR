"use client";

import { useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui";
import {
  TIBIAL_TEMPLATES,
  getTibialTemplate,
  evaluateTibialFit,
  suggestTibialSize,
  type TibialFitResult,
} from "@/lib/data/tkr_templates";
import type { PlanDetail, V1TibialComponent } from "@/lib/plan";
import { FitGauge, FitVerdict, KeyboardHint, NudgeRow, SaveBadge, type Tone } from "../components/PlanControls";
import { useNudgeKeys, useSaveStatus } from "../components/planHooks";
import c from "../components/planControls.module.css";

interface TibialControlsPanelProps {
  tibialComponent: V1TibialComponent;
  setTibialComponent: React.Dispatch<React.SetStateAction<V1TibialComponent>>;
  fitResult: TibialFitResult;
  plan: PlanDetail;
  patientBone?: { mlMm: number; apMm: number };
}

type Axis = "x_offset_mm" | "y_offset_mm" | "rotation_deg";

const NOT_MEASURED = { coveragePct: 0, medialOverhangMm: 0, lateralOverhangMm: 0, fitStatus: "incomplete" as never };

const coverageTone = (v: number): Tone => (v >= 90 ? "pass" : v >= 85 ? "warn" : "fail");
const overhangTone = (v: number): Tone => (v <= 1.0 ? "pass" : v <= 1.5 ? "warn" : "fail");

const COVERAGE_ZONES = [
  { from: 60, to: 85, tone: "fail" },
  { from: 85, to: 90, tone: "warn" },
  { from: 90, to: 100, tone: "pass" },
] as const;

const OVERHANG_ZONES = [
  { from: 0, to: 1, tone: "pass" },
  { from: 1, to: 1.5, tone: "warn" },
  { from: 1.5, to: 3, tone: "fail" },
] as const;

export function TibialControlsPanel({
  tibialComponent,
  setTibialComponent,
  fitResult,
  plan,
  patientBone,
}: TibialControlsPanelProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;

  const currentTemplate = getTibialTemplate(tibialComponent.implant_size);
  const suggestedSize = patientBone ? suggestTibialSize(patientBone.mlMm) : undefined;
  const measured = Boolean(patientBone);

  const { status, save, retry } = useSaveStatus<V1TibialComponent>(
    plan.id,
    tibialComponent,
    plan.lockedVersion?.payload.v1_tibial ?? plan.payload.v1_tibial ?? null,
    isReadOnly,
  );

  const evaluate = (size: number, pos: V1TibialComponent["position_2d"]) =>
    patientBone
      ? evaluateTibialFit(size, pos.x_offset_mm, pos.y_offset_mm, patientBone.apMm, patientBone.mlMm, pos.rotation_deg)
      : NOT_MEASURED;

  const handleSizeChange = (newSize: number) => {
    if (isReadOnly) return;
    const template = getTibialTemplate(newSize);
    setTibialComponent((prev) => {
      const fit = evaluate(newSize, prev.position_2d);
      return {
        ...prev,
        implant_size: newSize,
        ap_dimension_mm: template.apMm,
        ml_dimension_mm: template.mlMm,
        cortical_coverage_pct: fit.coveragePct,
        medial_overhang_mm: fit.medialOverhangMm,
        lateral_overhang_mm: fit.lateralOverhangMm,
        fit_status: fit.fitStatus,
        is_confirmed: false,
      };
    });
  };

  const handleOffsetChange = (key: Axis, delta: number) => {
    if (isReadOnly) return;
    setTibialComponent((prev) => {
      const newPos = {
        ...prev.position_2d,
        [key]: Number((prev.position_2d[key] + delta).toFixed(1)),
      };
      const fit = evaluate(prev.implant_size, newPos);
      return {
        ...prev,
        position_2d: newPos,
        cortical_coverage_pct: fit.coveragePct,
        medial_overhang_mm: fit.medialOverhangMm,
        lateral_overhang_mm: fit.lateralOverhangMm,
        fit_status: fit.fitStatus,
        // Any move invalidates an earlier confirmation: what was saved is no longer what is shown.
        is_confirmed: false,
      };
    });
  };

  useNudgeKeys(!isReadOnly, handleOffsetChange);

  const handleConfirmAndSave = async () => {
    if (isReadOnly) return;
    const confirmedComponent: V1TibialComponent = { ...tibialComponent, is_confirmed: true };
    setTibialComponent(confirmedComponent);

    const ok = await save(
      {
        v1_tibial: confirmedComponent,
        // Also write legacy compat fields
        tibial_planning: {
          size: confirmedComponent.implant_size,
          x_offset_mm: confirmedComponent.position_2d.x_offset_mm,
          y_offset_mm: confirmedComponent.position_2d.y_offset_mm,
          rotation_deg: confirmedComponent.position_2d.rotation_deg,
        },
      },
      confirmedComponent,
    );
    // A confirmation the server never accepted must not unlock the next step.
    if (!ok) setTibialComponent((prev) => ({ ...prev, is_confirmed: false }));
  };

  const handleContinue = () => {
    const planId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
    startTransition(() => {
      router.push(`/plan/${planId}/femoral`);
    });
  };

  const pos = tibialComponent.position_2d;

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
        <h3 style={{ margin: 0, fontSize: "var(--t-h3)", fontWeight: 700, color: "var(--ink)" }}>Tibial Component Sizing</h3>
        <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
          {tibialComponent.is_confirmed && <span className={c.confirmed}>CONFIRMED</span>}
          <SaveBadge status={status} onRetry={retry} />
        </div>
      </div>

      {/* Sizing Toolbar: Discrete Sizes 1 to 6 */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "var(--s-2)",
            padding: "6px var(--s-2)",
            background: "var(--surface-sunken)",
            borderRadius: "var(--r-xs)",
            fontSize: "var(--t-caption)",
            border: "var(--bw) solid var(--border)",
          }}
        >
          <span>Patient Radiographic AP: <strong>{patientBone ? `${patientBone.apMm.toFixed(1)} mm` : "—"}</strong></span>
          <span>Radiographic ML: <strong>{patientBone ? `${patientBone.mlMm.toFixed(1)} mm` : "—"}</strong></span>
        </div>
        <label style={{ display: "block", fontSize: "var(--t-label)", fontWeight: 600, marginBottom: "var(--s-2)", color: "var(--text-muted)" }}>
          IMPLANT SIZE (1 to 6)
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "var(--s-1)" }}>
          {TIBIAL_TEMPLATES.map((t) => {
            const isSelected = tibialComponent.implant_size === t.size;
            return (
              <button
                key={t.size}
                type="button"
                disabled={isReadOnly}
                onClick={() => handleSizeChange(t.size)}
                aria-pressed={isSelected}
                className={`${c.sizeButton} ${isSelected ? c.sizeSelected : ""}`}
              >
                {t.size}
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
              disabled={isReadOnly || suggestedSize === tibialComponent.implant_size}
              onClick={() => handleSizeChange(suggestedSize)}
            >
              {suggestedSize === tibialComponent.implant_size ? `Size ${suggestedSize} is the closest match` : `Use suggested: Size ${suggestedSize}`}
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
            label="Cortical Coverage"
            value={measured ? fitResult.coveragePct : undefined}
            unit="%"
            tone={coverageTone(fitResult.coveragePct)}
            min={60}
            max={100}
            zones={[...COVERAGE_ZONES]}
            target="≥ 90%"
          />
          <FitGauge
            label="Medial Overhang"
            value={measured ? fitResult.medialOverhangMm : undefined}
            unit=" mm"
            tone={overhangTone(fitResult.medialOverhangMm)}
            min={0}
            max={3}
            zones={[...OVERHANG_ZONES]}
            target="≤ 1.0 mm"
          />
          <FitGauge
            label="Lateral Overhang"
            value={measured ? fitResult.lateralOverhangMm : undefined}
            unit=" mm"
            tone={overhangTone(fitResult.lateralOverhangMm)}
            min={0}
            max={3}
            zones={[...OVERHANG_ZONES]}
            target="≤ 1.0 mm"
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
              : tibialComponent.is_confirmed
                ? "Update Tibial Confirmation"
                : "Confirm Tibial Component"}
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
        {!isReadOnly && !tibialComponent.is_confirmed && (
          <p style={{ margin: 0, fontSize: "var(--t-caption)", color: "var(--text-muted)", textAlign: "center" }}>
            Confirm the component to continue. Moving or resizing it asks for a new confirmation.
          </p>
        )}
      </div>
    </div>
  );
}
