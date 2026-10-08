"use client";

import { useState, useTransition } from "react";
import { useRouter, useParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, CircleDashed, Crosshair } from "lucide-react";
import { Button } from "@/components/ui";
import type { V1Assessment } from "@/lib/plan";
import { LANDMARK_GUIDE, LANDMARK_INFO, LANDMARK_ORDER } from "@/lib/data/landmark_guide";
import {
  MEASURE_INFO,
  MEASURE_ORDER,
  type AssessmentReading,
  type MeasureKey,
} from "@/lib/data/assessment_geometry";
import type { Advice } from "@/lib/data/fit_advice";
import { AdviceCard, ScalePanel } from "../components/FitPanels";
import type { ScanCalibration } from "../components/useScanCalibration";
import c from "../components/planControls.module.css";
import type { LandmarkState } from "./AssessmentWorkspace";

type Key = keyof LandmarkState;

interface MeasurementPanelProps {
  landmarks: LandmarkState;
  reading: AssessmentReading;
  /** Values already saved with the plan, shown instead of a measurement while nothing has been changed. */
  stored?: V1Assessment;
  placing: Key | null;
  onStartPlacing: (key: Key | null) => void;
  calibration: ScanCalibration;
  isAccepted: boolean;
  isReadOnly: boolean;
  /** Why it is read-only: the whole plan is locked, or Continue already locked the assessment (V1). */
  lockedBy?: "plan" | "continue";
  /** Both scans have a verified scale. V1 requires radio-opaque calibration before measuring on. */
  scalesVerified: boolean;
  kneeSide: "RIGHT" | "LEFT";
  onReset: () => void;
  onUnlock: () => void;
  /** Saves the assessment; resolves to whether the server accepted it. */
  onAccept: () => Promise<boolean>;
}

const STORED_VALUE: Record<MeasureKey, (a: V1Assessment) => number> = {
  mad: (a) => a.MAD_mm,
  mhka: (a) => a.mHKA_deg,
  mpta: (a) => a.MPTA_deg,
  ldfa: (a) => a.LDFA_deg,
  ama: (a) => a.AMA_deg,
  pts: (a) => a.PTS_deg,
};

const POINT_WORD = (n: number) => (n === 1 ? "1 point" : `${n} points`);

