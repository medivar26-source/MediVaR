"use client";

import { useActionState } from "react";
import { Banner, Button } from "@/components/ui";
import { sealTkrPlan, type SealState } from "@/app/actions";
import { type PlanDetail, type StepGate } from "@/lib/plan";
import { Rows } from "./Controls";
import { SummaryFoot } from "./StepForm";
import s from "./plan.module.css";
import t from "./steps.module.css";
import { VisualVerificationCanvas } from "./VisualVerificationCanvas";

export function TkrSummaryPanel({ plan, gate }: { plan: PlanDetail; gate: StepGate }) {
  const [state, formAction, pending] = useActionState<SealState, FormData>(
    sealTkrPlan,
    {},
  );

  const tkrSource = plan.lockedVersion?.payload || plan.payload;
  
  const assessment = (tkrSource.assessment_landmarks as Record<string, unknown>) || {};
  const femoral = (tkrSource.femoral_planning as Record<string, unknown>) || {};
  const tibial = (tkrSource.tibial_planning as Record<string, unknown>) || {};

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
            <h2 className={s.cardTitle}>TKR Assessment</h2>
            <Rows
              rows={[
                {
                  label: "Landmarks Placed",
                  value: Object.keys(assessment).length > 0 ? "Yes" : "No",
                },
              ]}
            />
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Femoral Implantation</h2>
            <Rows
              rows={[
                {
                  label: "Component Size",
                  value: femoral.size ? `Size ${femoral.size}` : "—",
                },
                {
                  label: "Distal Resection",
                  value: femoral.distalResectionDepth !== undefined ? `${femoral.distalResectionDepth} mm` : "—",
                },
                {
                  label: "Varus/Valgus",
                  value: femoral.varusValgus !== undefined ? `${femoral.varusValgus}°` : "—",
                },
                {
                  label: "Flexion/Extension",
                  value: femoral.flexionExtension !== undefined ? `${femoral.flexionExtension}°` : "—",
                },
              ]}
            />
          </section>

          <section className={s.card}>
            <h2 className={s.cardTitle}>Tibial Implantation</h2>
            <Rows
              rows={[
                {
                  label: "Tray Size",
                  value: tibial.traySize ? `Size ${tibial.traySize}` : "—",
                },
                {
                  label: "Poly Thickness",
                  value: tibial.polyThickness ? `${tibial.polyThickness} mm` : "—",
                },
                {
                  label: "Proximal Resection",
                  value: tibial.proximalResectionDepth !== undefined ? `${tibial.proximalResectionDepth} mm` : "—",
                },
                {
                  label: "Posterior Slope",
                  value: tibial.posteriorSlope !== undefined ? `${tibial.posteriorSlope}°` : "—",
                },
              ]}
            />
          </section>
          
          <section className={s.card} style={{ gridColumn: "1 / -1" }}>
            <h2 className={s.cardTitle}>Visual Verification (Demo)</h2>
            <div style={{ height: "300px", position: "relative", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--surface-hover)" }}>
              <div style={{ position: "absolute", top: 10, left: 10, zIndex: 10, backgroundColor: "rgba(0,0,0,0.6)", color: "white", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem" }}>
                DEMO - Final Implants
              </div>
              <VisualVerificationCanvas 
                assessment={assessment} 
                femoral={femoral} 
                tibial={tibial} 
              />
            </div>
          </section>
        </div>
      </div>

      <form action={formAction}>
        <input type="hidden" name="planId" value={plan.id} />
        <SummaryFoot planId={plan.id} gate={gate}>
          {plan.isReadyForVr ? (
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <div style={{ padding: "0.5rem 1rem", backgroundColor: "rgba(34, 197, 94, 0.1)", borderRadius: "4px", border: "1px solid rgba(34, 197, 94, 0.5)", color: "#15803d", fontWeight: "500" }}>
                ✓ Plan Sealed & Locked
              </div>
              <Button type="button" variant="primary" size="lg" disabled={true}>
                Ready for VR Transfer (Pipeline Pending)
              </Button>
            </div>
          ) : (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={pending}
              disabled={!gate.passed}
            >
              Seal TKR Plan
            </Button>
          )}
        </SummaryFoot>
      </form>
    </>
  );
}
