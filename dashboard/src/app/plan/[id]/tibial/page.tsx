import { notFound, redirect } from "next/navigation";
import { getPlan } from "@/lib/data/plan";
import { getCurrentUser } from "@/lib/session";
import { TkrPlanShell } from "../components/TkrPlanShell";
import { TibialWorkspace } from "./TibialWorkspace";

export default async function TibialPlanningPage({
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
      currentStepId="tibial"
      title="Tibial Component Planning"
      lede="Step 2 of 4: Select tibial component size (1–6), adjust 2D CAD template position & rotation, and verify cortical coverage (≥90%) and overhang (≤1.0mm)."
    >
      <TibialWorkspace plan={plan} />
    </TkrPlanShell>
  );
}
