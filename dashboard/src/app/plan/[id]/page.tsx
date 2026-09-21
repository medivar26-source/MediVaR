import { notFound, redirect } from "next/navigation";
import { furthestOpenStep, getPlan } from "@/lib/data/plan";
import { getCurrentUser } from "@/lib/session";

/**
 * `/plan/[id]` — the plan itself, with no step named.
 *
 * Without this the segment had no page, so a bare plan URL fell through to
 * `app/[...slug]` and was answered with "this screen lands in a later group" —
 * about a plan that exists and is open in the next segment down. That is the
 * catch-all doing its job on a route that should never have reached it.
 *
 * It is the URL people actually hold: what a `revalidatePath(…, "layout")`
 * names, what somebody types when they trim a step number off the end, and what
 * a bookmark decays to. So it resolves to wherever the plan actually is —
 * the first open step, the handoff once it is sealed, or the case once a
 * session has frozen it.
 */
export default async function PlanIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();

  const plan = await getPlan(id);
  if (!plan) notFound();

  if (plan.hasSession) redirect(`/cases/${plan.caseId}`);

  if (plan.payload.workflow === "tkr") {
    if (plan.isReadyForVr || plan.lockedVersion) {
      redirect(`/plan/${plan.id}/review`);
    }
    redirect(`/plan/${plan.id}/assessment`);
  }

  if (plan.isReadyForVr) redirect(`/plan/${plan.id}/saved`);

  redirect(`/plan/${plan.id}/step/${furthestOpenStep(plan.gates)}`);
}
