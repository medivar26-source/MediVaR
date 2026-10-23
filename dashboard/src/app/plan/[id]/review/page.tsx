import { notFound } from "next/navigation";
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

  // A plan that has been performed is sealed, so this page shows it read-only; the
  // session and report pages link here as "Open plan".

  return (
    <TkrPlanShell
      plan={plan}
      currentStepId="review"
      title="Review & Send to VR"
      lede="Step 4 of 4. Check everything, then lock the plan to send it to VR."
    >
      <ReviewWorkspace plan={plan} />
    </TkrPlanShell>
  );
}
