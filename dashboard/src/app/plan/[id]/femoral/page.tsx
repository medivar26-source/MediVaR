import { notFound, redirect } from "next/navigation";
import { getPlan } from "@/lib/data/plan";
import { getCurrentUser } from "@/lib/session";
import { TkrPlanShell } from "../components/TkrPlanShell";
import { FemoralWorkspace } from "./FemoralWorkspace";

export default async function FemoralPlanningPage({
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
      currentStepId="femoral"
      title="Femoral Component Planning"
      lede="Step 3 of 4. Mark the bone, pick a size, and check it spans the bone without notching the front."
    >
      <FemoralWorkspace plan={plan} />
    </TkrPlanShell>
  );
}
