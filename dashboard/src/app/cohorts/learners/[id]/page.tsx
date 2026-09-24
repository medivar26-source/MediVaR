import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ListChecks, Users } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Banner,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ProgressBar,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getResidentDetail } from "@/lib/data/residents";
import { ResidentApiError } from "@/lib/data/residents-api";
import { shortDate, titleCase } from "@/lib/format";
import { personaFor, ROLE_LABEL } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { AddNoteForm } from "./AddNoteForm";
import { AssignPracticeButton } from "./AssignPracticeButton";
import p from "../../../panels.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const detail = await getResidentDetail(id);
    return { title: detail ? `${detail.displayName} — Resident` : "Resident" };
  } catch {
    return { title: "Resident" };
  }
}

/**
 * The instructor's view of one resident: who they are, how they're doing,
 * where they're weak, and the running notes an instructor keeps on them.
 *
 * Identity and notes are real. Performance figures come from the same
 * seed-backed session accessors `/performance` already uses — see
 * `lib/data/residents.ts` for why, and why that's the honest choice rather
 * than fabricating numbers against a real person's account.
 */
export default async function ResidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);
  if (persona === "learner") redirect("/");

  let detail: Awaited<ReturnType<typeof getResidentDetail>>;
  try {
    detail = await getResidentDetail(id);
  } catch (err) {
    return (
      <AppShell user={user} searchHint='Try searching "learners"'>
        <BackLink />
        <Banner tone="fail" title="This resident couldn't be loaded">
          {err instanceof ResidentApiError ? err.message : "Something went wrong. Try again in a moment."}
        </Banner>
      </AppShell>
    );
  }
  if (!detail) notFound();

  const untracked = detail.status === "no-data";

  return (
    <AppShell user={user} searchHint='Try searching "learners"'>
      <BackLink />

      <PageHeader
        eyebrow={detail.cohortName ?? "No cohort"}
        title={detail.displayName}
        lede={`${ROLE_LABEL[detail.role as keyof typeof ROLE_LABEL] ?? titleCase(detail.role)}${detail.joinedAt ? ` · joined ${shortDate(detail.joinedAt)}` : ""}`}
        actions={
          <>
            <Button variant="secondary" disabled title="No training-assignment system exists yet">
              Assign training
            </Button>
            <Button variant="secondary" disabled title="No messaging system exists yet">
              Message
            </Button>
          </>
        }
      />

      <div style={{ marginBottom: "var(--s-5)" }}>
        {untracked ? (
          <Badge status="neutral">Not tracked yet</Badge>
        ) : detail.status === "at-risk" ? (
          <Badge status="fail">At risk</Badge>
        ) : (
          <Badge status="pass">On track</Badge>
        )}
      </div>

      {untracked && (
        <Banner tone="info" title="No completed sessions recorded for this resident">
          Competency, skill performance and recent cases appear here once a
          session pipeline is writing to this resident&rsquo;s record. Nothing
          below is invented in the meantime.
        </Banner>
      )}

      <StatRow>
        <StatCard
          label="Competency"
          value={detail.competency !== undefined ? `${detail.competency}%` : "—"}
          variant="accent"
          sub={
            detail.previousCompetency !== undefined && detail.competency !== undefined
              ? `${detail.competency >= detail.previousCompetency ? "+" : ""}${detail.competency - detail.previousCompetency} vs previous`
              : undefined
          }
        />
        <StatCard label="Completion" value={detail.completionPct !== undefined ? `${detail.completionPct}%` : "—"} variant="accent" />
        <StatCard label="Cases completed" value={String(detail.casesCompletedCount)} variant="accent" />
        <StatCard label="Assessments" value={String(detail.assessmentsCount)} variant="accent" sub={`of ${detail.sessionsCount} sessions`} />
      </StatRow>

      <div className={p.even}>
        <section className={p.panel} aria-label="Skill performance">
          <div>
            <p className={p.panelTitle}>Skill performance</p>
            <p className={p.panelSub}>Average share of marks per category, across every scored session.</p>
          </div>
          {detail.skillPerformance.length === 0 ? (
            <p className={p.panelSub}>No scored sessions yet.</p>
          ) : (
            <div className={p.rows}>
              {detail.skillPerformance.map((category) => (
                <div key={category.key} className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>{category.label}</p>
                    <ProgressBar value={category.pct} threshold={70} tone={category.pct >= 70 ? "pass" : "warn"} />
                  </div>
                  <div className={p.rowAside}>
                    <Badge status={category.pct >= 70 ? "pass" : "warn"}>{category.pct}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={p.panel} aria-label="Main weaknesses and recommendation">
          <div>
            <p className={p.panelTitle}>Main weaknesses</p>
            <p className={p.panelSub}>Categories under the 70% pass mark, weakest first.</p>
          </div>
          {detail.weaknesses.length === 0 ? (
            <p className={p.panelSub}>
              {untracked ? "No data to find a weakness in yet." : "Nothing under the pass mark."}
            </p>
          ) : (
            <ol style={{ margin: 0, paddingLeft: "1.2rem" }}>
              {detail.weaknesses.map((w) => (
                <li key={w.key} style={{ marginBottom: "var(--s-2)" }}>
                  {w.label} — {w.pct}%
                </li>
              ))}
            </ol>
          )}

          {detail.recommendation && (
            <>
              <p className={p.note}>
                Recommended practice: re-attempt <b>{detail.recommendation.caseTitle}</b>, their
                lowest scored case at {detail.recommendation.score}%, to work on{" "}
                {detail.recommendation.skillLabel.toLowerCase()}.
              </p>
              <AssignPracticeButton
                residentId={detail.id}
                caseId={detail.recommendation.caseId}
                caseTitle={detail.recommendation.caseTitle}
              />
            </>
          )}

          {detail.assignments.length > 0 && (
            <div style={{ marginTop: "var(--s-4)" }}>
              <p className={p.panelSub} style={{ marginBottom: "var(--s-2)" }}>
                Already assigned
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                {detail.assignments.map((a) => (
                  <li key={a.id} style={{ marginBottom: "var(--s-2)" }}>
                    {a.case_title} · {titleCase(a.status)} · by {a.assigned_by_name}, {shortDate(a.created_at)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <SectionHeader title="Recent cases" />
      {detail.recentCases.length === 0 ? (
        <EmptyState icon={ListChecks} title="No completed cases yet" />
      ) : (
        <Table label={`Recent cases for ${detail.displayName}`}>
          <THead>
            <Tr>
              <Th>Case</Th>
              <Th numeric>Score</Th>
              <Th>Result</Th>
              <Th>Date</Th>
              <Th>
                <span className="srOnly">Open</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {detail.recentCases.map((row) => (
              <Tr key={row.sessionId}>
                <Td head>{row.caseTitle}</Td>
                <Td numeric>{row.score ?? "—"}</Td>
                <Td>
                  {row.passed === undefined ? (
                    "—"
                  ) : row.passed ? (
                    <Badge status="pass">Passed</Badge>
                  ) : (
                    <Badge status="fail">Failed</Badge>
                  )}
                </Td>
                <Td>{row.date ? shortDate(row.date) : "—"}</Td>
                <Td>
                  <Button variant="ghost" size="sm" href={`/sessions/${row.sessionId}/report`} trailingIcon={ChevronRight}>
                    Review
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <StatRow>
        <StatCard label="Critical errors" value={String(detail.criticalErrorsCount)} variant="accent" sub="across every session" />
      </StatRow>

      <SectionHeader title="Instructor notes" />
      <Card padding="lg">
        <CardHeader title="Notes" subtitle={`${detail.notes.length} note${detail.notes.length === 1 ? "" : "s"}, newest first`} />
        {detail.notes.length === 0 ? (
          <EmptyState icon={Users} title="No notes yet" />
        ) : (
          <ul style={{ margin: "0 0 var(--s-5)", padding: 0, listStyle: "none" }}>
            {detail.notes.map((note) => (
              <li key={note.id} className={p.row}>
                <div className={p.rowBody}>
                  <p className={p.rowTitle}>{note.note}</p>
                  <p className={p.rowDetail}>
                    {note.instructor_name} · {shortDate(note.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <AddNoteForm residentId={detail.id} />
      </Card>
    </AppShell>
  );
}

function BackLink() {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <Link href="/cohorts/learners" className={p.clear} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
        <ChevronLeft size={16} /> Back to Learners
      </Link>
    </div>
  );
}
