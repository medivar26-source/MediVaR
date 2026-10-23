/**
 * Who creates which kind of case, and where they go afterwards.
 *
 * There are two creation workflows and they stay separate: instructors and administrators author
 * institutional cases (versioned, published to programs, `POST /cases`), and learners add their own
 * private cases (`POST /personal-cases`). The Add Case control on Procedures chooses between them
 * from the signed-in role; the API enforces the same boundary, so this is a convenience, not the
 * permission.
 *
 * Pure, so the rules can be tested without a request or a browser.
 */

import { personaFor } from "@/lib/roles";
import type { UserRole } from "@/lib/types";

export type CaseCreationKind = "institutional" | "personal";

export function caseCreationKind(role: UserRole): CaseCreationKind {
  const persona = personaFor(role);
  return persona === "instructor" || persona === "admin" ? "institutional" : "personal";
}

/** Where a newly created case is opened. */
export function createdCaseHref(kind: CaseCreationKind, id: string): string {
  return kind === "institutional" ? `/cases/${id}` : `/personal-cases/${id}`;
}

export type CaseSaved = { id: string; published?: boolean };

/**
 * What a wizard does once the case is saved. Used on its own page, it goes to the case, as it always
 * has. Inside the Procedures modal the caller supplies `onDone`, so the user stays on Procedures,
 * with the dialog closed and the new case in the list, instead of being sent away mid-task.
 */
export function afterCaseSaved(
  saved: CaseSaved,
  options: {
    onDone?: (saved: CaseSaved) => void;
    href: string;
    push: (href: string) => void;
  },
): void {
  if (options.onDone) options.onDone(saved);
  else options.push(options.href);
}

/**
 * Whether the content of a dialog should exist yet. It is created the first time the dialog opens and
 * then kept, so closing the dialog by accident does not throw away a half-filled wizard.
 */
export function shouldMountDialogContent(open: boolean, everOpened: boolean): boolean {
  return open || everOpened;
}

/**
 * The first checklist item of both wizards: a title, a pathology, and a knee side that someone
 * actually chose. A side that is only the form's preselected placeholder on a case that records none
 * does not count, so editing such a case cannot save "right" by accident.
 */
export function isCaseInfoComplete(input: {
  title: string;
  side: string;
  sideChosen: boolean;
  pathology: string;
}): boolean {
  return input.title.trim().length > 0 && Boolean(input.side) && input.sideChosen && Boolean(input.pathology);
}
