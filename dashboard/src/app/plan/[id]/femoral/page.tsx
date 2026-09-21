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
      lede="Step 3 of 4: Select femoral component size (1–8), adjust 2D CAD template position & rotation, and verify AP/ML coverage and anterior notching risk."
    >
      <FemoralWorkspace plan={plan} />
    </TkrPlanShell>
  );
}
