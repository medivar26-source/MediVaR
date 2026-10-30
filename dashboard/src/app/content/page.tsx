import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { AddCaseButton } from "@/components/cases/AddCaseButton";
import { LibraryNav } from "@/components/cases/LibraryNav";
import { caseCreationKind } from "@/lib/case-creation";
import { AUTHORING_SKILLS } from "@/lib/data/case-authoring-options";
import { startEarlyReads } from "@/lib/data/early-reads";
import { getPrograms } from "@/lib/data/programs";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { ProcedureDetail, ProcedureList, procedureHeading } from "./ProcedureBrowser";

export const metadata: Metadata = { title: "Content / Procedures" };

/**
 * Procedures first. Opening one (`?procedure=<id>`) shows its cases; a learner also gets their own pre-op
 * plans for them (`&view=plans`). Readable by learners and instructors alike, with one difference: a
 * learner's Content Library has a second part, My Cases (see `LibraryNav`), and an instructor's has none.
 *
 * Cases are still managed at the Case Library (`/cases`). The old `?tab=cases` address redirects there, so
 * existing links keep working.
 */
export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; procedure?: string; view?: string }>;
}) {
  const params = await searchParams;
  if (params.tab === "cases") redirect("/cases");

  // Start the case list and the learner's sessions while the identity check runs (see `early-reads.ts`).
  startEarlyReads({ cases: true, sessions: true });
  const user = await getCurrentUser();
  const kind = caseCreationKind(user.role);
  const staff = kind === "institutional";
  const learner = personaFor(user.role) === "learner";
  const heading = params.procedure ? await procedureHeading(params.procedure) : null;
  // Only the institutional wizard needs the programs a case can be attached to.
  const programs = staff ? await getPrograms().catch(() => []) : [];

  // Only the case status and imaging management at /content/[id] is instructor-only.
  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <Breadcrumbs
        items={
          heading
            ? [
                { label: "Content Library", href: "/content?tab=procedures" },
                { label: "Procedures", href: "/content?tab=procedures" },
                { label: heading.name },
              ]
            : [{ label: "Content Library", href: "/content?tab=procedures" }, { label: "Procedures" }]
        }
      />

      <PageHeader
        title={heading ? heading.name : "Procedures"}
        lede={
          heading
            ? (heading.summary ?? (learner ? "Its cases and your pre-op plans." : "Its cases."))
            : learner
              ? "Open a procedure to see its cases and your pre-op plans."
              : "Open a procedure to see its cases."
        }
        actions={
          <AddCaseButton
            kind={kind}
            programs={programs.map((p) => ({ id: p.id, name: p.name }))}
            skills={staff ? AUTHORING_SKILLS : undefined}
          />
        }
      />

      {learner && <LibraryNav current="procedures" />}

      {heading && params.procedure ? (
        <ProcedureDetail
          userId={user.id}
          procedureId={params.procedure}
          view={params.view === "plans" ? "plans" : "cases"}
          staff={staff}
        />
      ) : (
        <ProcedureList userId={user.id} staff={staff} />
      )}
    </AppShell>
  );
}
