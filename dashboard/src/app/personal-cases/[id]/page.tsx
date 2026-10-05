import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { getCurrentUser } from "@/lib/session";
import { getPersonalCaseAction } from "@/app/actions/personal-cases";
import { PersonalCaseAuthoringWizard } from "@/components/personal-cases/PersonalCaseAuthoringWizard";
import { StartPlanning } from "@/app/cases/[id]/StartPlanning";
import { getPlans } from "@/lib/data/plans";

export const metadata: Metadata = { title: "Edit Personal Case" };

export default async function PersonalCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  
  const res = await getPersonalCaseAction(id);
  if (!res.success || !res.data) {
    return notFound();
  }
  
  const caseData = res.data;
  
  const myPlan = (await getPlans(undefined, user.id)).plans.find((row) => row.caseId === caseData.id);

  return (
    <AppShell user={user}>
      <PageHeader
        title={caseData.title}
        lede="Manage your personal case details and imaging."
        actions={
          <StartPlanning
            caseId={caseData.id}
            config={{}}
            plan={
              myPlan
                ? { id: myPlan.id, state: myPlan.state, sessionId: myPlan.sessionId }
                : undefined
            }
          />
        }
      />
      <PersonalCaseAuthoringWizard initialCase={caseData} />
    </AppShell>
  );
}
