"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui";
import { getFemoralTemplate, type FemoralFitResult } from "@/lib/data/tkr_templates";
import {
  MARKER_KEYS,
  allMarkersPlaced,
  autoFitFemoral,
  clearanceText,
  screenMoveToOffsets,
  sideGaps,
  type FemoralSizeRow,
} from "@/lib/data/fit_markers";
import { adviseFemoral } from "@/lib/data/fit_advice";
import { ROTATION_LIMIT_DEG } from "@/lib/data/fit_map";
import { getFemoralImplant } from "@/lib/data/implant_templates";
import { FLEXION_LIMIT_DEG, cutPlan, legAxes, tiltFromSquareDeg } from "@/lib/data/resection_geometry";
import type { PlanDetail, V1FemoralComponent } from "@/lib/plan";
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
import { KeyboardHint, NudgeRow, SaveBadge } from "../components/PlanControls";
import { useNudgeKeys, useSaveStatus, type NudgeAxis } from "../components/planHooks";
import type { useFitSession } from "../components/useFitSession";
import c from "../components/planControls.module.css";

interface FemoralControlsPanelProps {
  femoralComponent: V1FemoralComponent;
  setFemoralComponent: React.Dispatch<React.SetStateAction<V1FemoralComponent>>;
  fitResult?: FemoralFitResult;
  ranking: { rows: FemoralSizeRow[]; recommended?: number };
  session: ReturnType<typeof useFitSession<V1FemoralComponent>>;
  plan: PlanDetail;
}

type Axis = "x_offset_mm" | "y_offset_mm" | "rotation_deg" | "flexion_deg" | "level_offset_mm";
type Step = 1 | 2 | 3 | 4;

