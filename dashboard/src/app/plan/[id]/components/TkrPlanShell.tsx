import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, ShieldCheck, Info } from "lucide-react";
import { cx } from "@/lib/cx";
import {
  V1_TKR_STEPS,
  type PlanDetail,
  type V1TkrStepId,
} from "@/lib/plan";
import { formatCalibration } from "@/lib/data/calibration";
import s from "../plan.module.css";

export function TkrPlanShell({
  plan,
  currentStepId,
  title,
  lede,
  children,
}: {
  plan: PlanDetail;
  currentStepId: V1TkrStepId;
  title: string;
  lede: string;
  children: ReactNode;
}) {
  const isLocked = plan.isReadyForVr || plan.lockedVersion !== undefined;

  // Evaluation of completed steps for deterministic gating
  const isAssessmentDone = Boolean(
    plan.payload.v1_assessment ||
    (plan.payload.assessment_landmarks && Object.keys(plan.payload.assessment_landmarks).length > 0) ||
    isLocked
  );

  const isTibialDone = Boolean(
    plan.payload.v1_tibial?.is_confirmed ||
    plan.payload.tibial_planning ||
    isLocked
  );

  const isFemoralDone = Boolean(
    plan.payload.v1_femoral?.is_confirmed ||
    plan.payload.femoral_planning ||
    isLocked
  );

  // Stepper gate map
  const stepStatus: Record<V1TkrStepId, { accessible: boolean; completed: boolean }> = {
    assessment: {
      accessible: true,
      completed: isAssessmentDone,
    },
    tibial: {
      accessible: isAssessmentDone || isLocked,
      completed: isTibialDone,
    },
    femoral: {
      accessible: (isAssessmentDone && isTibialDone) || isLocked,
      completed: isFemoralDone,
    },
    review: {
      accessible: (isAssessmentDone && isTibialDone && isFemoralDone) || isLocked,
      completed: isLocked,
    },
  };

  const patient = plan.case.patient;
  const age = patient?.find((p) => p.label.toLowerCase() === "age")?.value || "68";
  const sex = patient?.find((p) => p.label.toLowerCase() === "sex")?.value || "Male";
  const operativeSide = (plan.case.side || "right").toUpperCase();
  const calibrationText = formatCalibration(plan.payload.calibration);

  return (
    <div className={s.page}>
      {/* Stepper Rail */}
      <nav className={s.rail} aria-label="TKA Planning steps">
        <Link href="/cases" className={s.back}>
          <ArrowLeft width={15} height={15} strokeWidth={2.25} aria-hidden="true" />
          Back to Cases
        </Link>

        <div className={s.railCase}>
          <p className={s.railEyebrow}>Pre-operative TKA Planning</p>
          <p className={s.railTitle}>{plan.case.title}</p>
          <p className={s.railMeta}>
            MEASURE → SIZE → SEND
          </p>
        </div>

        <div className={s.steps}>
          {V1_TKR_STEPS.map((entry) => {
            const status = stepStatus[entry.id];
            const current = entry.id === currentStepId;
            const accessible = status.accessible;
            const isDone = status.completed;

            const inner = (
              <>
                <span className={s.stepDot} aria-hidden="true">
                  {isDone ? (
                    <Check className={s.stepGlyph} strokeWidth={3} />
                  ) : !accessible ? (
                    <Lock className={s.stepGlyph} strokeWidth={2.25} />
                  ) : (
                    entry.step
                  )}
                </span>
                <span className={s.stepBody}>
                  <span className={s.stepTitle}>{entry.title}</span>
                  <span className={s.stepMeta}>
                    {isDone
                      ? "Complete"
                      : current
                        ? "In progress"
                        : !accessible
                          ? "Gated"
                          : "Ready"}
                  </span>
                </span>
              </>
            );

            const classes = cx(
              s.step,
              isDone && s.stepDone,
              current && s.stepOn,
              !accessible && s.stepLocked
            );

            if (!accessible) {
              return (
                <div
                  key={entry.id}
                  className={classes}
                  title="Complete previous steps to unlock"
                >
                  {inner}
                </div>
              );
            }

            return (
              <Link
                key={entry.id}
                href={`/plan/${plan.id}/${entry.path}`}
                className={classes}
                aria-current={current ? "step" : undefined}
              >
                {inner}
              </Link>
            );
          })}
        </div>

        <div className={s.railFoot}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <ShieldCheck width={16} height={16} color="var(--brand)" />
            <strong style={{ fontSize: "0.8125rem" }}>MediVeR-XR V1</strong>
          </div>
          <p style={{ margin: 0, fontSize: "0.75rem", lineHeight: 1.4 }}>
            All intraoperative cuts, resections, and gap adjustments are deferred to VR.
          </p>
        </div>
      </nav>

      {/* Main Surface */}
      <main className={s.main}>
        <div className={s.surface}>
          {/* V1 Persistent Header Banner */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              padding: "1rem 1.5rem",
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              borderRadius: "8px 8px 0 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Patient ID</span>
                <strong style={{ fontSize: "0.9375rem" }}>{plan.caseId}</strong>
              </div>
              <div style={{ width: 1, height: 28, background: "var(--border)" }} />
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Demographics</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>{age} yrs, {sex}</span>
              </div>
              <div style={{ width: 1, height: 28, background: "var(--border)" }} />
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Operative Knee</span>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "#0284c7",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.8125rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {operativeSide} KNEE
                </span>
              </div>
              <div style={{ width: 1, height: 28, background: "var(--border)" }} />
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Procedure</span>
                <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Primary TKA</span>
              </div>
              <div style={{ width: 1, height: 28, background: "var(--border)" }} />
              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Calibration Scale</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  {calibrationText}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {isLocked ? (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    background: "#1e293b",
                    color: "#38bdf8",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em",
                    border: "1px solid #334155",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Lock width={12} height={12} />
                  PLAN LOCKED (READ-ONLY)
                </span>
              ) : (
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "4px",
                    background: "rgba(234, 88, 12, 0.1)",
                    color: "#ea580c",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: "0.04em",
                    border: "1px solid rgba(234, 88, 12, 0.2)",
                  }}
                >
                  DRAFT / EDITABLE
                </span>
              )}

              <span
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  fontWeight: 700,
                  fontSize: "0.7rem",
                  border: "1px solid #fca5a5",
                }}
              >
                DEMO DATA - NOT FOR CLINICAL USE
              </span>
            </div>
          </div>

          {/* Section Header */}
          <div className={s.head} style={{ padding: "1.25rem 1.5rem 0.5rem" }}>
            <h1 className={s.title}>{title}</h1>
            <p className={s.lede}>{lede}</p>
          </div>

          {/* Page Body */}
          <div style={{ padding: "0 1.5rem 1.5rem" }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
