import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell";
import { getCurrentUser } from "@/lib/session";
import { personaFor } from "@/lib/roles";
import { getPrograms } from "@/lib/data/programs";
import { CaseAuthoringWizard } from "@/components/cases/CaseAuthoringWizard";
import { AUTHORING_SKILLS } from "@/lib/data/case-authoring-options";

export const metadata: Metadata = {
  title: "Create Case · MediVeR-XR",
};

export default async function NewCasePage() {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona !== "instructor" && persona !== "admin") {
    redirect("/cases");
  }

  const programs = await getPrograms().catch(() => []);

  return (
    <AppShell user={user}>
      <PageHeader
        title="Create New Clinical Case"
        lede="Author a high-fidelity synthetic TKA surgical scenario, radio-opaque marker calibration, and reference ground truth."
      />
      <CaseAuthoringWizard
        availablePrograms={programs}
        availableSkills={AUTHORING_SKILLS}
      />
    </AppShell>
  );
}
