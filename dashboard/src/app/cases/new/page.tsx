import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell";
import { getCurrentUser } from "@/lib/session";
import { personaFor } from "@/lib/roles";
import { getPrograms } from "@/lib/data/programs";
import { CaseAuthoringWizard } from "@/components/cases/CaseAuthoringWizard";

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
  const availableSkills = [
    { id: "116c30d7-817e-417d-afd7-a76c296af9ec", name: "Bone cuts & alignment", weight: 0.3 },
    { id: "2006c1cd-e655-4011-9b1d-078cc8b2ae48", name: "Gap assessment", weight: 0.25 },
    { id: "2932685b-c3b5-4553-acaf-336718077723", name: "Trialling & stability", weight: 0.25 },
  ];

  return (
    <AppShell user={user}>
      <PageHeader
        title="Create New Clinical Case"
        lede="Author a high-fidelity synthetic TKA surgical scenario, radio-opaque marker calibration, and reference ground truth."
      />
      <CaseAuthoringWizard
        availablePrograms={programs}
        availableSkills={availableSkills}
      />
    </AppShell>
  );
}
