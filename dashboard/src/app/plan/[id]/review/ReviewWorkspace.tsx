"use client";

import { resolvePatientIdentity } from "@/lib/data/planner_identity";
import { buildV1VrPayload } from "@/lib/data/vr_payload";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, Lock, AlertCircle } from "lucide-react";
import { sealTkrPlan } from "@/app/actions";
import { Badge, Banner, Button, Select, type BadgeStatus } from "@/components/ui";
import { planOperativeSide, type PlanDetail, type V1VrPayload } from "@/lib/plan";
import { SCAN_VIEW_NAME, resolvePlanScales } from "@/lib/data/scan_scale";
import {
  MEASURE_INFO,
  MEASURE_NEEDS,
  MEASURE_ORDER,
  RANGE_TIER_INFO,
  formatMeasure,
  madSideFromAlignment,
  rangeTier,
  storedMeasure,
} from "@/lib/data/assessment_geometry";
import { notchingLikely } from "@/lib/data/tkr_templates";
import r from "./review.module.css";
import { SendToHeadset } from "./SendToHeadset";
import { missingSetup, type HeadsetLink } from "@/lib/headset-link";

/** The fit verdict as the app's tri-state status, so it carries an icon and a label like every other verdict. */
function fitStatus(status?: string): BadgeStatus {
  if (status === "ACCEPTABLE FIT") return "pass";
  if (status === "POOR FIT") return "fail";
  return "warn";
}

