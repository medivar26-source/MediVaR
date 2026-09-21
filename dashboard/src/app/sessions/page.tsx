import type { Metadata } from "next";
import { Activity } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { asMode, asStatus, getSessionList } from "@/lib/data/sessions";
import { clock, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { personaFor } from "@/lib/roles";
import { SessionFilters } from "./SessionFilters";
import s from "./sessions.module.css";

export const metadata: Metadata = { title: "Sessions" };

/**
 * Every session this viewer may see
 *
 * The scope is the store's answer, not this page's: a learner gets
 * their own, an instructor their cohort's, an admin all of them, from one
 * unfiltered query. The heading changes because the question changes; the query
 * does not, because a second implementation of the boundary is the one that
 * goes wrong.
 *
 * Filters live in the URL, as they do on `/cases` — a filtered view has to
 * survive a reload and be pasteable into a message.
 */
export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  const filters = {
    status: asStatus(params.status),
    mode: asMode(params.mode),
    caseId: params.case,
  };

  // The list and its figures arrive together from one accessor, counted over
  // the same filtered query — so the stats and the table can never disagree,
  // and a filter changes both together.
  const { sessions, stats } = await getSessionList(filters, user);

  const filtered = Boolean(filters.status || filters.mode || filters.caseId);

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        eyebrow={persona === "learner" ? "Your history" : "Cohort history"}
        title="Sessions"
        lede={
          persona === "learner"
            ? "Every case you have performed in the headset, and what each one scored."
            : "Every session you supervise. Open one to see the report it produced."
        }
      />

      <StatRow>
        <StatCard
          label="Sessions"
          value={stats.sessions}
          variant="accent"
          sub={filtered ? "Matching these filters" : "All time"}
        />
        <StatCard
          label="Mean score"
          value={stats.meanScore ?? "—"}
          variant="accent"
          sub={
            stats.reported === 0
              ? "No reports yet"
              : `Across ${stats.reported} report${stats.reported === 1 ? "" : "s"}`
          }
        />
        <StatCard
          label="Below pass mark"
          value={stats.belowPass}
          variant="accent"
          sub={stats.reported === 0 ? "Nothing scored yet" : "Of those reported"}
        />
        <StatCard
          label="In progress"
          value={stats.live}
          variant="accent"
          sub={stats.live === 0 ? "Nothing running" : "Running now"}
        />
      </StatRow>

      <div className={s.filterWrap}>
        <SessionFilters
          status={filters.status}
          mode={filters.mode}
          caseId={filters.caseId}
        />
      </div>

      <Card padding="none">
        <CardHeader
          flush
          title={filtered ? "Matching sessions" : "All sessions"}
          subtitle={`${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
        />

        {sessions.length === 0 ? (
          <div className={s.emptyWrap}>
            <EmptyState
              icon={Activity}
              title={filtered ? "No sessions match these filters" : "No sessions yet"}
              action={
                filtered ? (
                  <Button variant="secondary" href="/sessions">
                    Clear filters
                  </Button>
                ) : (
                  <Button variant="primary" href="/cases">
                    Browse cases
                  </Button>
                )
              }
            >
              {filtered
                ? "Clear one of them, or widen the timeframe."
                : "Plan a case on the desktop, then perform it in the headset. The report compares the two."}
            </EmptyState>
          </div>
        ) : (
          <Table label="Sessions">
            <THead>
              <Tr>
                <Th>Date</Th>
                <Th>Case</Th>
                <Th>Mode</Th>
                <Th>Variant</Th>
                <Th numeric>Duration</Th>
                <Th numeric>Score</Th>
                <Th>Status</Th>
                <Th>{/* row action */}</Th>
              </Tr>
            </THead>
            <TBody>
              {sessions.map((session) => {
                const score = session.totalScore;

                return (
                  <Tr key={session.id}>
                    <Td head>{shortDate(session.endedAt ?? session.startedAt)}</Td>
                    <Td>{session.caseTitle}</Td>
                    <Td>{titleCase(session.mode)}</Td>
                    <Td>
                      {session.design} · {titleCase(session.fixation)}
                    </Td>
                    <Td numeric>{clock(session.durationS)}</Td>
                    <Td numeric>{score ?? "—"}</Td>
                    <Td>
                      {/* A Badge announces a verdict; "Interrupted" and "No
                          report" are lifecycle facts, so they are Chips The verdict itself is the one the
                          report stored, not a re-marking. */}
                      {session.status === "live" ? (
                        <Badge status="active">In progress</Badge>
                      ) : session.status === "aborted" ? (
                        <Chip tone="muted">Interrupted</Chip>
                      ) : score === undefined ? (
                        <Chip tone="muted">No report</Chip>
                      ) : session.passed === false ? (
                        <Badge status="fail">Below pass mark</Badge>
                      ) : (
                        <Badge status="pass">Passed</Badge>
                      )}
                    </Td>
                    <Td>
                      {/* The destination is what actually exists for this row.
                          A running session has a live mirror and no report; a
                          finished one has a report. Linking to a report that
                          has not been generated would be a control that cannot
                          be used */}
                      <Button
                        variant="ghost"
                        size="sm"
                        href={
                          score !== undefined
                            ? `/sessions/${session.id}/report`
                            : `/sessions/${session.id}`
                        }
                      >
                        {score !== undefined ? "Report" : "Open"}
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>
    </AppShell>
  );
}
