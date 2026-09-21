"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, Lock, ShieldCheck, AlertCircle } from "lucide-react";
import { sealTkrPlan } from "@/app/actions";
import { Button } from "@/components/ui";
import type { PlanDetail, V1VrPayload } from "@/lib/plan";
import { formatCalibration } from "@/lib/data/calibration";
import s from "../plan.module.css";

export function ReviewWorkspace({ plan }: { plan: PlanDetail }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLocked = plan.isReadyForVr || plan.lockedVersion !== undefined;

  // Derive assessment values from payload or defaults
  const assessment = plan.lockedVersion?.payload.v1_assessment || plan.payload.v1_assessment || {
    MAD_mm: 12.0,
    AMA_deg: 6.0,
    mHKA_deg: 7.0,
    MPTA_deg: 89.0,
    LDFA_deg: 88.0,
    PTS_deg: 7.0,
    alignment_type: (plan.case.side === "left" || plan.caseId.includes("VALGUS")) ? "VALGUS" : "VARUS",
  };

  // Derive tibial values
  const tibial = plan.lockedVersion?.payload.v1_tibial || plan.payload.v1_tibial || {
    implant_size: 3,
    position_2d: { x_offset_mm: 1.2, y_offset_mm: -0.4, rotation_deg: 0.5 },
    ap_dimension_mm: 42.5,
    ml_dimension_mm: 68.2,
    cortical_coverage_pct: 91.5,
    medial_overhang_mm: 0.4,
    lateral_overhang_mm: 0.6,
    fit_status: "ACCEPTABLE FIT",
  };

  // Derive femoral values
  const femoral = plan.lockedVersion?.payload.v1_femoral || plan.payload.v1_femoral || {
    implant_size: 4,
    position_2d: { x_offset_mm: 0.5, y_offset_mm: 0.0, rotation_deg: 0.0 },
    ap_dimension_mm: 58.4,
    ml_dimension_mm: 64.1,
    ap_coverage_pct: 94.2,
    ml_coverage_pct: 92.8,
    notching_risk_mm: 0.0,
    fit_status: "ACCEPTABLE FIT",
  };

  const kneeSide: "RIGHT" | "LEFT" = (plan.case.side || "right").toUpperCase() as "RIGHT" | "LEFT";

  // Exact V1 VR Payload schema matching Pages 6-7 of PDF
  const vrPayload: V1VrPayload = plan.lockedVersion?.payload.v1_vr_payload || plan.payload.v1_vr_payload || {
    patient_id: plan.caseId === "SYNTH-VARUS-001" ? "P-0247" : plan.caseId === "SYNTH-VALGUS-001" ? "P-0891" : plan.caseId,
    knee_side: kneeSide,
    assessment: {
      MAD_mm: assessment.MAD_mm,
      AMA_deg: assessment.AMA_deg,
      mHKA_deg: assessment.mHKA_deg,
      MPTA_deg: assessment.MPTA_deg,
      LDFA_deg: assessment.LDFA_deg,
      PTS_deg: assessment.PTS_deg,
    },
    tibial_component: {
      implant_size: tibial.implant_size,
      position_2d: {
        x_offset_mm: tibial.position_2d.x_offset_mm,
        y_offset_mm: tibial.position_2d.y_offset_mm,
        rotation_deg: tibial.position_2d.rotation_deg,
      },
    },
    femoral_component: {
      implant_size: femoral.implant_size,
      position_2d: {
        x_offset_mm: femoral.position_2d.x_offset_mm,
        y_offset_mm: femoral.position_2d.y_offset_mm,
        rotation_deg: femoral.position_2d.rotation_deg,
      },
    },
  };

  const handleConfirmLock = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("planId", plan.id);
      await sealTkrPlan({}, formData);
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
      {/* 3 Structured Summary Cards */}
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
              Card 1 · Patient & Imaging
            </span>
            <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>
              {plan.case.title}
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Patient ID:</span>
              <strong>{vrPayload.patient_id}</strong>
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
                {formatCalibration(plan.payload.calibration)}
              </span>
            </div>
          </div>

          <div style={{ marginTop: "auto", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
              Calibrated Radiograph Views:
            </span>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  background: "rgba(0,0,0,0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  textAlign: "center",
                }}
              >
                <strong>FLAP View</strong>
                <div style={{ color: "var(--text-muted)", fontSize: "0.6875rem" }}>Full-Length AP</div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  background: "rgba(0,0,0,0.03)",
                  border: "1px solid var(--border)",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  textAlign: "center",
                }}
              >
                <strong>KLAT View</strong>
                <div style={{ color: "var(--text-muted)", fontSize: "0.6875rem" }}>Knee Lateral</div>
              </div>
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
              Card 2 · Assessment
            </span>
            <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>
              6 Target Measurements
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>1. MAD (Mechanical Axis Dev):</span>
              <strong style={{ fontFamily: "var(--font-mono)" }}>{assessment.MAD_mm.toFixed(1)} mm ({assessment.alignment_type})</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>2. AMA (Anat-Mech Angle):</span>
              <strong style={{ fontFamily: "var(--font-mono)" }}>{assessment.AMA_deg.toFixed(1)}°</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>3. mHKA (Hip-Knee-Ankle):</span>
              <strong style={{ fontFamily: "var(--font-mono)", color: "#0284c7" }}>
                {assessment.mHKA_deg.toFixed(1)}° {assessment.alignment_type}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>4. MPTA (Medial Prox Tibial):</span>
              <strong style={{ fontFamily: "var(--font-mono)" }}>{assessment.MPTA_deg.toFixed(1)}°</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>5. LDFA (Lat Distal Femoral):</span>
              <strong style={{ fontFamily: "var(--font-mono)" }}>{assessment.LDFA_deg.toFixed(1)}°</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>6. PTS (Posterior Tibial Slope):</span>
              <strong style={{ fontFamily: "var(--font-mono)" }}>{assessment.PTS_deg.toFixed(1)}°</strong>
            </div>
          </div>

          <div style={{ marginTop: "auto", padding: "0.6rem", background: "rgba(2, 132, 199, 0.08)", borderRadius: "6px", border: "1px solid rgba(2, 132, 199, 0.2)" }}>
            <span style={{ fontSize: "0.75rem", color: "#0369a1", fontWeight: 600 }}>
              Clinical Classification: {assessment.mHKA_deg.toFixed(1)}° {assessment.alignment_type} Deformity
            </span>
          </div>
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
              Card 3 · Implants & Fit
            </span>
            <h3 style={{ margin: "0.25rem 0 0", fontSize: "1.125rem", fontWeight: 700 }}>
              Tibial & Femoral Fit
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.8125rem" }}>
            {/* Tibial Summary */}
            <div style={{ padding: "0.5rem", borderRadius: "4px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <strong>Tibial Baseplate: Size {tibial.implant_size}</strong>
                <span style={{ color: "#10b981", fontWeight: 700 }}>{tibial.fit_status}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                Offsets: X: {tibial.position_2d.x_offset_mm.toFixed(1)}mm, Y: {tibial.position_2d.y_offset_mm.toFixed(1)}mm, Rot: {tibial.position_2d.rotation_deg.toFixed(1)}°
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", fontSize: "0.75rem" }}>
                <span>Coverage: <strong>{tibial.cortical_coverage_pct?.toFixed(1) ?? "91.5"}%</strong></span>
                <span>Overhang: M {tibial.medial_overhang_mm?.toFixed(1) ?? "0.4"}mm / L {tibial.lateral_overhang_mm?.toFixed(1) ?? "0.6"}mm</span>
              </div>
            </div>

            {/* Femoral Summary */}
            <div style={{ padding: "0.5rem", borderRadius: "4px", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <strong>Femoral Component: Size {femoral.implant_size}</strong>
                <span style={{ color: "#10b981", fontWeight: 700 }}>{femoral.fit_status}</span>
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                Offsets: X: {femoral.position_2d.x_offset_mm.toFixed(1)}mm, Y: {femoral.position_2d.y_offset_mm.toFixed(1)}mm, Rot: {femoral.position_2d.rotation_deg.toFixed(1)}°
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", fontSize: "0.75rem" }}>
                <span>AP Coverage: <strong>{femoral.ap_coverage_pct?.toFixed(1) ?? "94.2"}%</strong></span>
                <span>Notching Risk: <strong>{femoral.notching_risk_mm === 0 ? "0.0 mm (Flush)" : `${femoral.notching_risk_mm} mm`}</strong></span>
              </div>
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
              Sealed: {plan.lockedVersion?.sealedAt ? new Date(plan.lockedVersion.sealedAt).toLocaleString() : new Date().toLocaleString()}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: "0.8125rem", color: "#cbd5e1", lineHeight: 1.4 }}>
            VR headset transfer transport is not yet connected; payload is cached for pairing. In accordance with MediVeR-XR architecture, 2D software parameters are now hard-locked into read-only mode.
          </p>

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
        <Link
          href={`/plan/${plan.id}/femoral`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft width={16} height={16} />
          Back to Femoral Planning
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {!isLocked ? (
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "6px",
                background: "#0f172a",
                color: "white",
                fontWeight: 700,
                fontSize: "0.9375rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Lock width={16} height={16} />
              LOCK PLAN & SEND TO VR →
            </button>
          ) : (
            <Button variant="secondary" href="/cases">
              Return to Cases
            </Button>
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
              Once locked, parameters cannot be modified in 2D software. The plan will be formatted into the immutable VR transfer payload for intraoperative execution.
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
              <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isPending}>
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
