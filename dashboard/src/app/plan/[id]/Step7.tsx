"use client";

import { useActionState } from "react";
import { Banner, Button } from "@/components/ui";
import { sealPlan, type SealState } from "@/app/actions";
import {
  MEASUREMENTS,
  releaseStrategy,
  type PlanDetail,
  type StepGate,
} from "@/lib/plan";
import { titleCase } from "@/lib/format";
import { Rows } from "./Controls";
import { SummaryFoot } from "./StepForm";
import s from "./plan.module.css";
import t from "./steps.module.css";

/**
 * 7 · Plan summary — read-only.
 *
 * "This is the contract. Every screen after this point compares against it,
 * never against a generic ideal". Nothing on this screen is an
 * input, so it does not use `StepForm`; the only action is to seal it.
 *
 * `plan_seal` re-runs all six gates in the database before it will set
 * `is_ready_for_vr`, so posting here without finishing the steps returns false
 * and no PIN is minted.
 */
export function Step7({ plan, gate }: { plan: PlanDetail; gate: StepGate }) {
  const [state, formAction, pending] = useActionState<SealState, FormData>(
    sealPlan,
    {},
  );

  const measured = plan.payload.measurements ?? {};
  const alignment = plan.payload.alignment_plan ?? {};
  const resections = plan.payload.resections ?? {};
  const implants = plan.payload.implants ?? {};
  const config = plan.payload.session_config ?? {};

  const diagnosisLabel =
    plan.options.diagnosis?.find((o) => o.value === plan.payload.diagnosis)
      ?.label ?? "Not chosen";

  const tightLabel =
    plan.options.tight_side?.find(
      (o) => o.value === plan.payload.risks?.tight_side,
    )?.label ?? "Not chosen";

  const acknowledged = plan.payload.risks?.acknowledged ?? [];

  return (
    <>
      {state.error && (
        <Banner tone="warn" title="The plan is not ready yet">
          {state.error}
        </Banner>
      )}

      <div className={`${s.body} ${s.wide}`}>
        <div className={t.summaryGrid}>
          <section className={s.card}>
            <h2 className={s.cardTitle}>Diagnosis</h2>
            <p className={s.lede}>{diagnosisLabel}</p>
            <Rows
              rows={[
                {
                  label: "Radiographic grade",
                  value:
                    plan.options.kl_grade?.find(
                      (o) => o.value === plan.payload.imaging_reading?.kl_grade,
                    )?.label ?? "—",
                },
                {
                  label: "Compartment",
                  value:
                    plan.options.compartment?.find(
                      (o) =>
                        o.value === plan.payload.imaging_reading?.compartment,
                    )?.label ?? "—",
                },
                { label: "Tight side", value: tightLabel },
                {
                  // Derived from the tight side rather than stored beside it,
                  // so the two can never disagree about the same decision.
                  label: "Release",
                  value:
                    releaseStrategy(plan.payload.risks?.tight_side)
                      ?.replace(/_/g, " ")
                      .replace(/^./, (c) => c.toUpperCase()) ?? "—",
                },
                {
                  label: "Risks acknowledged",
                  value: `${acknowledged.length} of ${plan.risks.length}`,
                },
              ]}
            />
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Deformity</h2>
            <Rows
              rows={MEASUREMENTS.map((spec) => ({
                label: spec.short,
                value:
                  measured[spec.key] !== undefined
                    ? `${measured[spec.key]}${spec.unit}`
                    : "—",
              }))}
            />
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Alignment plan</h2>
            <Rows
              rows={[
                {
                  label: "Target mechanical axis",
                  value:
                    alignment.target_hka_deg !== undefined
                      ? `${alignment.target_hka_deg.toFixed(1)}°`
                      : "—",
                },
                {
                  label: "Planned correction",
                  value:
                    alignment.planned_correction_deg !== undefined
                      ? `${alignment.planned_correction_deg > 0 ? "+" : ""}${alignment.planned_correction_deg.toFixed(1)}°`
                      : "—",
                },
                {
                  label: "Proximal tibia — medial",
                  value:
                    resections.proximal_tibia_medial_mm !== undefined
                      ? `${resections.proximal_tibia_medial_mm} mm`
                      : "—",
                },
                {
                  label: "Posterior tibial slope",
                  value:
                    resections.posterior_tibial_slope_deg !== undefined
                      ? `${resections.posterior_tibial_slope_deg}°`
                      : "—",
                },
                {
                  label: "Distal femur",
                  value:
                    resections.distal_femur_mm !== undefined
                      ? `${resections.distal_femur_mm} mm`
                      : "—",
                },
                {
                  label: "Femoral valgus cut",
                  value:
                    resections.distal_femur_valgus_deg !== undefined
                      ? `${resections.distal_femur_valgus_deg}°`
                      : "—",
                },
              ]}
            />
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Implant and session</h2>
            <Rows
              rows={[
                { label: "Design", value: implants.design || "—" },
                {
                  label: "Femoral size",
                  value: implants.femoral_size ? `Size ${implants.femoral_size}` : "—",
                },
                {
                  label: "Tibial tray",
                  value: implants.tibial_tray_size
                    ? `Size ${implants.tibial_tray_size}`
                    : "—",
                },
                {
                  label: "Insert",
                  value: implants.pe_insert_mm ? `${implants.pe_insert_mm} mm` : "—",
                },
                {
                  label: "Fixation",
                  value: config.fixation ? titleCase(config.fixation) : "—",
                },
                {
                  label: "Mode",
                  value: config.mode ? titleCase(config.mode) : "—",
                },
                {
                  label: "Difficulty",
                  value: config.difficulty ? titleCase(config.difficulty) : "—",
                },
                { label: "Patella", value: "Decided at 9.1" },
              ]}
            />
          </section>
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="planId" value={plan.id} />
        <SummaryFoot planId={plan.id} gate={gate}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={pending}
            disabled={!gate.passed}
          >
            {plan.isReadyForVr ? "View pairing PIN" : "Save plan and pair a headset"}
          </Button>
        </SummaryFoot>
      </form>
    </>
  );
}
