import Link from "next/link";
import { Badge } from "@/components/ui";
import { pathologyText, sideText } from "@/lib/case-meta";
import type { CaseCard } from "@/lib/data/cases";
import { titleCase } from "@/lib/format";
import { PASS_MARK } from "@/lib/types";
import s from "./ProcedureCaseCard.module.css";

/**
 * A case under its procedure. The case's metadata is shown as labelled fields rather than
 * tags, and a field the record does not have says "Not recorded". The whole card opens the
 * case; there is one action, so there is one link.
 *
 * Learners see how many times they have attempted it. Instructors have no attempts of their
 * own on a case, so they see its publication status instead.
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

  return (
    <Link prefetch={false} href={`/cases/${item.id}`} className={s.card}>
      <span className={s.head}>
        <span className={s.title}>{item.title}</span>
        {staff ? (
          <Badge status={item.status === "active" ? "pass" : "warn"}>
            {item.status === "active" ? "Published" : titleCase(item.status ?? "draft")}
          </Badge>
        ) : item.bestScore !== undefined ? (
          <Badge status={item.bestScore >= passMark ? "pass" : "warn"}>{item.bestScore}</Badge>
        ) : null}
      </span>

      {item.summary && <span className={s.summary}>{item.summary}</span>}

      <dl className={s.fields}>
        <div>
          <dt>Pathology</dt>
          <dd>{pathologyText(item)}</dd>
        </div>
        <div>
          <dt>Side</dt>
          <dd>{sideText(item)}</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>{titleCase(item.difficulty)}</dd>
        </div>
        <div>
          <dt>{staff ? "Version" : "Attempts"}</dt>
          <dd>{staff ? `v${item.version ?? 1}` : item.attempts}</dd>
        </div>
      </dl>

      <span className={s.open}>Open case →</span>
    </Link>
  );
}
