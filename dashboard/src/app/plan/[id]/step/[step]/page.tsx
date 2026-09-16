import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  LAST_STEP,
  PLAN_STEPS,
  furthestOpenStep,
  gateFor,
  getPlan,
} from "@/lib/data/plan";
import { getCurrentUser } from "@/lib/session";
import { PlanShell } from "../../PlanShell";
import { Step1, Step2, Step3, Step4, Step5, Step6 } from "../../Steps";
import { Step7 } from "../../Step7";

/** One line per step, stating what the step is for rather than what it contains. */
const LEDE: Record<number, string> = {
  1: "Read the history and commit to a primary diagnosis before you look at any imaging.",
  2: "Grade the disease and name the compartment that has failed.",
  3: "Measure the deformity. Every angle has to land within tolerance of the film.",
  4: "Set the target axis and the resection depths. This is the contract the headset scores you against.",
  5: "Choose the design and the sizes. The fit check must report no overhang and no undercut.",
  6: "Acknowledge every risk this patient carries, then commit to the release.",
  7: "Read-only. Every screen after this compares against this plan, never against a generic ideal.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ step: string }>;
}): Promise<Metadata> {
  const { step } = await params;
  const entry = PLAN_STEPS.find((s) => String(s.step) === step);
  return { title: entry ? `${entry.step}. ${entry.title}` : "Planning" };
}

/**
 * One route for all seven steps.
 *
 * The gate for every step is fetched on every load rather than remembered, so
 * going back and changing an upstream answer re-closes what depended on it —
 * That is also why a learner cannot deep-link past the first open
 * step: the redirect below reads the same gates the rail draws.
 */
export default async function PlanStepPage({
  params,
}: {
  params: Promise<{ id: string; step: string }>;
}) {
  const { id, step: raw } = await params;
  const step = Number(raw);

  if (!Number.isInteger(step) || step < 1 || step > LAST_STEP) notFound();

  await getCurrentUser();
  const plan = await getPlan(id);
  if (!plan) notFound();

  // A plan with a session is frozen. There is nothing to
  // edit, so the case page is the honest destination.
  if (plan.hasSession) redirect(`/cases/${plan.caseId}`);

  // Backward is always free; forward is gated. Deep-linking past the first
  // open step lands on that step instead of on an empty screen.
  const open = furthestOpenStep(plan.gates);
  if (step > open) redirect(`/plan/${plan.id}/step/${open}`);

  const gate = gateFor(plan.gates, step);
  const entry = PLAN_STEPS.find((s) => s.step === step)!;

  return (
    <PlanShell plan={plan} step={step} title={entry.title} lede={LEDE[step]}>
      {step === 1 && <Step1 plan={plan} gate={gate} />}
      {step === 2 && <Step2 plan={plan} gate={gate} />}
      {step === 3 && <Step3 plan={plan} gate={gate} />}
      {step === 4 && <Step4 plan={plan} gate={gate} />}
      {step === 5 && <Step5 plan={plan} gate={gate} />}
      {step === 6 && <Step6 plan={plan} gate={gate} />}
      {step === 7 && <Step7 plan={plan} gate={gate} />}
    </PlanShell>
  );
}
