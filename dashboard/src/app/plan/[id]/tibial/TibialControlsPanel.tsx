"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui";
import { getTibialTemplate, type TibialFitResult } from "@/lib/data/tkr_templates";
import {
  MARKER_KEYS,
  allMarkersPlaced,
  autoFitTibial,
  clearanceText,
  screenMoveToOffsets,
  sideGaps,
  plateauLineAngleDeg,
  type TibialSizeRow,
} from "@/lib/data/fit_markers";
import { adviseTibial } from "@/lib/data/fit_advice";
import { ROTATION_LIMIT_DEG } from "@/lib/data/fit_map";
import type { PlanDetail, V1TibialComponent } from "@/lib/plan";
import { KeyboardHint, NudgeRow, SaveBadge } from "../components/PlanControls";
import {
  AdviceCard,
  ConfirmBlockers,
  FitStepper,
  FitSummary,
  MarkerChecklist,
  ScalePanel,
  SizeTable,
  StepNav,
  type SummaryRow,
} from "../components/FitPanels";
import { useNudgeKeys, useSaveStatus, type NudgeAxis } from "../components/planHooks";
import type { useFitSession } from "../components/useFitSession";
import c from "../components/planControls.module.css";

interface TibialControlsPanelProps {
  tibialComponent: V1TibialComponent;
  setTibialComponent: React.Dispatch<React.SetStateAction<V1TibialComponent>>;
  fitResult?: TibialFitResult;
  ranking: { rows: TibialSizeRow[]; recommended?: number };
  session: ReturnType<typeof useFitSession<V1TibialComponent>>;
  plan: PlanDetail;
}

type Axis = "x_offset_mm" | "y_offset_mm" | "rotation_deg" | "level_offset_mm";
type Step = 1 | 2 | 3 | 4;

