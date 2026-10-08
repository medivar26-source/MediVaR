import { notFound, redirect } from "next/navigation";
import { getPlan } from "@/lib/data/plan";
import { getCurrentUser } from "@/lib/session";
import { TkrPlanShell } from "../components/TkrPlanShell";
import { AssessmentWorkspace } from "./AssessmentWorkspace";

export default async function TkrAssessmentPage({
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
      currentStepId="assessment"
      title="Assessment & Deformity Measurement"
      lede="Step 1 of 4. Place 13 points on the two scans. The six leg measurements follow from them."
    >
      <AssessmentWorkspace plan={plan} />
    </TkrPlanShell>
  );
}
