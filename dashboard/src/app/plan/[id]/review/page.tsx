import { notFound, redirect } from "next/navigation";
import { getPlan } from "@/lib/data/plan";
import { getCurrentUser } from "@/lib/session";
import { TkrPlanShell } from "../components/TkrPlanShell";
import { ReviewWorkspace } from "./ReviewWorkspace";

export default async function TkrReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentUser();

  const plan = await getPlan(id);
  if (!plan) notFound();

  if (plan.hasSession) redirect(`/cases/${plan.caseId}`);

  return (
    <TkrPlanShell
      plan={plan}
      currentStepId="review"
      title="Review & Send to VR"
      lede="Step 4 of 4: Verify patient radiographs, assessment measurements, and component fit before sealing the immutable VR transfer payload."
    >
      <ReviewWorkspace plan={plan} />
    </TkrPlanShell>
  );
}
