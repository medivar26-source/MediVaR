"use client";

import { resolvePatientIdentity } from "@/lib/data/planner_identity";
import { buildV1VrPayload } from "@/lib/data/vr_payload";
import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, Lock, AlertCircle } from "lucide-react";
import { sealTkrPlan } from "@/app/actions";
import { Button } from "@/components/ui";
import type { PlanDetail, V1VrPayload } from "@/lib/plan";
import { SCAN_VIEW_NAME, resolvePlanScales } from "@/lib/data/scan_scale";

function fitStatusColor(status?: string): string {
  if (!status) return "#f59e0b";
  if (status === "ACCEPTABLE FIT") return "#10b981";
  if (status === "POOR FIT") return "#ef4444";
  return "#f59e0b";
}

export function ReviewWorkspace({ plan }: { plan: PlanDetail }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sealError, setSealError] = useState<string | null>(null);

  const isLocked = plan.isReadyForVr || plan.lockedVersion !== undefined;

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
  const kneeSide: "RIGHT" | "LEFT" = (plan.case.side || "right").toUpperCase() as "RIGHT" | "LEFT";

  // Exact V1 VR Payload schema matching Pages 6-7 of PDF
  const vrPayload: V1VrPayload | null =
    plan.lockedVersion?.payload.v1_vr_payload ||
    plan.payload.v1_vr_payload ||
    (canSealPlan && assessment
      ? buildV1VrPayload({ patientId: identity.patientId, kneeSide, assessment, tibial: tibial!, femoral: femoral! })
      : null);

  const handleConfirmLock = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("planId", plan.id);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {!isLocked && (
        <section
          aria-label="Ready to lock?"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "0.5rem 1.25rem",
            padding: "0.875rem 1.25rem",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            background: "var(--surface)",
          }}
        >
          <strong style={{ fontSize: "0.9375rem" }}>{canSealPlan ? "Ready to lock" : "Not ready to lock yet"}</strong>
          {checks.map((check) => (
            <span key={check.label} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem" }}>
              {check.done ? (
                <CheckCircle2 width={15} height={15} color="#16a34a" aria-hidden="true" />
              ) : (
                <AlertCircle width={15} height={15} color="#d97706" aria-hidden="true" />
              )}
              {check.done ? (
                <span>{check.label}</span>
              ) : (
                <Link href={check.href} style={{ color: "#b45309", fontWeight: 600 }}>
                  {check.label}
                </Link>
              )}
            </span>
          ))}
        </section>
      )}

      {/* Three summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {/* Card 1: Patient & Radiographs */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              Patient & scans
            </span>
            <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>
              {plan.case.title}
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Patient ID:</span>
              <strong>{vrPayload?.patient_id ?? plan.caseId}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Operative Knee:</span>
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "#0284c7",
                  color: "white",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                }}
              >
                {kneeSide} KNEE
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Procedure:</span>
              <span>Primary Total Knee Arthroplasty</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Calibration Marker:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}>
                {`AP ${scanScales.FLAP.mmPerPx.toFixed(3)} · Lateral ${scanScales.KLAT.mmPerPx.toFixed(3)} mm/px`}
                {unverifiedViews.length > 0 && !isLocked ? " (estimated)" : ""}
              </span>
            </div>
          </div>

        </div>

        {/* Card 2: Assessment Measurements */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              Measurements
            </span>
            <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>
              Leg measurements
            </h3>
          </div>

          {assessment ? (
            <>
              {(() => {
                const dir = assessment.alignment_type === "VALGUS" ? "Valgus" : assessment.alignment_type === "VARUS" ? "Varus" : "";
                const groups: { title: string; rows: { label: string; value: string }[] }[] = [
                  {
                    title: "FLAP",
                    rows: [
                      { label: "MAD", value: `${assessment.MAD_mm.toFixed(1)} mm${dir ? ` ${dir}` : ""}` },
                      { label: "AMA", value: `${assessment.AMA_deg.toFixed(1)}°` },
                      { label: "mHKA", value: `${assessment.mHKA_deg.toFixed(1)}°${dir ? ` ${dir}` : ""}` },
                      { label: "MPTA", value: `${assessment.MPTA_deg.toFixed(1)}°` },
                      { label: "LDFA", value: `${assessment.LDFA_deg.toFixed(1)}°` },
                    ],
                  },
                  { title: "KLAT", rows: [{ label: "PTS", value: `${assessment.PTS_deg.toFixed(1)}°` }] },
                ];
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                    {groups.map((g) => (
                      <div key={g.title} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", color: "var(--text-muted)" }}>{g.title}:</span>
                        {g.rows.map((row) => (
                          <div key={row.label} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>• {row.label}</span>
                            <strong style={{ fontFamily: "var(--font-mono)" }}>{row.value}</strong>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div style={{ marginTop: "auto", padding: "0.6rem", background: "rgba(2, 132, 199, 0.08)", borderRadius: "6px", border: "1px solid rgba(2, 132, 199, 0.2)" }}>
                <span style={{ fontSize: "0.75rem", color: "#0369a1", fontWeight: 600 }}>
                  {assessment.alignment_type === "NEUTRAL"
                    ? "Neutral alignment"
                    : `${assessment.mHKA_deg.toFixed(1)}° ${assessment.alignment_type === "VALGUS" ? "valgus" : "varus"} deformity`}
                  {assessment.scale_estimated ? " · MAD uses an estimated scale" : ""}
                </span>
              </div>
            </>
          ) : (
            <div style={{ color: "#f59e0b", fontWeight: 700, fontSize: "0.875rem" }}>
              Not measured yet.{" "}
              <Link href={`/plan/${plan.id}/assessment`} style={{ color: "#b45309" }}>
                Go to the assessment
              </Link>
            </div>
          )}
        </div>

        {/* Card 3: Component Selections & Fit */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em" }}>
              Implants
            </span>
            <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>
              Size and fit
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8125rem" }}>
            {/* Tibial Summary */}
            <div style={{ padding: "0.5rem", borderRadius: "4px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}>
              {tibial ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <strong>Tibial Baseplate: Size {tibial.implant_size}</strong>
                    <span style={{ color: fitStatusColor(tibial.fit_status), fontWeight: 700 }}>{tibial.fit_status}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    Placed {tibial.position_2d.x_offset_mm.toFixed(1)} mm sideways, {tibial.position_2d.y_offset_mm.toFixed(1)} mm front/back, turned {tibial.position_2d.rotation_deg.toFixed(1)}°
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", fontSize: "0.75rem" }}>
                    <span>Coverage: <strong>{tibial.cortical_coverage_pct?.toFixed(1) ?? "--"}%</strong></span>
                    <span>Overhang: inner {tibial.medial_overhang_mm?.toFixed(1) ?? "--"} mm / outer {tibial.lateral_overhang_mm?.toFixed(1) ?? "--"} mm</span>
                  </div>
                </>
              ) : (
                <div style={{ color: "#f59e0b", fontWeight: 700 }}>Tibial Planning Incomplete</div>
              )}
            </div>

            {/* Femoral Summary */}
            <div style={{ padding: "0.5rem", borderRadius: "4px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}>
              {femoral ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <strong>Femoral Component: Size {femoral.implant_size}</strong>
                    <span style={{ color: fitStatusColor(femoral.fit_status), fontWeight: 700 }}>{femoral.fit_status}</span>
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    Placed {femoral.position_2d.x_offset_mm.toFixed(1)} mm sideways, {femoral.position_2d.y_offset_mm.toFixed(1)} mm front/back, turned {femoral.position_2d.rotation_deg.toFixed(1)}°
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", fontSize: "0.75rem" }}>
                    <span>Depth covered: <strong>{femoral.ap_coverage_pct?.toFixed(1) ?? "--"}%</strong></span>
                    <span>Gap at the front: <strong>{femoral.notching_risk_mm === 0 ? "0.0 mm (flush)" : `${femoral.notching_risk_mm} mm`}</strong></span>
                  </div>
                </>
              ) : (
                <div style={{ color: "#f59e0b", fontWeight: 700 }}>Femoral Planning Incomplete</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lock Status & VR Transport Message Banner */}
      {isLocked ? (
        <div
          style={{
            padding: "1rem 1.25rem",
            background: "#0f172a",
            color: "white",
            borderRadius: "8px",
            border: "1px solid #334155",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Lock width={18} height={18} color="#38bdf8" />
              <strong style={{ fontSize: "0.9375rem", color: "#38bdf8" }}>
                PLAN LOCKED & IMMUTABLE VERSION SEALED
              </strong>
            </div>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
              {plan.lockedVersion?.sealedAt ? `Sealed: ${plan.lockedVersion.sealedAt.slice(0, 16).replace("T", " ")} UTC` : "Sealed"}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#cbd5e1", lineHeight: 1.4 }}>
            VR headset transfer transport is not yet connected; payload is cached for pairing. In accordance with MediVeR-XR architecture, 2D software parameters are now hard-locked into read-only mode.
          </p>

          <div style={{ marginTop: "0.25rem", padding: "0.75rem", borderRadius: "8px", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.25)" }}>
            <strong style={{ fontSize: "0.8125rem", color: "#e2e8f0" }}>What happens next</strong>
            <ol style={{ margin: "0.4rem 0 0", paddingLeft: "1.1rem", fontSize: "0.8125rem", color: "#cbd5e1", lineHeight: 1.6 }}>
              <li>Your plan is sealed. It can no longer be edited.</li>
              <li>Put on the headset and pair it to load this plan (headset pairing is not connected yet).</li>
              <li>Perform the operation. The score appears under <Link href="/sessions" style={{ color: "#38bdf8" }}>Sessions</Link>, with a report for each run.</li>
            </ol>
          </div>

          {/* Collapsible/Viewable VR Payload JSON */}
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#94a3b8" }}>
                V1 VR TRANSFER PAYLOAD (Pages 6-7 PDF Contract):
              </span>
              <button
                onClick={handleCopyJson}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#38bdf8",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Copy width={12} height={12} />
                {copied ? "Copied!" : "Copy JSON"}
              </button>
            </div>
            <pre
              style={{
                margin: 0,
                padding: "0.75rem",
                background: "#020617",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                color: "#7dd3fc",
                overflowX: "auto",
                border: "1px solid #1e293b",
              }}
            >
              {JSON.stringify(vrPayload, null, 2)}
            </pre>
          </div>
        </div>
      ) : null}

      {/* Action Navigation Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 0",
          borderTop: "1px solid var(--border)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
            <ArrowLeft width={16} height={16} aria-hidden="true" />
            Back to Planning:
          </span>
          {/* V1: "Allows returning to Page 2 or 3 to modify component sizes" (Assessment is locked). */}
          <Link href={`/plan/${plan.id}/tibial`} style={{ color: "inherit" }}>Tibial</Link>
          <Link href={`/plan/${plan.id}/femoral`} style={{ color: "inherit" }}>Femoral</Link>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {!isLocked ? (
            <button
              onClick={() => canSealPlan && setShowModal(true)}
              disabled={!canSealPlan}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                background: canSealPlan ? "#0f172a" : "#cbd5e1",
                color: canSealPlan ? "white" : "#64748b",
                fontWeight: 700,
                fontSize: "0.9375rem",
                border: "none",
                cursor: canSealPlan ? "pointer" : "not-allowed",
                boxShadow: canSealPlan ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
              title={
                !canSealPlan
                  ? unverifiedViews.length > 0
                    ? `The ${unverifiedViews.map((v) => SCAN_VIEW_NAME[v]).join(" and ")} scan scale is not verified. Verify it on the Assessment page (Page 1) with the radio-opaque marker.`
                    : "Planning is incomplete."
                  : "Lock plan"
              }
            >
              <Lock width={16} height={16} />
              {canSealPlan ? "Lock plan & send to VR →" : "Plan incomplete"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <Button variant="secondary" href={plan.case.isPersonalCase ? `/personal-cases/${plan.caseId}` : `/cases/${plan.caseId}`}>
                Back to case
              </Button>
              <Button variant="secondary" href="/plans">
                All pre-op plans
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Lock Confirmation Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(2px)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              padding: "1.75rem",
              maxWidth: "480px",
              width: "90%",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#fee2e2",
                  display: "grid",
                  placeItems: "center",
                  color: "#dc2626",
                }}
              >
                <Lock width={20} height={20} />
              </div>
              <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                Lock Preoperative Plan?
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
              Once locked, parameters cannot be modified in 2D software.
              <br />
              <span style={{ fontSize: "0.8125rem" }}>
                The plan is formatted into the V1 VR payload. Transfer to the VR suite is not connected yet, so locking does not send it.
              </span>
            </p>

            {sealError && (
              <p role="alert" style={{ margin: 0, fontSize: "0.8125rem", color: "#dc2626" }}>{sealError}</p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button variant="secondary" onClick={() => { setSealError(null); setShowModal(false); }} disabled={isPending}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmLock}
                disabled={isPending}
                style={{ background: "#0f172a", color: "white", fontWeight: 700 }}
              >
                {isPending ? "Locking..." : "Confirm & Lock"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
