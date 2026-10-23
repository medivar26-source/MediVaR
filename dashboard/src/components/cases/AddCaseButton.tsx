"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { Dialog } from "@/components/ui/Dialog";
import { createdCaseHref, type CaseCreationKind, type CaseSaved } from "@/lib/case-creation";

// The wizards are large; they load the first time the dialog opens, not with the page.
const CaseAuthoringWizard = dynamic(
  () => import("@/components/cases/CaseAuthoringWizard").then((m) => m.CaseAuthoringWizard),
  { ssr: false, loading: () => <p>Loading the case form…</p> },
);
const PersonalCaseAuthoringWizard = dynamic(
  () =>
    import("@/components/personal-cases/PersonalCaseAuthoringWizard").then(
      (m) => m.PersonalCaseAuthoringWizard,
    ),
  { ssr: false, loading: () => <p>Loading the case form…</p> },
);

/**
 * "Add case" on Procedures: the existing case-creation workflow for the signed-in role, in a dialog.
 *
 * Nothing about the workflows changes. Instructors and administrators get the institutional wizard
 * (steps, validation, uploads and publishing as at `/cases/new`); learners get the personal-case
 * wizard (as at `/personal-cases/new`). When a case is saved the dialog closes, the Procedures list
 * is refreshed so the new case appears, and a link to it is offered; the user is never sent away.
 */
export function AddCaseButton({
  kind,
  programs,
  skills,
}: {
  kind: CaseCreationKind;
  /** Institutional only: the programs a case can be attached to. */
  programs?: { id: string; name: string }[];
  /** Institutional only: the skills a case can be scored on. */
  skills?: { id: string; name: string; weight?: number }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  // Changing the key gives the next case a fresh, empty wizard.
  const [formKey, setFormKey] = useState(0);
  const [created, setCreated] = useState<{ id: string; published: boolean } | null>(null);

  function handleDone(saved: CaseSaved) {
    setCreated({ id: saved.id, published: Boolean(saved.published) });
    setOpen(false);
    setFormKey((k) => k + 1);
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        Add case
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Add case">
        {kind === "institutional" ? (
          <CaseAuthoringWizard
            key={formKey}
            availablePrograms={programs ?? []}
            availableSkills={skills ?? []}
            onDone={handleDone}
          />
        ) : (
          <PersonalCaseAuthoringWizard key={formKey} onDone={handleDone} />
        )}
      </Dialog>

      {created && (
        <span role="status" style={{ fontSize: "var(--t-label)", color: "var(--text-muted)" }}>
          {created.published ? "Case published." : "Case saved."}{" "}
          <Link href={createdCaseHref(kind, created.id)}>Open the case</Link>
        </span>
      )}
    </>
  );
}