export function FemoralControlsPanel({
  femoralComponent,
  setFemoralComponent,
  fitResult,
  ranking,
  session,
  plan,
}: FemoralControlsPanelProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const isReadOnly = plan.isReadyForVr || plan.lockedVersion !== undefined;
  const { bone, markers } = session;

  const currentTemplate = getFemoralTemplate(femoralComponent.implant_size);
  const pos = femoralComponent.position_2d;

  // The step on show. It opens where the work is up to, and moves on when the surgeon does.
  const [step, setStep] = useState<Step>(() =>
    femoralComponent.is_confirmed ? 4 : session.markersConfirmed ? 2 : 1,
  );
  const unlocked = session.markersConfirmed || isReadOnly ? 4 : 1;

  const { status, save, retry } = useSaveStatus<V1FemoralComponent>(
    plan.id,
    femoralComponent,
    plan.lockedVersion?.payload.v1_femoral ?? plan.payload.v1_femoral ?? null,
    isReadOnly,
  );

  const applySize = (size: number, position?: { x: number; y: number }) => {
    if (isReadOnly) return;
    const template = getFemoralTemplate(size);
    setFemoralComponent((prev) => ({
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
    setFemoralComponent((prev) => ({
      ...prev,
      ...(key === "level_offset_mm"
        ? { level_offset_mm: Number(((prev.level_offset_mm ?? 0) + delta).toFixed(1)) }
        : {
            position_2d: {
              ...prev.position_2d,
              [key]:
                key === "rotation_deg" || key === "flexion_deg"
                  ? (() => {
                      const limit = key === "rotation_deg" ? ROTATION_LIMIT_DEG : FLEXION_LIMIT_DEG;
                      return Math.max(-limit, Math.min(limit, Number(((prev.position_2d[key] ?? 0) + delta).toFixed(1))));
                    })()
                  : Number((prev.position_2d[key] + delta).toFixed(1)),
            },
          }),
      // Any move invalidates an earlier confirmation.
      is_confirmed: false,
    }));
  };

  // Keys move the implant the way it looks on the scan being shown.
  const handleKey = (axis: NudgeAxis, delta: number) => {
    // Turning keys act on the scan on show: tilt on the AP scan, flexion on the lateral scan.
    if (axis === "rotation_deg") return handleOffsetChange(session.viewMode === "FLAP" ? "rotation_deg" : "flexion_deg", delta);
    const move = screenMoveToOffsets(session.viewMode, axis === "horizontal" ? delta : 0, axis === "vertical" ? delta : 0, bone.anteriorImageSign);
    if (move.x) handleOffsetChange("x_offset_mm", move.x);
    if (move.y) handleOffsetChange("y_offset_mm", move.y);
    if (move.level) handleOffsetChange("level_offset_mm", move.level);
  };

  useNudgeKeys(!isReadOnly, handleKey);

  // The distal cut is set square to the leg's mechanical axis (hip centre to knee centre).
  const flapDims = session.calibration.dims.FLAP;
  const axes = flapDims ? legAxes(plan.payload.assessment_landmarks, flapDims.width, flapDims.height) : undefined;
  const squareToAxis = () => {
    if (isReadOnly || !axes) return;
    const clamped = Math.max(-ROTATION_LIMIT_DEG, Math.min(ROTATION_LIMIT_DEG, axes.squareRotationDeg));
    setFemoralComponent((prev) => ({ ...prev, position_2d: { ...prev.position_2d, rotation_deg: clamped }, is_confirmed: false }));
  };
  const flexion = pos.flexion_deg ?? 0;
  const offSquare = tiltFromSquareDeg(pos.rotation_deg, axes);
  const cuts = cutPlan(getFemoralImplant(femoralComponent.implant_size));

  const useBestFit = () => {
    if (ranking.recommended === undefined) return;
    applySize(ranking.recommended, autoFitFemoral(ranking.recommended, bone, pos.rotation_deg));
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
    const confirmed: V1FemoralComponent = {
      ...femoralComponent,
      is_confirmed: true,
      ap_dimension_mm: currentTemplate.apMm,
      ml_dimension_mm: currentTemplate.mlMm,
      ap_coverage_pct: fitResult.apCoveragePct,
      ml_coverage_pct: fitResult.mlCoveragePct,
      notching_risk_mm: fitResult.notchingRiskMm,
      fit_status: fitResult.fitStatus,
      bone_ml_mm: Number(bone.mlMm!.toFixed(1)),
      bone_ap_mm: Number(bone.apMm!.toFixed(1)),
      scale_estimated: bone.scaleEstimated,
      scales: { FLAP: session.scanOf("FLAP").mmPerPx, KLAT: session.scanOf("KLAT").mmPerPx },
    };
    setFemoralComponent(confirmed);

    const ok = await save(
      {
        v1_femoral: confirmed,
        // Legacy compat fields
        femoral_planning: {
          size: confirmed.implant_size,
          x_offset_mm: confirmed.position_2d.x_offset_mm,
          y_offset_mm: confirmed.position_2d.y_offset_mm,
          rotation_deg: confirmed.position_2d.rotation_deg,
        },
      },
      confirmed,
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

  const gaps = fitResult ? sideGaps(fitResult.extents, bone) : undefined;

  const sidewaysLabel = (x: number) =>
    x === 0 ? "centred" : (x > 0) === (bone.orientation.medialSide === "posX") ? "medial" : "lateral";

  const rows = ranking.rows.map((r) => ({
    size: r.size,
    tone: r.result.worstTone,
    summary: `Depth ${r.result.apCoveragePct.toFixed(0)}% · width ${r.result.mlCoveragePct.toFixed(0)}%${r.result.notchingRiskMm > 0.5 ? ` · gap ${r.result.notchingRiskMm.toFixed(1)}` : ""}`,
  }));

  const verdictIsPoor = fitResult?.worstTone === "fail";

  const advice = adviseFemoral({
    placed: MARKER_KEYS.filter((k) => Boolean(markers[k])).length,
    markersConfirmed: session.markersConfirmed,
    bone,
    fit: fitResult,
    size: femoralComponent.implant_size,
    rotationDeg: pos.rotation_deg,
    ranking,
  });

  // The spec sets no limit for the sides or the back, so those rows are shown and not judged.
  const summary: SummaryRow[] =
    fitResult && gaps
      ? [
          { label: "AP Coverage", value: `${fitResult.apCoveragePct.toFixed(1)}%`, tone: fitResult.apCoverageTone, note: "from the lateral scan · project limit 90%", group: "v1" },
          { label: "ML Coverage", value: `${fitResult.mlCoveragePct.toFixed(1)}%`, tone: fitResult.mlCoverageTone, note: "from the AP scan · project limit 90%", group: "v1" },
          {
            label: "Anterior Notching Risk",
            value: fitResult.notchingRiskMm === 0 ? (fitResult.anteriorProudMm > 0 ? `${fitResult.anteriorProudMm.toFixed(1)} mm proud` : "0.0 mm (flush)") : `${fitResult.notchingRiskMm.toFixed(1)} mm gap`,
            tone: fitResult.notchTone,
            note: "V1 example: 0.0 mm flush · project limit 0.5 mm",
            group: "v1",
          },
          {
            label: "Tilt (AP scan)",
            value: `${pos.rotation_deg.toFixed(1)}°${offSquare !== undefined ? ` · ${Math.abs(offSquare) < 0.05 ? "square to the mechanical axis" : `${Math.abs(offSquare).toFixed(1)}° off square`}` : ""}`,
            note: axes?.valgusCutAngleDeg !== undefined ? `a cut square to the mechanical axis is ${axes.valgusCutAngleDeg.toFixed(1)}° valgus to the shaft` : "the distal cut is normally square to the mechanical axis",
            group: "project",
          },
          { label: "Flexion (lateral scan)", value: `${flexion.toFixed(1)}°`, note: "a few degrees keeps the front flange off the cortex", group: "project" },
          ...cuts
            .filter((cut) => cut.thicknessMm !== undefined)
            .map((cut) => ({ label: `${cut.sequence}. ${cut.label}`, value: `${cut.thicknessMm!.toFixed(1)} mm of bone`, note: "removed at this cut", group: "project" as const })),
          { label: "Inner (medial) side", value: clearanceText(fitResult.medialOverhangMm, gaps.medial), note: "reported only, no limit set", group: "project" },
          { label: "Outer (lateral) side", value: clearanceText(fitResult.lateralOverhangMm, gaps.lateral), note: "reported only, no limit set", group: "project" },
          { label: "Back (posterior)", value: clearanceText(fitResult.posteriorOverhangMm, gaps.posterior), note: "reported only, no limit set", group: "project" },
        ]
      : [];

  const level = femoralComponent.level_offset_mm ?? 0;

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
        <h3 style={{ margin: 0, fontSize: "var(--t-h3)", fontWeight: 700, color: "var(--ink)" }}>Femoral component</h3>
        <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
          {femoralComponent.is_confirmed && <span className={c.confirmed}>CONFIRMED</span>}
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
                selected={femoralComponent.implant_size}
                recommended={ranking.recommended}
                disabled={isReadOnly}
                onSelect={(size) => applySize(size, autoFitFemoral(size, bone, pos.rotation_deg))}
              />
            ) : (
              <p className={c.hint}>Sizes are compared as soon as all four edges are placed and confirmed.</p>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--s-2)", marginTop: "var(--s-2)", fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
              <span>
                Size {currentTemplate.size}: {currentTemplate.apMm.toFixed(1)} front-to-back × {currentTemplate.mlMm.toFixed(1)} side-to-side mm
              </span>
              {!isReadOnly && ranking.recommended !== undefined && (
                <button type="button" className={c.suggest} onClick={useBestFit} disabled={ranking.recommended === femoralComponent.implant_size && pos.x_offset_mm === 0 && pos.y_offset_mm === 0}>
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
          <ol className={c.hint} style={{ margin: 0, paddingLeft: "1.1rem", display: "flex", flexDirection: "column", gap: 4 }}>
            <li>Drag the component on either scan, or on the map, until it spans the bone and the gap at the front is close to zero.</li>
            <li>
              <b>AP scan:</b> tilt it with the round handle until the distal cut is square to the green mechanical axis.
            </li>
            <li>
              <b>Lateral scan:</b> flex it a few degrees with the round handle so the front flange sits on the front of the bone without notching it.
            </li>
          </ol>
          <p className={c.hint} style={{ margin: 0 }}>
            The orange lines are where the saw goes, numbered in the order the cuts are made.
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
                  label="Tilt · AP scan (about the middle of the distal cut)"
                  valueText={`${pos.rotation_deg.toFixed(1)}° (limit ±${ROTATION_LIMIT_DEG}°)`}
                  step={0.5}
                  unit="degrees"
                  disabled={isReadOnly}
                  onDecrease={() => handleOffsetChange("rotation_deg", -0.5)}
                  onIncrease={() => handleOffsetChange("rotation_deg", 0.5)}
                />
                {axes && (
                  <button
                    type="button"
                    className={c.suggest}
                    onClick={squareToAxis}
                    title="Turn the component so its distal cut is square (90°) to the line from the hip centre to the knee centre"
                  >
                    Square to mechanical axis ({axes.squareRotationDeg.toFixed(1)}°)
                  </button>
                )}
                <NudgeRow
                  label="Flexion · lateral scan (about the back of the condyle)"
                  valueText={`${flexion.toFixed(1)}° (limit ±${FLEXION_LIMIT_DEG}°)`}
                  step={0.5}
                  unit="degrees"
                  disabled={isReadOnly}
                  onDecrease={() => handleOffsetChange("flexion_deg", -0.5)}
                  onIncrease={() => handleOffsetChange("flexion_deg", 0.5)}
                />
                <p className={c.hint}>Positive flexion tips the front of the component forward, away from the front of the bone. Turn keys act on the scan on show.</p>
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
          <FitSummary rows={summary} />
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
                  : femoralComponent.is_confirmed
                    ? "Update Femoral Component confirmation"
                    : verdictIsPoor
                      ? "Confirm Femoral Component (poor fit)"
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
          </div>
        </>
      )}
    </div>
  );
}
