"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { Dialog } from "@/components/ui/Dialog";
import s from "./CaseDetailsButton.module.css";

/** Everything the pop-up shows, already worded by the card, so this file formats nothing of its own. */
export type CaseDetails = {
  id: string;
  title: string;
  summary?: string;
  /** The status the viewer sees: "Published" or a draft state for staff, null for a learner. */
  status: { label: string; tone: "pass" | "warn" } | null;
  fields: { label: string; value: string; note?: string }[];
};

/**
 * The ⓘ at the top right of a case card. It opens a small pop-up with the case's full details, so the card
 * itself can stay down to a title, a status and one line. The button names the case it belongs to, because a
 * page of cards would otherwise read "Case details" six times to a screen reader.
 */
export function CaseDetailsButton({ details }: { details: CaseDetails }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={s.trigger}
        aria-haspopup="dialog"
        aria-label={`Details of ${details.title}`}
        title="View details"
        onClick={() => setOpen(true)}
      >
        <Info aria-hidden="true" strokeWidth={2.25} />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={details.title} size="sm">
        <div className={s.body}>
          {details.status && <Badge status={details.status.tone}>{details.status.label}</Badge>}

          {details.summary && <p className={s.summary}>{details.summary}</p>}

          <dl className={s.fields}>
            {details.fields.map((field) => (
              <div key={field.label} className={s.field}>
                <dt>{field.label}</dt>
                <dd>
                  {field.value}
                  {field.note && <small> {field.note}</small>}
                </dd>
              </div>
            ))}
          </dl>

          <div className={s.actions}>
            <Button variant="primary" href={`/cases/${details.id}`}>
              Open case
            </Button>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
