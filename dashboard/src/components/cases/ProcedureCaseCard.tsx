import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui";
import { pathologyText, sideText } from "@/lib/case-meta";
import type { CaseCard } from "@/lib/data/cases";
import { titleCase } from "@/lib/format";
import { PASS_MARK } from "@/lib/types";
import { CaseDetailsButton, type CaseDetails } from "./CaseDetailsButton";
import s from "./ProcedureCaseCard.module.css";

/**
 * A case under its procedure, kept to what a reader needs to choose one: its status (or the learner's best
 * score), its title, the side and the difficulty, and the one action that opens it.
 *
 * Everything else — the pathology, the summary, the version, the viewer's attempts — is in the pop-up the ⓘ at
 * the card's top right opens. A field the record does not have says "Not recorded".
 *
 * Learners see their own best score (and, in the pop-up, their attempts). Instructors have no attempts of
 * their own on a case, so they see its publication status and version instead.
 */
export function ProcedureCaseCard({
  item,
  staff,
}: {
  item: CaseCard;
  /** Instructor or administrator: show status instead of the viewer's own attempts. */
  staff: boolean;
}) {
  const passMark = PASS_MARK[item.difficulty] ?? 70;
  const published = item.status === "active";
  const statusLabel = published ? "Published" : titleCase(item.status ?? "draft");

  const details: CaseDetails = {
    id: item.id,
    title: item.title,
    summary: item.summary,
    status: staff ? { label: statusLabel, tone: published ? "pass" : "warn" } : null,
    fields: [
      { label: "Pathology", value: pathologyText(item) },
      { label: "Side", value: sideText(item) },
      { label: "Difficulty", value: titleCase(item.difficulty) },
      staff
        ? { label: "Version", value: `v${item.version ?? 1}` }
        : { label: "Attempts", value: String(item.attempts) },
      ...(!staff && item.bestScore !== undefined
        ? [{ label: "Best score", value: String(item.bestScore), note: `pass mark ${passMark}` }]
        : []),
    ],
  };

  return (
    <article className={s.card}>
      <div className={s.top}>
        {staff ? (
          <Badge status={published ? "pass" : "warn"}>{statusLabel}</Badge>
        ) : item.bestScore !== undefined ? (
          <Badge status={item.bestScore >= passMark ? "pass" : "warn"}>Best {item.bestScore}</Badge>
        ) : (
          <span />
        )}
        <CaseDetailsButton details={details} />
      </div>

      <h3 className={s.title} title={item.title}>
        {item.title}
      </h3>

      <p className={s.meta}>
        <span>{sideText(item)}</span>
        <span aria-hidden="true">·</span>
        <span>{titleCase(item.difficulty)}</span>
      </p>

      <Link prefetch={false} href={`/cases/${item.id}`} className={s.open}>
        Open case
        <ArrowRight aria-hidden="true" strokeWidth={2.25} />
      </Link>
    </article>
  );
}