export function ReviewWorkspace({ plan, headset }: { plan: PlanDetail; headset?: HeadsetLink }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sealError, setSealError] = useState<string | null>(null);
  const [design, setDesign] = useState("");
  const [fixation, setFixation] = useState("");

  const isLocked = plan.isReadyForVr || plan.lockedVersion !== undefined;
  // The headset's run settings are frozen with the plan, so a stored plan that never recorded them is asked
  // for them here, never defaulted. (A built-in practice plan is never sent to a headset, so it is not asked.)
  const needsSetup = plan.persisted ? missingSetup(plan.payload.session_config) : [];
  const setupChosen = needsSetup.every((key) => (key === "implant_design" ? design : fixation) !== "");

  // What was actually measured. Nothing is filled in when the assessment has not been done.
  const assessment = plan.lockedVersion?.payload.v1_assessment || plan.payload.v1_assessment;

  // Derive tibial values
  const tibial = plan.lockedVersion?.payload.v1_tibial || plan.payload.v1_tibial;

  // Derive femoral values
  const femoral = plan.lockedVersion?.payload.v1_femoral || plan.payload.v1_femoral;

  // Determine if plan is actually complete
  const isTibialComplete = tibial && tibial.is_confirmed;
  const isFemoralComplete = femoral && femoral.is_confirmed;
  // A plan goes to the headset only on scales somebody verified. An estimate is fine for exploring a
  // plan, never for sealing one.
  const scanScales = resolvePlanScales(plan);
  const unverifiedViews = (["FLAP", "KLAT"] as const).filter((v) => !scanScales[v].calibrated);
  const isCalibrationValid = unverifiedViews.length === 0 || isLocked;

  const canSealPlan = Boolean(assessment) && isTibialComplete && isFemoralComplete && isCalibrationValid;

  // One list of what is still needed, each with the place to fix it.
  const checks: { label: string; done: boolean; href: string }[] = [
    { label: "Leg measured", done: Boolean(assessment), href: `/plan/${plan.id}/assessment` },
    { label: "Tibial tray confirmed", done: Boolean(isTibialComplete), href: `/plan/${plan.id}/tibial` },
    { label: "Femoral component confirmed", done: Boolean(isFemoralComplete), href: `/plan/${plan.id}/femoral` },
    {
      label: isCalibrationValid ? "Scan scales verified" : `Scan scale not verified (${unverifiedViews.map((v) => SCAN_VIEW_NAME[v]).join(", ")})`,
      done: isCalibrationValid,
      href: `/plan/${plan.id}/assessment`,
    },
  ];

  const identity = resolvePatientIdentity(plan.caseId, plan.case.patient);
  const kneeSide = planOperativeSide(plan);

  // Exact V1 VR Payload schema matching Pages 6-7 of PDF
  const vrPayload: V1VrPayload | null =
    plan.lockedVersion?.payload.v1_vr_payload ||
    plan.payload.v1_vr_payload ||
    (canSealPlan && assessment && kneeSide
      ? buildV1VrPayload({ patientId: identity.patientId, kneeSide, assessment, tibial: tibial!, femoral: femoral! })
      : null);

  const handleConfirmLock = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("planId", plan.id);
      if (needsSetup.includes("implant_design")) formData.set("implant_design", design);
      if (needsSetup.includes("fixation")) formData.set("fixation", fixation);
      const result = await sealTkrPlan({}, formData);
      if (result.error) {
        setSealError(result.error);
        return;
      }
      setShowModal(false);
      window.location.reload();
    });
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(vrPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sealedAt = plan.lockedVersion?.sealedAt
    ? `Sealed ${plan.lockedVersion.sealedAt.slice(0, 16).replace("T", " ")} UTC. `
    : "";

  return (
    <div className={r.workspace}>
      {!isLocked && (
        <section aria-label="Ready to lock?" className={r.ready}>
          <strong className={r.readyTitle}>{canSealPlan ? "Ready to lock" : "Not ready to lock yet"}</strong>
          {checks.map((check) => (
            <span key={check.label} className={r.check}>
              {check.done ? (
                <CheckCircle2 className={r.checkDone} width={15} height={15} aria-hidden="true" />
              ) : (
                <AlertCircle className={r.checkOpen} width={15} height={15} aria-hidden="true" />
              )}
              {check.done ? (
                <span>{check.label}</span>
              ) : (
                <Link href={check.href} className={r.checkLink}>
                  {check.label}
                </Link>
              )}
            </span>
          ))}
        </section>
      )}

      {/* Three summary cards */}
      <div className={r.summary}>
        {/* Card 1: Patient & Radiographs */}
        <div className={r.card}>
          <div className={r.cardHead}>
            <span className={r.eyebrow}>Patient & scans</span>
            <h3 className={r.cardTitle}>{plan.case.title}</h3>
          </div>

          <div className={r.rows}>
            <div className={r.row}>
              <span className={r.rowLabel}>Patient ID:</span>
              <strong className={r.rowValue}>{vrPayload?.patient_id ?? plan.caseId}</strong>
            </div>
            <div className={r.row}>
              <span className={r.rowLabel}>Operative Knee:</span>
              <span className={r.side}>{kneeSide ? `${kneeSide} KNEE` : "SIDE NOT RECORDED"}</span>
            </div>
            <div className={r.row}>
              <span className={r.rowLabel}>Procedure:</span>
              <span>Primary Total Knee Arthroplasty</span>
            </div>
            <div className={r.row}>
              <span className={r.rowLabel}>Calibration Marker:</span>
              <span className={`${r.rowValue} ${r.mono}`}>
                {`AP ${scanScales.FLAP.mmPerPx.toFixed(3)} · Lateral ${scanScales.KLAT.mmPerPx.toFixed(3)} mm/px`}
                {unverifiedViews.length > 0 && !isLocked ? " (estimated)" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Assessment Measurements */}
        <div className={r.card}>
          <div className={r.cardHead}>
            <span className={r.eyebrow}>Measurements</span>
            <h3 className={r.cardTitle}>Leg measurements</h3>
          </div>

          {assessment ? (
            <>
              {(() => {
                const dir = assessment.alignment_type === "VALGUS" ? "Valgus" : assessment.alignment_type === "VARUS" ? "Varus" : "";
                const madSide = madSideFromAlignment(assessment.alignment_type);
                const groups = (["FLAP", "KLAT"] as const).map((view) => ({
                  title: view,
                  rows: MEASURE_ORDER.filter((key) => MEASURE_NEEDS[key].view === view).map((key) => {
                    const value = storedMeasure(assessment, key);
                    if (value === undefined) return { key, label: MEASURE_INFO[key].short, value: "Not recorded", tier: undefined };
                    return {
                      key,
                      label: MEASURE_INFO[key].short,
                      value: `${formatMeasure(key, value, { madSide })}${key === "mhka" && dir ? ` ${dir}` : ""}`,
                      tier: RANGE_TIER_INFO[rangeTier(key, value, madSide)],
                    };
                  }),
                }));
                return (
                  <div className={r.groups}>
                    {groups.map((g) => (
                      <div key={g.title} className={r.group}>
                        <span className={r.groupTitle}>{g.title}:</span>
                        {g.rows.map((row) => (
                          <div key={row.key} className={r.row}>
                            <span className={r.rowLabel}>• {row.label}</span>
                            <span className={r.measure}>
                              <strong className={r.mono}>{row.value}</strong>
                              {row.tier && (
                                <span className={r.tier} style={{ color: `var(--${row.tier.tone})` }}>
                                  {row.tier.label}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className={r.note}>
                {assessment.alignment_type === "NEUTRAL"
                  ? "Neutral alignment"
                  : `${assessment.mHKA_deg.toFixed(1)}° ${assessment.alignment_type === "VALGUS" ? "valgus" : "varus"} deformity`}
                {assessment.scale_estimated ? " · MAD uses an estimated scale" : ""}
              </div>
            </>
          ) : (
            <div className={r.missing}>
              Not measured yet.
              <Link href={`/plan/${plan.id}/assessment`}>Go to the assessment</Link>
            </div>
          )}
        </div>

        {/* Card 3: Component Selections & Fit */}
        <div className={r.card}>
          <div className={r.cardHead}>
            <span className={r.eyebrow}>Implants</span>
            <h3 className={r.cardTitle}>Size and fit</h3>
          </div>

          <div className={r.implants}>
            {/* Tibial Summary */}
            <div className={r.implant}>
              {tibial ? (
                <>
                  <div className={r.implantHead}>
                    <strong>Tibial Baseplate: Size {tibial.implant_size}</strong>
                    {tibial.fit_status && <Badge status={fitStatus(tibial.fit_status)}>{tibial.fit_status}</Badge>}
                  </div>
                  <div className={r.implantMuted}>
                    Placed {tibial.position_2d.x_offset_mm.toFixed(1)} mm sideways, {tibial.position_2d.y_offset_mm.toFixed(1)} mm front/back, turned {tibial.position_2d.rotation_deg.toFixed(1)}°
                  </div>
                  <div className={r.row}>
                    <span>Coverage: <strong>{tibial.cortical_coverage_pct?.toFixed(1) ?? "--"}%</strong></span>
                    <span>Overhang: inner {tibial.medial_overhang_mm?.toFixed(1) ?? "--"} mm / outer {tibial.lateral_overhang_mm?.toFixed(1) ?? "--"} mm</span>
                  </div>
                </>
              ) : (
                <div className={r.missing}>Tibial Planning Incomplete</div>
              )}
            </div>

            {/* Femoral Summary */}
            <div className={r.implant}>
              {femoral ? (
                <>
                  <div className={r.implantHead}>
                    <strong>Femoral Component: Size {femoral.implant_size}</strong>
                    {femoral.fit_status && <Badge status={fitStatus(femoral.fit_status)}>{femoral.fit_status}</Badge>}
                  </div>
                  <div className={r.implantMuted}>
                    Placed {femoral.position_2d.x_offset_mm.toFixed(1)} mm sideways, {femoral.position_2d.y_offset_mm.toFixed(1)} mm front/back, tilted {femoral.position_2d.rotation_deg.toFixed(1)}° (AP), flexed {(femoral.position_2d.flexion_deg ?? 0).toFixed(1)}° (lateral)
                  </div>
                  <div className={r.row}>
                    <span>Depth covered: <strong>{femoral.ap_coverage_pct?.toFixed(1) ?? "--"}%</strong></span>
                    <span>
                      Gap at the front: <strong>{femoral.notching_risk_mm === 0 ? "0.0 mm (flush)" : `${femoral.notching_risk_mm} mm`}</strong>
                      {femoral.notching_risk_mm !== undefined && ` · potential notching: ${notchingLikely(femoral.notching_risk_mm) ? "yes" : "no"}`}
                    </span>
                  </div>
                </>
              ) : (
                <div className={r.missing}>Femoral Planning Incomplete</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sealed plan: the one dark focal element on the page, then the headset link on a light card. */}
      {isLocked ? (
        <div className={r.sealed}>
          <Banner tone="brand" title="Plan locked">
            {sealedAt}The 2D plan is now read-only. The headset receives exactly this sealed version.
          </Banner>

          {headset && <SendToHeadset planId={plan.id} initial={headset} />}

          <div className={r.next}>
            <strong className={r.nextTitle}>What happens next</strong>
            <ol className={r.nextList}>
              <li>Your plan is sealed. It can no longer be edited.</li>
              <li>Get a code above and type it on the headset. The headset loads this plan.</li>
              <li>
                Perform the operation. The score appears under <Link href="/sessions">Sessions</Link>, with a report for each run.
              </li>
            </ol>
          </div>

          {/* Viewable VR Payload JSON */}
          <div className={r.payload}>
            <div className={r.payloadHead}>
              <span className={r.eyebrow}>V1 VR transfer payload (pages 6-7 PDF contract)</span>
              <Button variant="ghost" size="sm" icon={Copy} onClick={handleCopyJson}>
                {copied ? "Copied!" : "Copy JSON"}
              </Button>
            </div>
            <pre className={r.payloadPre}>{JSON.stringify(vrPayload, null, 2)}</pre>
          </div>
        </div>
      ) : null}

      {/* Action Navigation Footer */}
      <div className={r.footer}>
        <span className={r.backLinks}>
          <span className={r.backLabel}>
            <ArrowLeft width={16} height={16} aria-hidden="true" />
            Back to Planning:
          </span>
          {/* V1: "Allows returning to Page 2 or 3 to modify component sizes" (Assessment is locked). */}
          <Link href={`/plan/${plan.id}/tibial`}>Tibial</Link>
          <Link href={`/plan/${plan.id}/femoral`}>Femoral</Link>
        </span>

        <div className={r.footerActions}>
          {!isLocked ? (
            <>
              {/* A disabled button always says what is missing, in plain sight. */}
              {!canSealPlan && (
                <span className={r.footerHint}>
                  {unverifiedViews.length > 0
                    ? `The ${unverifiedViews.map((v) => SCAN_VIEW_NAME[v]).join(" and ")} scan scale is not verified. Verify it on the Assessment page with the radio-opaque marker.`
                    : "Finish the checks above to lock the plan."}
                </span>
              )}
              <Button
                variant="primary"
                icon={Lock}
                onClick={() => setShowModal(true)}
                disabled={!canSealPlan}
              >
                Lock plan
              </Button>
            </>
          ) : (
            <>
              <Button variant="secondary" href={plan.case.isPersonalCase ? `/personal-cases/${plan.caseId}` : `/cases/${plan.caseId}`}>
                Back to case
              </Button>
              <Button variant="secondary" href="/plans">
                All pre-op plans
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Lock Confirmation Modal */}
      {showModal && (
        <div className={r.lockScrim}>
          <div className={r.lockPanel} role="dialog" aria-modal="true" aria-labelledby="lock-plan-title">
            <div className={r.lockHead}>
              <div className={r.lockIcon}>
                <Lock width={20} height={20} aria-hidden="true" />
              </div>
              <h3 className={r.lockTitle} id="lock-plan-title">
                Lock Preoperative Plan?
              </h3>
            </div>

            <p className={r.lockText}>
              Once locked, parameters cannot be modified in 2D software.
              <br />
              The plan is formatted into the V1 VR payload. Locking does not send it: you get a code for the headset afterwards.
            </p>

            {needsSetup.length > 0 && (
              <div className={r.lockChoices}>
                <p className={r.lockText}>
                  This plan never recorded how the headset should run it. Choose now: these are locked with the plan.
                </p>
                {needsSetup.includes("implant_design") && (
                  <Select label="Implant design" required value={design} onChange={(e) => setDesign(e.target.value)} className={r.headsetField}>
                    <option value="" disabled>
                      Choose…
                    </option>
                    <option value="CR">CR (cruciate-retaining)</option>
                    <option value="PS">PS (posterior-stabilised)</option>
                  </Select>
                )}
                {needsSetup.includes("fixation") && (
                  <Select label="Fixation" required value={fixation} onChange={(e) => setFixation(e.target.value)} className={r.headsetField}>
                    <option value="" disabled>
                      Choose…
                    </option>
                    <option value="cemented">Cemented</option>
                    <option value="cementless">Cementless</option>
                  </Select>
                )}
              </div>
            )}

            {sealError && (
              <p role="alert" className={r.lockError}>{sealError}</p>
            )}

            <div className={r.lockActions}>
              <Button variant="secondary" onClick={() => { setSealError(null); setShowModal(false); }} disabled={isPending}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmLock} disabled={isPending || !setupChosen}>
                {isPending ? "Locking..." : "Confirm & lock"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
