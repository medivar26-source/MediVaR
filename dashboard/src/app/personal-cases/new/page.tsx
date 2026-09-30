import type { Metadata } from "next";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { getCurrentUser } from "@/lib/session";
import { PersonalCaseAuthoringWizard } from "@/components/personal-cases/PersonalCaseAuthoringWizard";

export const metadata: Metadata = { title: "New Personal Case" };

export default async function NewPersonalCasePage() {
  const user = await getCurrentUser();

  return (
    <AppShell user={user}>
      <PageHeader
        title="Create Personal Case"
        lede="Add a new private case to your personal space."
      />
      <PersonalCaseAuthoringWizard />
    </AppShell>
  );
}
