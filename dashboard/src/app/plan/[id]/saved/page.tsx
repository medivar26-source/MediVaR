import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui";
import { getPlan, releaseStrategy } from "@/lib/data/plan";
import { titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PinPanel } from "./PinPanel";
import s from "./saved.module.css";

export const metadata: Metadata = { title: "Plan saved" };

/**
 * The handoff.
 *
 * A plan that has not passed every gate cannot reach this screen: the redirect
 * below sends it back to the first open step, and `plan_seal` would refuse it
 * anyway. Both checks exist because they answer different questions — one is
 * navigation, one is the boundary.
 *
 * The same is true of a plan that has already been performed. `/plan/[id]/step`
 * carries that guard; this screen did not, so a sealed plan
 * whose session had long since finished still rendered the handoff and offered
 * to issue a PIN for it. `pair-mint` now refuses that outright (the schema and the
 * `plan_frozen` branch), but a screen should not offer a control whose only
 * possible answer is no.
 */
export default async function PlanSavedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();

  const plan = await getPlan(id);
  if (!plan) notFound();

  // Performed already: there is nothing left to hand off, and the case page is
  // where the session and its report are.
  if (plan.hasSession) redirect(`/cases/${plan.caseId}`);

  if (!plan.isReadyForVr) {
    const open = plan.gates.find((g) => !g.passed)?.step ?? 1;
    redirect(`/plan/${plan.id}/step/${open}`);
  }

  const config = plan.payload.session_config ?? {};
  const implants = plan.payload.implants ?? {};

  const totalSeconds = Object.values(plan.stepTimings).reduce((a, b) => a + b, 0);

  return (
    <div className={s.page}>
      <main className={s.surface}>
        <div className={s.inner}>
          <div className={s.head}>
            <span className={s.tick} aria-hidden="true">
              <Check className={s.tickGlyph} strokeWidth={3} />
            </span>
            <div>
              <h1 className={s.title}>Plan saved</h1>
              <p className={s.lede}>
                {plan.case.title} · {titleCase(config.mode ?? "training")} ·{" "}
                {titleCase(config.difficulty ?? "intermediate")} ·{" "}
                {implants.design ?? "CR"} ·{" "}
                {titleCase(config.fixation ?? "cemented")}. The headset will read
                this back to you before anything is committed.
              </p>
            </div>
          </div>

          <div className={s.layout}>
            <PinPanel planId={plan.id} />

            <div className={s.col}>
              <section className={s.card}>
                <h2 className={s.cardTitle}>On the headset</h2>
                <ol className={s.stepsList}>
                  {[
                    "Put on the headset and wait for the MediVeR XR splash screen.",
                    "Press Enter PIN and key the four digits into the floating keypad.",
                    "Confirm the case read-back, then begin the Time Out.",
                  ].map((line, i) => (
                    <li className={s.stepRow} key={line}>
                      <span className={s.stepNum} aria-hidden="true">
                        {i + 1}
                      </span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ol>
              </section>

              <section className={s.card}>
                <h2 className={s.cardTitle}>What the headset receives</h2>
                <div className={s.rows}>
                  {[
                    { label: "Case", value: plan.case.title },
                    {
                      label: "Target mechanical axis",
                      value:
                        plan.payload.alignment_plan?.target_hka_deg !== undefined
                          ? `${plan.payload.alignment_plan.target_hka_deg.toFixed(1)}°`
                          : "—",
                    },
                    {
                      label: "Implant",
                      value: `${implants.design ?? "—"} · femoral ${implants.femoral_size ?? "—"} · tray ${implants.tibial_tray_size ?? "—"} · ${implants.pe_insert_mm ?? "—"} mm`,
                    },
                    {
                      // The release the headset expects at 2.3 and 3.2,
                      // derived from the tight side step 6 graded — one answer,
                      // read two ways, never stored twice.
                      label: "Release",
                      value: titleCase(
                        releaseStrategy(plan.payload.risks?.tight_side)?.replace(
                          /_/g,
                          " ",
                        ) ?? "—",
                      ),
                    },
                    {
                      label: "Time spent planning",
                      value:
                        totalSeconds > 0
                          ? `${Math.floor(totalSeconds / 60)} min ${totalSeconds % 60} s`
                          : "—",
                    },
                  ].map((row) => (
                    <div className={s.row} key={row.label}>
                      <span className={s.rowLabel}>{row.label}</span>
                      <span className={s.rowValue}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className={s.actions}>
            <Button variant="secondary" href={`/plan/${plan.id}/step/7`}>
              Review the plan
            </Button>
            <Button variant="secondary" href={`/cases/${plan.caseId}`}>
              Back to the case
            </Button>
            <Button variant="ghost" href="/">
              Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
