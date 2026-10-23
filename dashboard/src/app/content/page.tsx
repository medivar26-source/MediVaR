import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { AddCaseButton } from "@/components/cases/AddCaseButton";
import { caseCreationKind } from "@/lib/case-creation";
import { AUTHORING_SKILLS } from "@/lib/data/case-authoring-options";
import { startEarlyReads } from "@/lib/data/early-reads";
import { getPrograms } from "@/lib/data/programs";
import { getCurrentUser } from "@/lib/session";
import { ProceduresSection } from "./ProceduresSection";

export const metadata: Metadata = { title: "Content / Procedures" };

/**
 * Procedures: each procedure expands to the cases built on it, and to the step sequence it follows.
 * Readable by learners and instructors alike.
 *
 * Cases are still managed at the Case Library (`/cases`, in the side navigation). The old
 * `?tab=cases` address redirects there, so existing links keep working.
 */
export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  if (params.tab === "cases") redirect("/cases");

  // Start the case list and the learner's sessions while the identity check runs (see `early-reads.ts`).
  startEarlyReads({ cases: true, sessions: true });
  const user = await getCurrentUser();
  const kind = caseCreationKind(user.role);
  const staff = kind === "institutional";
  // Only the institutional wizard needs the programs a case can be attached to.
  const programs = staff ? await getPrograms().catch(() => []) : [];

  // Procedures are readable by learners too (the Content Library is shared); only the case
  // status and imaging management at /content/[id] is instructor-only.
  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <Breadcrumbs
        items={[
          { label: "Content Library", href: "/content?tab=procedures" },
          { label: "Procedures" },
        ]}
      />

      <PageHeader
        title="Procedures"
        lede="Open a procedure to see its cases and its steps."
        actions={
          <AddCaseButton
            kind={kind}
            programs={programs.map((p) => ({ id: p.id, name: p.name }))}
            skills={staff ? AUTHORING_SKILLS : undefined}
          />
        }
      />

      <ProceduresSection userId={user.id} staff={staff} />
    </AppShell>
  );
}
