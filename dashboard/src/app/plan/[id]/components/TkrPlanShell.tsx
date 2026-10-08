import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, ShieldCheck } from "lucide-react";
import { cx } from "@/lib/cx";
import {
  V1_TKR_STEPS,
  type PlanDetail,
  type V1TkrStepId,
} from "@/lib/plan";
import { SCAN_VIEW_NAME, resolvePlanScales } from "@/lib/data/scan_scale";
import { resolvePatientIdentity } from "@/lib/data/planner_identity";
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
  // A step is done only when its result exists: a measured assessment, a confirmed component. Points
  // placed but never measured, or a component moved but never confirmed, do not unlock the next step.
  const isAssessmentDone = Boolean(plan.payload.v1_assessment || isLocked);
  const isTibialDone = Boolean(plan.payload.v1_tibial?.is_confirmed || isLocked);
  const isFemoralDone = Boolean(plan.payload.v1_femoral?.is_confirmed || isLocked);

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

  // Identity comes from the case record only (V1: read-only, "hard-coded for V1"). Nothing is defaulted.
  const identity = resolvePatientIdentity(plan.caseId, plan.case.patient);
  const operativeSide = (plan.case.side || "right").toUpperCase();
  // Each scan has its own scale, and a scale nobody verified must not look verified.
  const scanScales = resolvePlanScales(plan);
  const anyEstimated = !scanScales.FLAP.calibrated || !scanScales.KLAT.calibrated;
  const calibrationText =
    (["FLAP", "KLAT"] as const)
      .map((v) => `${SCAN_VIEW_NAME[v] === "AP" ? "AP" : "Lateral"} ${scanScales[v].mmPerPx.toFixed(3)}`)
      .join(" · ") +
    " mm/px" +
    (anyEstimated ? " (estimated)" : "");

  return (
    <div className={s.page}>
      {/* Stepper Rail */}
      <nav className={s.rail} aria-label="TKA Planning steps">
        <Link href={plan.case.isPersonalCase ? `/personal-cases/${plan.caseId}` : `/cases/${plan.caseId}`} className={s.back}>
          <ArrowLeft width={15} height={15} strokeWidth={2.25} aria-hidden="true" />
          Back to case
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
                          ? "Finish the previous step first"
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
          {/* V1 global header: persistent patient banner on all four pages. */}
          <header className={s.patientBar} aria-label="Patient and plan">
            <dl className={s.patientFacts}>
              <div title={`Source: ${identity.patientIdSource}`}>
                <dt>Patient ID</dt>
                <dd>{identity.patientId}</dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>{identity.age ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Sex</dt>
                <dd>{identity.sex ?? "Not recorded"}</dd>
              </div>
              <div title="Hard-locked once the session starts">
                <dt>Surgical side</dt>
                <dd>{operativeSide === "LEFT" ? "Left" : "Right"} knee</dd>
              </div>
              <div>
                <dt>Procedure</dt>
                <dd>Primary TKA</dd>
              </div>
              <div>
                <dt>Plan state</dt>
                <dd>
                  {isLocked ? (
                    <span className={s.chipLocked}>
                      <Lock width={12} height={12} aria-hidden="true" />
                      Locked
                    </span>
                  ) : (
                    <span className={s.chipDraft}>Draft</span>
                  )}
                </dd>
              </div>
            </dl>
            <div className={s.chips}>
              <span className={anyEstimated ? s.chipWarn : s.chipOk} title={calibrationText}>
                {anyEstimated ? "Scale estimated" : "Scale verified"}
              </span>
              {identity.patientIdSource === "synthetic fixture" && (
                <span className={s.chipDemo} title="Synthetic demo case. Not for clinical use.">
                  Demo data
                </span>
              )}
            </div>
          </header>

          <div className={s.topbar}>
            <div className={s.topTitle}>
              <h1 className={s.titleSm}>{title}</h1>
              <p className={s.ledeSm}>{lede}</p>
            </div>
          </div>

          {/* Page Body */}
          <div className={s.stepBody}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