export function MeasurementPanel({
  landmarks,
  reading,
  stored,
  placing,
  onStartPlacing,
  calibration,
  isAccepted,
  isReadOnly,
  lockedBy,
  scalesVerified,
  kneeSide,
  onReset,
  onUnlock,
  onAccept,
}: MeasurementPanelProps) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const total = LANDMARK_ORDER.length;
  const missing = reading.missing;
  const placed = total - missing.length;
  const showingSaved = Boolean(stored);
  const canContinue = isReadOnly || (showingSaved ? scalesVerified : reading.complete && scalesVerified);
  const planId = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";

  const goNext = () => router.push(`/plan/${planId}/tibial`);

  const handleContinue = () => {
    if (isReadOnly || showingSaved) return goNext();
    setError(null);
    startTransition(async () => {
      const ok = await onAccept();
      if (ok) goNext();
      else setError("The assessment could not be saved. Try again.");
    });
  };

  // What to do next, in one card.
  let advice: Advice;
  if (isReadOnly) {
    advice =
      lockedBy === "continue"
        ? { tone: "none", step: 1, headline: "Assessment locked", detail: "Continuing to Tibial Planning locked these values (V1). Start a new plan to measure again." }
        : { tone: "none", step: 1, headline: "This plan is locked", detail: "These are the values it was sealed with." };
  } else if (showingSaved) {
    advice = {
      tone: "none",
      step: 1,
      headline: "Showing the saved measurements",
      detail: `Place all ${total} points to measure again, or continue with these.`,
    };
  } else if (placing) {
    const info = LANDMARK_INFO[placing];
    advice = {
      tone: "none",
      step: 1,
      headline: `Point ${placed + (landmarks[placing] ? 0 : 1)} of ${total}: ${info.name}`,
      detail: `${info.where} Click it on the scan.`,
    };
  } else if (missing.length > 0) {
    advice = {
      tone: "warn",
      step: 1,
      headline: `${POINT_WORD(missing.length)} still to place`,
      detail: "Each measurement appears once the points it needs are placed.",
    };
  } else if (reading.loading) {
    advice = { tone: "none", step: 1, headline: "Loading the scans…", detail: "Measurements appear as soon as both scans are ready." };
  } else if (Object.values(reading.measures).some((m) => m.check)) {
    advice = {
      tone: "warn",
      step: 1,
      headline: "A value looks unusual",
      detail: "One of the numbers is far from a usual knee. Check the points marked below before continuing.",
    };
  } else {
    advice = {
      tone: "pass",
      step: 1,
      headline: "All points placed",
      detail: "Look over the lines on both scans. Drag any dot to adjust it, then continue.",
    };
  }

  const measureText = (key: MeasureKey): string | null => {
    const info = MEASURE_INFO[key];
    if (stored) {
      const v = STORED_VALUE[key](stored);
      return `${v.toFixed(1)}${info.unit === "mm" ? " mm" : "°"}`;
    }
    const v = reading.measures[key].value;
    if (v === undefined) return null;
    if (key === "mad") {
      return `${v.toFixed(1)} mm${reading.mad_direction ? ` ${reading.mad_direction}` : ""}${reading.scale_estimated ? " (est.)" : ""}`;
    }
    return `${v.toFixed(1)}°`;
  };

  const alignment = stored ? stored.alignment_type : reading.alignment_type;
  const hka = stored ? stored.mHKA_deg : reading.measures.mhka.value;

  const groups = [
    { view: "FLAP" as const, title: "AP scan (full leg)" },
    { view: "KLAT" as const, title: "Lateral scan (knee)" },
  ];

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
        <h3 style={{ margin: 0, fontSize: "var(--t-h3)", fontWeight: 700, color: "var(--ink)" }}>Measure the leg</h3>
        {isAccepted && <span className={c.confirmed}>CONFIRMED</span>}
      </div>

      <AdviceCard advice={advice} />

      {!isReadOnly && !isAccepted && (
        <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
          {placing ? (
            <Button variant="secondary" size="sm" onClick={() => onStartPlacing(null)}>
              Stop placing
            </Button>
          ) : missing.length > 0 ? (
            <Button variant="primary" size="sm" onClick={() => onStartPlacing(missing[0] as Key)}>
              <Crosshair size={14} aria-hidden="true" /> Place the next point
            </Button>
          ) : null}
        </div>
      )}

      <section aria-label="Measurements">
        <h4 className={c.sectionLabel} style={{ marginBottom: "var(--s-2)" }}>Measurements</h4>
        <ul className={c.resultList}>
          {MEASURE_ORDER.map((key) => {
            const info = MEASURE_INFO[key];
            const text = measureText(key);
            const m = reading.measures[key];
            return (
              <li key={key} className={c.resultRow} title={info.plain}>
                <span className={c.resultName}>
                  <strong>{info.short}</strong>
                  <span>{info.name}</span>
                </span>
                <span className={c.resultValue}>
                  {text ? (
                    <>
                      <strong>{text}</strong>
                      <small>usual: {info.usual}</small>
                    </>
                  ) : (
                    <>
                      <strong className={c.resultNone}>—</strong>
                      <small>needs {m.missing.length > 0 ? POINT_WORD(m.missing.length) : "a loaded scan"}</small>
                    </>
                  )}
                  {m.check && !isReadOnly && (
                    <small className={c.resultCheck}>
                      <AlertTriangle size={11} aria-hidden="true" /> {m.check}
                    </small>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        {alignment && hka !== undefined && (
          <p className={c.resultSummary}>
            <strong>
              {alignment === "NEUTRAL" ? "Neutral alignment" : `${hka.toFixed(1)}° ${alignment === "VARUS" ? "varus" : "valgus"}`}
            </strong>
            {!isReadOnly && reading.alignment_basis === "knee_side" && (
              <span>
                {" "}
                · worked out from the {kneeSide.toLowerCase()} knee on a standard view. Place the outer and inner edge points to
                confirm it.
              </span>
            )}
          </p>
        )}
      </section>

      <ScalePanel
        scales={calibration.scales}
        calibration={calibration}
        readOnly={isAccepted || isReadOnly}
        accepted={true}
        onAccept={() => {}}
        showAccept={false}
        compact
      />

      {!isReadOnly && (
        <details className={c.how}>
          <summary className={c.howSummary}>
            All points ({placed}/{total})
          </summary>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)", paddingTop: "var(--s-2)" }}>
            {groups.map((group) => (
              <div key={group.view}>
                <h5 className={c.sectionLabel} style={{ marginBottom: "var(--s-1)" }}>{group.title}</h5>
                <ul className={c.markerList}>
                  {LANDMARK_GUIDE.filter((l) => l.view === group.view).map((l) => {
                    const isPlaced = Boolean(landmarks[l.key as Key]);
                    return (
                      <li key={l.key} className={c.markerRow} title={`${l.where} Used for: ${l.feeds}`}>
                        {isPlaced ? (
                          <CheckCircle2 size={15} className={c.markerOk} aria-hidden="true" />
                        ) : (
                          <CircleDashed size={15} className={c.markerTodo} aria-hidden="true" />
                        )}
                        <span className={c.markerName}>
                          <span aria-hidden="true" style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: l.color, marginRight: 6 }} />
                          {l.name}
                        </span>
                        {!isAccepted && (
                          <button type="button" className={c.markerBtn} aria-pressed={placing === l.key} onClick={() => onStartPlacing(l.key as Key)}>
                            <Crosshair size={13} aria-hidden="true" />
                            {placing === l.key ? "Click the scan…" : isPlaced ? "Move" : "Place"}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--s-2)", paddingTop: "var(--s-3)" }}>
        {error && (
          <p role="alert" className={c.markerWarn}>
            <AlertTriangle size={13} aria-hidden="true" /> {error}
          </p>
        )}
        {!isReadOnly && !canContinue && (
          <ul className={c.blockers} aria-label="What is needed before continuing">
            {missing.length > 0 && !showingSaved ? (
              <li>Place the remaining {POINT_WORD(missing.length)}.</li>
            ) : reading.loading && !showingSaved ? (
              <li>Waiting for the scans to load.</li>
            ) : null}
            {!scalesVerified && <li>Verify the scale of both scans (radio-opaque 25 mm marker) — V1 requires calibration.</li>}
          </ul>
        )}
        <Button
          variant="primary"
          onClick={handleContinue}
          disabled={isPending || !canContinue}
          style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}
        >
          {isPending ? "Saving…" : "Continue to Tibial Planning →"}
        </Button>
        {!isReadOnly && (
          <Button
            variant="secondary"
            onClick={() => {
              if (isAccepted) return onUnlock();
              if (placed === 0 || window.confirm(`Remove all ${placed} placed points and start again?`)) onReset();
            }}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {isAccepted ? "Unlock & adjust points" : "Start over"}
          </Button>
        )}
      </div>
    </div>
  );
}