export function TibialControlsPanel({
  tibialComponent,
  setTibialComponent,
  fitResult,
  ranking,
  session,
  plan,
}: TibialControlsPanelProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;
  const { bone, markers } = session;

  const currentTemplate = getTibialTemplate(tibialComponent.implant_size);
  const pos = tibialComponent.position_2d;

  // The step on show. It opens where the work is up to, and moves on when the surgeon does.
  const [step, setStep] = useState<Step>(() =>
    tibialComponent.is_confirmed ? 4 : session.markersConfirmed ? 2 : 1,
  );
  const unlocked = session.markersConfirmed || isReadOnly ? 4 : 1;

  const { status, save, retry } = useSaveStatus<V1TibialComponent>(
    plan.id,
    tibialComponent,
    plan.lockedVersion?.payload.v1_tibial ?? plan.payload.v1_tibial ?? null,
    isReadOnly,
  );

  const applySize = (size: number, position?: { x: number; y: number }) => {
    if (isReadOnly) return;
    const template = getTibialTemplate(size);
    setTibialComponent((prev) => ({
      ...prev,
      implant_size: size,
      ap_dimension_mm: template.apMm,
      ml_dimension_mm: template.mlMm,
      position_2d: position
        ? { ...prev.position_2d, x_offset_mm: position.x, y_offset_mm: position.y }
        : prev.position_2d,
      is_confirmed: false,
    }));
  };

  const handleOffsetChange = (key: Axis, delta: number) => {
    if (isReadOnly) return;
    setTibialComponent((prev) => ({
      ...prev,
      ...(key === "level_offset_mm"
        ? { level_offset_mm: Number(((prev.level_offset_mm ?? 0) + delta).toFixed(1)) }
        : {
            position_2d: {
              ...prev.position_2d,
              [key]:
                key === "rotation_deg"
                  ? Math.max(-ROTATION_LIMIT_DEG, Math.min(ROTATION_LIMIT_DEG, Number((prev.position_2d[key] + delta).toFixed(1))))
                  : Number((prev.position_2d[key] + delta).toFixed(1)),
            },
          }),
      // Any move invalidates an earlier confirmation: what was saved is no longer what is shown.
      is_confirmed: false,
    }));
  };

  // Keys move the implant the way it looks on the scan being shown.
  const handleKey = (axis: NudgeAxis, delta: number) => {
    if (axis === "rotation_deg") return handleOffsetChange("rotation_deg", delta);
    const move = screenMoveToOffsets(session.viewMode, axis === "horizontal" ? delta : 0, axis === "vertical" ? delta : 0, bone.anteriorImageSign);
    if (move.x) handleOffsetChange("x_offset_mm", move.x);
    if (move.y) handleOffsetChange("y_offset_mm", move.y);
    if (move.level) handleOffsetChange("level_offset_mm", move.level);
  };

  useNudgeKeys(!isReadOnly, handleKey);

  const flapDims = session.calibration.dims.FLAP;
  const plateauAngle = plateauLineAngleDeg(markers, flapDims ? { widthPx: flapDims.width, heightPx: flapDims.height } : undefined);
  const alignToPlateauLine = () => {
    if (isReadOnly || plateauAngle === undefined) return;
    const clamped = Math.max(-ROTATION_LIMIT_DEG, Math.min(ROTATION_LIMIT_DEG, plateauAngle));
    setTibialComponent((prev) => ({ ...prev, position_2d: { ...prev.position_2d, rotation_deg: clamped }, is_confirmed: false }));
  };

  const useBestFit = () => {
    if (ranking.recommended === undefined) return;
    applySize(ranking.recommended, autoFitTibial(ranking.recommended, bone, pos.rotation_deg));
  };

  const blockers: string[] = [];
  if (!isReadOnly) {
    blockers.push(...session.scaleBlockers.map((b) => `${b} (Step 1)`));
    if (!allMarkersPlaced(markers)) blockers.push("Place all four bone edges (Step 1).");
    else if (!bone.complete) blockers.push("Waiting for the scans to load.");
    else if (!session.markersConfirmed) blockers.push("Confirm that the marked edges are right (Step 1).");
  }

  const handleConfirmAndSave = async () => {
    if (isReadOnly || blockers.length > 0 || !fitResult) return;
    const confirmed: V1TibialComponent = {
      ...tibialComponent,
      is_confirmed: true,
      ap_dimension_mm: currentTemplate.apMm,
      ml_dimension_mm: currentTemplate.mlMm,
      cortical_coverage_pct: fitResult.coveragePct,
      medial_overhang_mm: fitResult.medialOverhangMm,
      lateral_overhang_mm: fitResult.lateralOverhangMm,
      anterior_overhang_mm: fitResult.anteriorOverhangMm,
      posterior_overhang_mm: fitResult.posteriorOverhangMm,
      fit_status: fitResult.fitStatus,
      bone_ml_mm: Number(bone.mlMm!.toFixed(1)),
      bone_ap_mm: Number(bone.apMm!.toFixed(1)),
      scale_estimated: bone.scaleEstimated,
      scales: { FLAP: session.scanOf("FLAP").mmPerPx, KLAT: session.scanOf("KLAT").mmPerPx },
    };
    setTibialComponent(confirmed);

    const ok = await save(
      {
        v1_tibial: confirmed,
        // Also write legacy compat fields
        tibial_planning: {
          size: confirmed.implant_size,
          x_offset_mm: confirmed.position_2d.x_offset_mm,
          y_offset_mm: confirmed.position_2d.y_offset_mm,
          rotation_deg: confirmed.position_2d.rotation_deg,
          patient_ml_mm: confirmed.bone_ml_mm!,
          patient_ap_mm: confirmed.bone_ap_mm!,
        },
      },
      confirmed,
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

  const gaps = fitResult ? sideGaps(fitResult.extents, bone) : undefined;

  const sidewaysLabel = (x: number) =>
    x === 0 ? "centred" : (x > 0) === (bone.orientation.medialSide === "posX") ? "medial" : "lateral";

  const rows = ranking.rows.map((r) => {
    const over = Math.max(r.result.medialOverhangMm, r.result.lateralOverhangMm, r.result.anteriorOverhangMm, r.result.posteriorOverhangMm);
    return {
      size: r.size,
      tone: r.result.worstTone,
      summary: `${r.result.coveragePct.toFixed(0)}% · ${over > 0 ? `${over.toFixed(1)} mm over` : "no overhang"}`,
    };
  });

  const verdictIsPoor = fitResult?.worstTone === "fail";

  const advice = adviseTibial({
    placed: MARKER_KEYS.filter((k) => Boolean(markers[k])).length,
    markersConfirmed: session.markersConfirmed,
    bone,
    fit: fitResult,
    size: tibialComponent.implant_size,
    rotationDeg: pos.rotation_deg,
    ranking,
  });

  const summary: SummaryRow[] =
    fitResult && gaps
      ? [
          { label: "Cortical Coverage", value: `${fitResult.coveragePct.toFixed(1)}%`, tone: fitResult.coverageTone, note: "V1: 90.0% or more · estimated from your marks", group: "v1" },
          { label: "Medial Overhang", value: clearanceText(fitResult.medialOverhangMm, gaps.medial), tone: fitResult.medialTone, note: "V1: 1.0 mm or less", group: "v1" },
          { label: "Lateral Overhang", value: clearanceText(fitResult.lateralOverhangMm, gaps.lateral), tone: fitResult.lateralTone, note: "V1: 1.0 mm or less", group: "v1" },
          { label: "Anterior edge", value: clearanceText(fitResult.anteriorOverhangMm, gaps.anterior), tone: fitResult.anteriorTone, note: "same limits reused (not in V1)", group: "project" },
          { label: "Posterior edge", value: clearanceText(fitResult.posteriorOverhangMm, gaps.posterior), tone: fitResult.posteriorTone, note: "same limits reused (not in V1)", group: "project" },
        ]
      : [];

  const level = tibialComponent.level_offset_mm ?? 0;

  return (
    <div
      style={{
        padding: "var(--s-5)",
        backgroundColor: "var(--surface)",
        border: "var(--bw) solid var(--border)",
        borderRadius: "var(--r-md)",
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-4)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "var(--t-h3)", fontWeight: 700, color: "var(--ink)" }}>Tibial tray</h3>
        <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
          {tibialComponent.is_confirmed && <span className={c.confirmed}>CONFIRMED</span>}
          <SaveBadge status={status} onRetry={retry} />
        </div>
      </div>

      <FitStepper current={step} onPick={setStep} unlocked={unlocked} />
      <AdviceCard advice={advice} />

      {step === 1 && (
        <>
          <ScalePanel
            scales={{ FLAP: session.scanOf("FLAP"), KLAT: session.scanOf("KLAT") }}
            calibration={session.calibration}
            // The assessment's MAD was measured at the assessment's scale and is locked, so the scale is set on Page 1.
            readOnly={isReadOnly || Boolean(plan.payload.v1_assessment)}
            accepted={session.estimatedScaleAccepted}
            onAccept={session.acceptEstimatedScale}
            compact
          />
          <MarkerChecklist
            markers={markers}
            bone={bone}
            placing={session.placing}
            readOnly={isReadOnly}
            onPlace={session.startPlacing}
            onConfirm={() => {
              session.confirmMarkers();
              setStep(2);
            }}
          />
          {isReadOnly && <StepNav label="Next: choose the size →" onClick={() => setStep(2)} />}
        </>
      )}

      {step === 2 && (
        <>
          <div>
            {rows.length > 0 ? (
              <SizeTable
                rows={rows}
                selected={tibialComponent.implant_size}
                recommended={ranking.recommended}
                disabled={isReadOnly}
                onSelect={(size) => applySize(size, autoFitTibial(size, bone, pos.rotation_deg))}
              />
            ) : (
              <p className={c.hint}>Sizes are compared as soon as all four edges are placed and confirmed.</p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--s-2)", marginTop: "var(--s-2)", fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
              <span>
                Size {currentTemplate.size}: {currentTemplate.apMm.toFixed(1)} front-to-back × {currentTemplate.mlMm.toFixed(1)} side-to-side mm
              </span>
              {!isReadOnly && ranking.recommended !== undefined && (
                <button type="button" className={c.suggest} onClick={useBestFit} disabled={ranking.recommended === tibialComponent.implant_size && pos.x_offset_mm === 0 && pos.y_offset_mm === 0}>
                  Use best fit
                </button>
              )}
            </div>
          </div>
          <StepNav label="Next: position it →" onClick={() => setStep(3)} disabled={!bone.complete} />
        </>
      )}

      {step === 3 && (
        <>
          <p className={c.hint} style={{ margin: 0 }}>
            Drag the tray on either scan or on the Fit map until the labels show a small gap or none at all. The round handle on the map turns it.
          </p>
          {!isReadOnly && (
            <details className={c.how}>
              <summary className={c.howSummary}>Fine-tune with buttons</summary>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)", paddingTop: "var(--s-2)" }}>
                <NudgeRow
                  label="Medial / Lateral"
                  valueText={`${Math.abs(pos.x_offset_mm).toFixed(1)} mm ${sidewaysLabel(pos.x_offset_mm)}`}
                  step={0.2}
                  unit="mm"
                  disabled={isReadOnly}
                  onDecrease={() => handleOffsetChange("x_offset_mm", -0.2)}
                  onIncrease={() => handleOffsetChange("x_offset_mm", 0.2)}
                />
                <NudgeRow
                  label="Anterior / Posterior"
                  valueText={`${Math.abs(pos.y_offset_mm).toFixed(1)} mm ${pos.y_offset_mm === 0 ? "centred" : pos.y_offset_mm > 0 ? "posterior" : "anterior"}`}
                  step={0.2}
                  unit="mm"
                  disabled={isReadOnly}
                  onDecrease={() => handleOffsetChange("y_offset_mm", -0.2)}
                  onIncrease={() => handleOffsetChange("y_offset_mm", 0.2)}
                />
                <NudgeRow
                  label="Rotation (AP view, in the image plane)"
                  valueText={`${pos.rotation_deg.toFixed(1)}° (limit ±${ROTATION_LIMIT_DEG}°)`}
                  step={0.5}
                  unit="degrees"
                  disabled={isReadOnly}
                  onDecrease={() => handleOffsetChange("rotation_deg", -0.5)}
                  onIncrease={() => handleOffsetChange("rotation_deg", 0.5)}
                />
                {plateauAngle !== undefined && (
                  <button
                    type="button"
                    className={c.suggest}
                    onClick={alignToPlateauLine}
                    title="Turn the overlay to the line through the two edge marks on the AP scan (the plateau / MPTA line)"
                  >
                    Align to plateau line ({plateauAngle.toFixed(1)}°)
                  </button>
                )}
                <NudgeRow
                  label="Height on scan"
                  valueText={`${Math.abs(level).toFixed(1)} mm ${level === 0 ? "at the marked level" : level > 0 ? "lower" : "higher"}`}
                  step={0.5}
                  unit="mm"
                  disabled={isReadOnly}
                  onDecrease={() => handleOffsetChange("level_offset_mm", -0.5)}
                  onIncrease={() => handleOffsetChange("level_offset_mm", 0.5)}
                />
                <p className={c.hint}>Height only moves the drawing up or down the scan. It does not change the fit numbers.</p>
                <KeyboardHint />
              </div>
            </details>
          )}
          <StepNav label="Next: check and confirm →" onClick={() => setStep(4)} />
        </>
      )}

      {step === 4 && (
        <>
          <FitSummary rows={summary} cautions={fitResult?.cautionTags} />
          <div className={c.stickyActions}>
            <ConfirmBlockers reasons={blockers} />
            {!isReadOnly && (
              <Button
                variant="secondary"
                onClick={handleConfirmAndSave}
                disabled={status.kind === "saving" || blockers.length > 0}
                style={{ width: "100%", justifyContent: "center", fontWeight: 600 }}
              >
                {status.kind === "saving"
                  ? "Saving…"
                  : tibialComponent.is_confirmed
                    ? "Update Tibial Component confirmation"
                    : verdictIsPoor
                      ? "Confirm Tibial Component (poor fit)"
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
          </div>
        </>
      )}
    </div>
  );
}
