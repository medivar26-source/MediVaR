import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AppShell, PageHeader } from "@/components/shell";
import { getCurrentUser } from "@/lib/session";
import { personaFor } from "@/lib/roles";
import { getCase } from "@/lib/data/cases";
import { getPrograms } from "@/lib/data/programs";
import { CaseAuthoringWizard } from "@/components/cases/CaseAuthoringWizard";

export const metadata: Metadata = {
  title: "Edit Case · MediVeR-XR",
};

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona !== "instructor" && persona !== "admin") {
    redirect(`/cases/${id}`);
  }

  const caseDetail = await getCase(id, user.id);
  if (!caseDetail) notFound();

  const programs = await getPrograms().catch(() => []);
  const availableSkills = [
    { id: "116c30d7-817e-417d-afd7-a76c296af9ec", name: "Bone cuts & alignment", weight: 0.3 },
    { id: "2006c1cd-e655-4011-9b1d-078cc8b2ae48", name: "Gap assessment", weight: 0.25 },
    { id: "2932685b-c3b5-4553-acaf-336718077723", name: "Trialling & stability", weight: 0.25 },
  ];

  return (
    <AppShell user={user}>
      <PageHeader
        title={`Edit Case · ${caseDetail.title}`}
        lede="Modify draft version, upload revised radiographs, update calibration scale, or adjust reference targets."
      />
      <CaseAuthoringWizard
        initialCase={caseDetail}
        availablePrograms={programs}
        availableSkills={availableSkills}
      />
    </AppShell>
  );
}
