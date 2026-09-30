import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { getCurrentUser } from "@/lib/session";
import { getPersonalCaseAction } from "@/app/actions/personal-cases";
import { PersonalCaseAuthoringWizard } from "@/components/personal-cases/PersonalCaseAuthoringWizard";

export const metadata: Metadata = { title: "Edit Personal Case" };

export default async function PersonalCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;
  
  const res = await getPersonalCaseAction(id);
  if (!res.success || !res.data) {
    return notFound();
  }
  
  const caseData = res.data;

  return (
    <AppShell user={user}>
      <PageHeader
        title={caseData.title}
        lede="Manage your personal case details and imaging."
      />
      <PersonalCaseAuthoringWizard initialCase={caseData} />
    </AppShell>
  );
}
