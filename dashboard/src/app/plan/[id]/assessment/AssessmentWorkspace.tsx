"use client";

import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui";
import { fallbackNotice } from "@/lib/plan-scans";
import type { PlanDetail, V1Assessment } from "@/lib/plan";
import { LANDMARK_INFO, LANDMARK_ORDER, nextMissing } from "@/lib/data/landmark_guide";
import { measureAssessment, toV1Assessment } from "@/lib/data/assessment_geometry";
import { resolvePatientIdentity } from "@/lib/data/planner_identity";

import { SaveBadge } from "../components/PlanControls";
import { useSaveStatus } from "../components/planHooks";
import { useScanCalibration } from "../components/useScanCalibration";
import s from "../plan.module.css";
import { XRayCanvas } from "./XRayCanvas";
import { MeasurementPanel } from "./MeasurementPanel";

export type ViewMode = "FLAP" | "KLAT";

export type Point2D = { x: number; y: number };

/** The points the surgeon has placed. A point that is not here has not been placed, and measures nothing. */
export type LandmarkState = {
  // FLAP (AP) landmarks
  hipCenter?: Point2D;
  kneeCenter?: Point2D;
  ankleCenter?: Point2D;
  femurDistalLateral?: Point2D;
  femurDistalMedial?: Point2D;
  tibiaProximalLateral?: Point2D;
  tibiaProximalMedial?: Point2D;
  femurCanalProximal?: Point2D;
  femurCanalDistal?: Point2D;

  // KLAT (lateral) landmarks
  tibiaPlateauAnterior?: Point2D;
  tibiaPlateauPosterior?: Point2D;
  tibiaShaftProximal?: Point2D;
  tibiaShaftDistal?: Point2D;
};

type LandmarkKey = keyof LandmarkState;

const isPoint = (p: unknown): p is Point2D =>
  Boolean(p) && Number.isFinite((p as Point2D).x) && Number.isFinite((p as Point2D).y);

/** What was saved, reduced to the points the assessment uses. Nothing is invented for the rest. */
function readSaved(raw?: Record<string, unknown>): LandmarkState {
  if (!raw) return {};
  const out: LandmarkState = {};
  const alias: Record<string, string[]> = {
    hipCenter: ["hipCenter", "femoral_head_center"],
    kneeCenter: ["kneeCenter", "femoral_knee_center", "tibial_knee_center"],
    ankleCenter: ["ankleCenter", "ankle_center"],
  };
  for (const key of LANDMARK_ORDER as LandmarkKey[]) {
    for (const name of alias[key] ?? [key]) {
      const p = raw[name];
      if (isPoint(p)) {
        out[key] = { x: p.x, y: p.y };
        break;
      }
    }
  }
  return out;
}

