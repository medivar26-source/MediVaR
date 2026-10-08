"use client";

import { AlertTriangle, CheckCircle2, CircleDashed, Crosshair, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import type { V1FitMarkers } from "@/lib/plan";
import type { FitTone } from "@/lib/data/tkr_templates";
import { ADVICE_STEPS, type Advice } from "@/lib/data/fit_advice";
import { SCAN_VIEW_NAME, describeScale, type ScanScale, type ScanView } from "@/lib/data/scan_scale";
import type { ScanCalibration } from "./useScanCalibration";
import {
  MARKER_KEYS,
  MARKER_LABEL,
  MARKER_VIEW,
  allMarkersPlaced,
  type BoneModel,
  type MarkerKey,
} from "@/lib/data/fit_markers";
import c from "./planControls.module.css";

const TONE_ICON = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle } as const;
const TONE_WORD = { pass: "within target", warn: "borderline", fail: "outside target" } as const;

/**
 * Step 1 of the fit: mark the four bone edges. Everything below it in the panel is measured against
 * these, so the checklist says plainly what is missing and what the marks measure.
 */
export function MarkerChecklist({
  markers,
  bone,
  placing,
  readOnly,
  onPlace,
  onConfirm,
}: {
  markers: V1FitMarkers;
  bone: BoneModel;
  placing: MarkerKey | null;
  readOnly: boolean;
  onPlace: (key: MarkerKey) => void;
  onConfirm: () => void;
}) {
  const allPlaced = allMarkersPlaced(markers);
  const confirmed = Boolean(markers.confirmed) && allPlaced;

  return (
    <section className={c.markerBox} aria-label="Bone edge markers">
      <div className={c.markerHead}>
        <h4 className={c.sectionLabel}>1 · Mark the bone edges</h4>
        {confirmed && <span className={c.confirmed}>MARKERS CONFIRMED</span>}
      </div>

      <ul className={c.markerList}>
        {MARKER_KEYS.map((key) => {
          const placed = Boolean(markers[key]);
          const active = placing === key;
          return (
            <li key={key} className={c.markerRow}>
              {placed ? (
                <CheckCircle2 size={15} className={c.markerOk} aria-hidden="true" />
              ) : (
                <CircleDashed size={15} className={c.markerTodo} aria-hidden="true" />
              )}
              <span className={c.markerName}>
                {MARKER_LABEL[key]}
                <span className={c.markerView}>{MARKER_VIEW[key] === "FLAP" ? "AP scan" : "Lateral scan"}</span>
              </span>
              {!readOnly && (
                <button
                  type="button"
                  className={c.markerBtn}
                  aria-pressed={active}
                  onClick={() => onPlace(key)}
                >
                  <Crosshair size={13} aria-hidden="true" />
                  {active ? "Click the scan…" : placed ? "Move" : "Place"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {bone.mlMm !== undefined || bone.apMm !== undefined ? (
        <p className={c.markerMeasure}>
          Bone width <strong>{bone.mlMm !== undefined ? `${bone.mlMm.toFixed(1)} mm` : "—"}</strong>
          {" · "}
          depth <strong>{bone.apMm !== undefined ? `${bone.apMm.toFixed(1)} mm` : "—"}</strong>
        </p>
      ) : null}

      {bone.scaleEstimated && (
        <p className={c.markerWarn} role="note">
          <AlertTriangle size={13} aria-hidden="true" />
          This scan has no verified 25 mm calibration, so millimetres are estimates.
        </p>
      )}
      {bone.warnings.map((w) => (
        <p key={w} className={c.markerWarn} role="note">
          <AlertTriangle size={13} aria-hidden="true" />
          {w}
        </p>
      ))}

      {!readOnly && (
        <Button
          variant={confirmed ? "secondary" : "primary"}
          size="sm"
          disabled={!allPlaced || confirmed}
          onClick={onConfirm}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {confirmed ? "Markers confirmed" : allPlaced ? "These edges are right" : "Place all four edges first"}
        </Button>
      )}
    </section>
  );
}

export type SizeRowView = {
  size: number;
  summary: string;
  tone: FitTone;
};

/** Every size at a glance, measured against the marked bone with the implant centred on it. */
export function SizeTable({
  rows,
  selected,
  recommended,
  disabled,
  onSelect,
}: {
  rows: SizeRowView[];
  selected: number;
  recommended?: number;
  disabled: boolean;
  onSelect: (size: number) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <div className={c.sizeTable} role="group" aria-label="Fit by implant size">
      {rows.map((row) => {
        const Icon = TONE_ICON[row.tone];
        const isSelected = row.size === selected;
        return (
          <button
            key={row.size}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            onClick={() => onSelect(row.size)}
            className={`${c.sizeRow} ${isSelected ? c.sizeRowOn : ""}`}
          >
            <span className={c.sizeRowName}>
              Size {row.size}
              {row.size === recommended && <span className={c.sizeBest}>Best fit</span>}
            </span>
            <span className={c.sizeRowSummary}>{row.summary}</span>
            <span className={`${c.sizeRowTone} ${c[`tone-${row.tone}`]}`}>
              <Icon size={14} aria-hidden="true" />
              <span className="srOnly">{TONE_WORD[row.tone]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** A number with no approved limit: shown, never judged. */
export function EdgeReadout({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className={c.edgeRow}>
      <span className={c.gaugeLabel}>{label}</span>
      <span className={c.edgeValue}>
        {value}
        {note && <span className={c.edgeNote}>{note}</span>}
      </span>
    </div>
  );
}

/** Why Confirm is still locked, as a short list the surgeon can act on. */
export function ConfirmBlockers({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) return null;
  return (
    <ul className={c.blockers} aria-label="What is needed before this can be confirmed">
      {reasons.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  );
}

/** The four steps. The current one is shown below; any step that is unlocked can be returned to. */
export function FitStepper({
  current,
  onPick,
  unlocked = 4,
}: {
  current: number;
  onPick: (step: 1 | 2 | 3 | 4) => void;
  /** The highest step that can be opened. Later steps need the bone edges confirmed. */
  unlocked?: number;
}) {
  return (
    <ol className={c.stepper} aria-label="Steps">
      {ADVICE_STEPS.map(({ step, label }) => {
        const done = step < current;
        const on = step === current;
        const locked = step > unlocked;
        return (
          <li key={step} className={`${c.stepperItem} ${on ? c.stepperOn : ""} ${done ? c.stepperDone : ""}`}>
            <button
              type="button"
              className={c.stepperBtn}
              disabled={locked}
              aria-current={on ? "step" : undefined}
              title={locked ? "Mark and confirm the four bone edges first" : label}
              onClick={() => onPick(step)}
            >
              <span className={c.stepperDot} aria-hidden="true">
                {done ? <CheckCircle2 size={14} /> : step}
              </span>
              <span className={c.stepperLabel}>{label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** The one button that moves on to the next step. */
export function StepNav({ label, disabled, onClick, hint }: { label: string; disabled?: boolean; onClick: () => void; hint?: string }) {
  return (
    <div className={c.stickyActions}>
      {hint && <p className={c.hint}>{hint}</p>}
      <Button variant="primary" onClick={onClick} disabled={disabled} style={{ width: "100%", justifyContent: "center", fontWeight: 700 }}>
        {label}
      </Button>
    </div>
  );
}

export type SummaryRow = {
  label: string;
  value: string;
  tone?: FitTone;
  note?: string;
  /** "v1" rows are metrics the V1 specification defines; "project" rows are rules this project added. */
  group?: "v1" | "project";
};

/**
 * The fit numbers. V1's own metrics come first; anything the project added on top is listed under a
 * separate heading so it is never mistaken for a V1 requirement. `cautions` carries the PDF's exact
 * caution text (e.g. "CAUTION: Medial Overhang > 1.5mm").
 */
export function FitSummary({ rows, cautions = [] }: { rows: SummaryRow[]; cautions?: string[] }) {
  const v1 = rows.filter((r) => r.group !== "project");
  const project = rows.filter((r) => r.group === "project");
  const list = (items: SummaryRow[], label: string) => (
    <ul className={c.sumList} aria-label={label}>
      {items.map((row) => {
        const Icon = row.tone ? TONE_ICON[row.tone] : null;
        return (
          <li key={row.label} className={c.sumRow}>
            <span className={`${c.sumIcon} ${row.tone ? c[`tone-${row.tone}`] : ""}`}>{Icon ? <Icon size={14} aria-hidden="true" /> : null}</span>
            <span className={c.sumLabel}>{row.label}</span>
            <span className={c.sumValue}>
              {row.value}
              {row.note && <small>{row.note}</small>}
            </span>
          </li>
        );
      })}
    </ul>
  );
  return (
    <>
      <h4 className={c.sectionLabel} style={{ margin: 0 }}>Fit metrics</h4>
      {list(v1, "Fit numbers")}
      {cautions.map((text) => (
        <p key={text} role="alert" className={c.markerWarn} data-fit-caution>
          {text}
        </p>
      ))}
      {project.length > 0 && (
        <>
          <h4 className={c.sectionLabel} style={{ margin: 0 }} title="Not part of the V1 specification; engineering or project rules that need clinical approval.">
            Project rules (not in V1)
          </h4>
          {list(project, "Project-rule fit numbers")}
        </>
      )}
    </>
  );
}

export function AdviceCard({ advice }: { advice: Advice }) {
  const tone = advice.tone;
  const Icon = tone === "pass" ? CheckCircle2 : tone === "warn" ? AlertTriangle : tone === "fail" ? XCircle : Info;
  return (
    <div className={`${c.advice} ${c[`advice-${tone}`]}`} role="status" aria-live="polite">
      <Icon size={18} className={c.adviceIcon} aria-hidden="true" />
      <div>
        <p className={c.adviceHead}>{advice.headline}</p>
        <p className={c.adviceBody}>{advice.detail}</p>
      </div>
    </div>
  );
}

/**
 * The scale of each scan, whether it can be trusted, and how to fix it. Implant sizes are only as
 * right as this: a scale that is 3x off draws a 3x-wrong implant, so this sits above everything else.
 */
export function ScalePanel({
  scales,
  calibration,
  readOnly,
  accepted,
  onAccept,
  showAccept = true,
  compact = false,
}: {
  scales: Record<ScanView, ScanScale>;
  calibration: ScanCalibration;
  readOnly: boolean;
  accepted: boolean;
  onAccept: (accepted: boolean) => void;
  /** The estimate toggle only matters where something is being confirmed. */
  showAccept?: boolean;
  /** Once both scales are verified there is nothing to do here, so it shrinks to a single line. */
  compact?: boolean;
}) {
  const views: ScanView[] = ["FLAP", "KLAT"];
  const anyUnverified = views.some((v) => !scales[v].calibrated);

  if (compact && !anyUnverified && !calibration.calibrating) {
    return (
      <p className={c.scaleOk} aria-label="Scan scale">
        <CheckCircle2 size={14} className={c.markerOk} aria-hidden="true" />
        Scale verified · AP {scales.FLAP.mmPerPx.toFixed(3)} · lateral {scales.KLAT.mmPerPx.toFixed(3)} mm/px
      </p>
    );
  }

  return (
    <section className={c.scaleBox} aria-label="Scan scale">
      <h4 className={c.sectionLabel}>Scan scale</h4>
      <ul className={c.scaleList}>
        {views.map((view) => {
          const s = scales[view];
          const on = calibration.calibrating === view;
          return (
            <li key={view} className={c.scaleRow}>
              {s.calibrated ? (
                <CheckCircle2 size={15} className={c.markerOk} aria-hidden="true" />
              ) : (
                <AlertTriangle size={15} className={c.scaleWarn} aria-hidden="true" />
              )}
              <span className={c.scaleText}>
                <strong>{SCAN_VIEW_NAME[view][0].toUpperCase() + SCAN_VIEW_NAME[view].slice(1)} scan</strong>
                <span className={c.markerView}>{describeScale(s)}</span>
              </span>
              {!readOnly && (
                <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className={c.markerBtn}
                    onClick={() => calibration.findMarker(view)}
                    disabled={calibration.detection?.status === "searching"}
                    title="Look for the round radio-opaque marker and propose a scale. You confirm it."
                  >
                    {calibration.detection?.view === view && calibration.detection.status === "searching" ? "Searching…" : "Find marker"}
                  </button>
                  <button type="button" className={c.markerBtn} aria-pressed={on} onClick={() => calibration.startCalibrating(view)}>
                    <Crosshair size={13} aria-hidden="true" />
                    {on ? "Click the scan…" : s.calibrated ? "Re-measure" : "Set scale"}
                  </button>
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {calibration.calibrating && (
        <label className={c.knownRow}>
          <span>Marker size (mm)</span>
          <input
            type="number"
            min={1}
            step={0.5}
            value={calibration.knownMm}
            onChange={(e) => calibration.setKnownMm(Number(e.target.value))}
            className={c.knownInput}
          />
        </label>
      )}
      {calibration.detection && calibration.detection.status !== "searching" && (
        <div className={c.hint} role="status" data-marker-detection style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {calibration.detection.status === "found" ? (
            <>
              <span>
                Found a round bright object on the {SCAN_VIEW_NAME[calibration.detection.view]} scan, about{" "}
                <strong>{calibration.detection.candidate.diameterPx.toFixed(1)} px</strong> across (match {Math.round(calibration.detection.candidate.confidence * 100)}%). If it is the{" "}
                {calibration.knownMm} mm marker, the scale is{" "}
                <strong>{(calibration.knownMm / calibration.detection.candidate.diameterPx).toFixed(3)} mm/px</strong>. Check the yellow ring on the scan before using it.
              </span>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button type="button" className={c.markerBtn} onClick={calibration.confirmDetection} disabled={calibration.saving}>
                  Use this scale
                </button>
                <button type="button" className={c.markerBtn} onClick={calibration.dismissDetection}>
                  Not the marker
                </button>
              </span>
            </>
          ) : (
            <>
              <span>{calibration.detection.message}</span>
              <button type="button" className={c.markerBtn} onClick={calibration.dismissDetection} style={{ alignSelf: "flex-start" }}>
                OK
              </button>
            </>
          )}
        </div>
      )}
      {calibration.error && (
        <p className={c.markerWarn} role="alert">
          <AlertTriangle size={13} aria-hidden="true" />
          {calibration.error}
        </p>
      )}
      {!readOnly && anyUnverified && (
        <>
          <p className={c.hint}>
            Press “Find marker” to have the round 25 mm marker proposed, or “Set scale” and click its two opposite edges. Either way you confirm it.{compact ? "" : " Zoom in for a more exact click. Every size on screen follows from it."}
          </p>
          {showAccept && (
          <label className={c.acceptRow}>
            <input type="checkbox" checked={accepted} onChange={(e) => onAccept(e.target.checked)} />
            <span>Continue with the estimated scale (demo only)</span>
          </label>
          )}
        </>
      )}
    </section>
  );
}

/**
 * The verdict and the numbers behind it, over the scan itself, so the surgeon does not have to look
 * away from the implant to know whether it is sitting well.
 */
export function FitChip({ status, tone, lines }: { status?: string; tone?: FitTone; lines: string[] }) {
  if (!status || !tone) return null;
  const Icon = TONE_ICON[tone];
  const cls = tone === "pass" ? c.chipPass : tone === "warn" ? c.chipWarn : c.chipFail;
  return (
    <div className={`${c.chip} ${cls}`} role="status" data-fit-chip>
      <b>
        <Icon size={13} aria-hidden="true" style={{ verticalAlign: "-2px", marginRight: 4 }} />
        {status}
      </b>
      {lines.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  );
}