export function AssessmentWorkspace({ plan }: { plan: PlanDetail }) {
  // If the plan is locked, read from the sealed version; otherwise the draft.
  const planLocked = plan.isReadyForVr || plan.lockedVersion !== undefined;
  // V1 (PDF p.3): "Clicking [Continue to Tibial Planning] hard-locks Assessment values." Saving the
  // assessment is what Continue does, so a saved assessment is read-only; a plan lock also freezes it.
  const assessmentSaved = Boolean(plan.payload.v1_assessment);
  const isReadOnly = planLocked || assessmentSaved;
  const isSynthetic = resolvePatientIdentity(plan.caseId, plan.case.patient).patientIdSource === "synthetic fixture";
  const rawLandmarks =
    isReadOnly && plan.lockedVersion?.payload.assessment_landmarks
      ? plan.lockedVersion.payload.assessment_landmarks
      : plan.payload.assessment_landmarks;
  const savedAssessment: V1Assessment | undefined = isReadOnly
    ? plan.lockedVersion?.payload.v1_assessment ?? plan.payload.v1_assessment
    : plan.payload.v1_assessment;

  const [landmarks, setLandmarks] = useState<LandmarkState>(() => readSaved(rawLandmarks));
  const [isAccepted, setIsAccepted] = useState(isReadOnly);

  // A new plan opens already asking for the hip. One that has been measured opens for review instead.
  const firstMissing = isReadOnly || plan.payload.v1_assessment ? undefined : nextMissing((k) => Boolean(readSaved(rawLandmarks)[k as LandmarkKey]));
  const [placing, setPlacing] = useState<LandmarkKey | null>((firstMissing as LandmarkKey | undefined) ?? null);
  const [viewMode, setViewMode] = useState<ViewMode>(() => (firstMissing ? LANDMARK_INFO[firstMissing].view : "FLAP"));

  // The scale of each scan, decided in one place and shared with the tibial and femoral steps.
  const calibration = useScanCalibration({
    plan,
    isReadOnly,
    // A new scale changes MAD, so the assessment has to be accepted again.
    onScaleChanged: () => setIsAccepted(false),
  });
  const { scales, dims } = calibration;

  const { status: saveStatus, save, retry } = useSaveStatus<LandmarkState>(
    plan.id,
    landmarks,
    rawLandmarks ? readSaved(rawLandmarks) : null,
    isReadOnly,
  );

  const scan = scales[viewMode];
  const kneeSide: "RIGHT" | "LEFT" = (plan.case.side || "right").toUpperCase() === "LEFT" ? "LEFT" : "RIGHT";

  const reading = useMemo(
    () =>
      measureAssessment(
        landmarks,
        dims.FLAP ? { widthPx: dims.FLAP.width, heightPx: dims.FLAP.height, mmPerPx: scales.FLAP.mmPerPx, calibrated: scales.FLAP.calibrated } : null,
        dims.KLAT ? { widthPx: dims.KLAT.width, heightPx: dims.KLAT.height, mmPerPx: scales.KLAT.mmPerPx, calibrated: scales.KLAT.calibrated } : null,
        kneeSide,
      ),
    [landmarks, dims.FLAP, dims.KLAT, scales.FLAP.mmPerPx, scales.FLAP.calibrated, scales.KLAT.mmPerPx, scales.KLAT.calibrated, kneeSide],
  );

  // A plan saved with a measured assessment but too few points to re-measure it (the demo cases) keeps
  // showing what was saved until the surgeon changes a point.
  const untouched = JSON.stringify(landmarks) === JSON.stringify(readSaved(rawLandmarks));
  const usingSaved = Boolean(savedAssessment) && (isReadOnly || (untouched && !reading.complete));

  const startPlacing = (key: LandmarkKey | null) => {
    if (isReadOnly) return;
    calibration.cancelCalibrating();
    setPlacing(key);
    if (key) setViewMode(LANDMARK_INFO[key].view);
  };

  const handleLandmarkMove = (key: LandmarkKey, pos: Point2D) => {
    if (isReadOnly || isAccepted) return;
    setLandmarks((prev) => ({ ...prev, [key]: pos }));
  };

  // Placing a point carries straight on to the next one, switching scan when the next is on the other.
  const handlePlace = (key: LandmarkKey, pos: Point2D) => {
    if (isReadOnly || isAccepted) return;
    const after = { ...landmarks, [key]: pos };
    setLandmarks(after);
    const next = nextMissing((k) => Boolean(after[k as LandmarkKey]), key) as LandmarkKey | undefined;
    setPlacing(next ?? null);
    if (next) setViewMode(LANDMARK_INFO[next].view);
  };

  const handleReset = () => {
    if (isReadOnly) return;
    setIsAccepted(false);
    setLandmarks({});
    startPlacing("hipCenter");
  };

  const handleUnlock = () => {
    if (isReadOnly) return;
    setIsAccepted(false);
  };

  const handleAccept = async (): Promise<boolean> => {
    if (isReadOnly) return false;
    const assessment = toV1Assessment(reading);
    if (!assessment) return false;
    setIsAccepted(true);
    setPlacing(null);

    const ok = await save(
      {
        v1_assessment: assessment,
        assessment_landmarks: {
          ...landmarks,
          femoral_head_center: landmarks.hipCenter,
          femoral_knee_center: landmarks.kneeCenter,
          tibial_knee_center: landmarks.kneeCenter,
          ankle_center: landmarks.ankleCenter,
        },
      },
      landmarks,
    );
    // Let the surgeon keep adjusting if the server did not accept the assessment.
    if (!ok) setIsAccepted(false);
    return ok;
  };

  const placedOn = (view: ViewMode) =>
    (LANDMARK_ORDER as LandmarkKey[]).filter((k) => LANDMARK_INFO[k].view === view && landmarks[k]).length;
  const totalOn = (view: ViewMode) => (LANDMARK_ORDER as LandmarkKey[]).filter((k) => LANDMARK_INFO[k].view === view).length;

  return (
    <div className={s.body}>
      <div className={s.card}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--s-3)", alignItems: "center", marginBottom: "var(--s-4)" }}>
          <Segmented
            label="Scan view"
            value={viewMode}
            onChange={(v) => {
              setViewMode(v);
              // Switching scans while placing carries on with the first point missing on that scan.
              if (placing && LANDMARK_INFO[placing].view !== v) {
                const onThat = (LANDMARK_ORDER as LandmarkKey[]).find((k) => LANDMARK_INFO[k].view === v && !landmarks[k]);
                setPlacing(onThat ?? null);
              }
            }}
            options={[
              { value: "FLAP", label: `FLAP · full-leg AP (${placedOn("FLAP")}/${totalOn("FLAP")})` },
              { value: "KLAT", label: `KLAT · knee lateral (${placedOn("KLAT")}/${totalOn("KLAT")})` },
            ]}
          />
          <div style={{ marginLeft: "auto" }}>
            <SaveBadge status={saveStatus} onRetry={retry} />
          </div>
        </div>

        <div style={{ display: "flex", gap: "2rem", height: "min(900px, max(720px, calc(100vh - 190px)))" }}>
          {/* Main imaging / landmark workspace */}
          <div style={{ flex: "2", order: 2, border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", position: "relative" }}>
            {scan.isFallback && (
              <div
                role="status"
                style={{ position: "absolute", top: 10, right: 10, zIndex: 100, backgroundColor: "rgba(154,98,18,0.95)", color: "white", padding: "6px 12px", borderRadius: "4px", fontSize: "0.8125rem", fontWeight: 600, maxWidth: "60%" }}
              >
                {fallbackNotice(viewMode)}
              </div>
            )}

            {isSynthetic && (
              <div style={{ position: "absolute", bottom: 10, right: 10, zIndex: 100, backgroundColor: "rgba(220,38,38,0.9)", color: "white", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                DEMO / SYNTHETIC - Not for clinical use
              </div>
            )}
            <XRayCanvas
              viewMode={viewMode}
              landmarks={landmarks}
              isAccepted={isAccepted}
              placing={placing}
              onPlace={handlePlace}
              onCancelPlace={() => setPlacing(null)}
              onLandmarkMove={handleLandmarkMove}
              onDimsLoaded={calibration.reportDims}
              src={scan.src}
              mmPerPx={scan.mmPerPx}
              scale={{
                calibrated: scan.calibrated,
                calibrating: calibration.calibrating,
                knownMm: calibration.knownMm,
                onMeasured: calibration.completeCalibration,
                onCancel: calibration.cancelCalibrating,
                candidate: calibration.detection?.status === "found" ? { view: calibration.detection.view, ...calibration.detection.candidate } : undefined,
              }}
            />
          </div>

          {/* Measurement panel */}
          <div style={{ flex: "1", order: 1, display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0, minHeight: 0 }}>
            <MeasurementPanel
              landmarks={landmarks}
              reading={reading}
              stored={usingSaved ? savedAssessment : undefined}
              placing={placing}
              onStartPlacing={startPlacing}
              calibration={calibration}
              isAccepted={isAccepted}
              isReadOnly={isReadOnly}
              lockedBy={planLocked ? "plan" : assessmentSaved ? "continue" : undefined}
              scalesVerified={scales.FLAP.calibrated && scales.KLAT.calibrated}
              kneeSide={kneeSide}
              onReset={handleReset}
              onUnlock={handleUnlock}
              onAccept={handleAccept}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
