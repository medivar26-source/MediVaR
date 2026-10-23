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
  DemoDataNote,
  StatStrip,
} from "@/components/ui";
import { asMode, asStatus, getSessionList } from "@/lib/data/sessions";
import { clock, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { personaFor } from "@/lib/roles";
import { SessionActions } from "@/components/sessions/SessionActions";
import { isSampleSession } from "@/lib/data/session-links";
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
      {/* One treatment for every role, as the learner review set it: no eyebrow, the totals as a compact
          strip above the list they summarise, and a note that says which parts are sample data. */}
      <PageHeader
        title="Sessions"
        lede={
          persona === "learner"
            ? "Open a session to see its report."
            : "Every session in your cohorts. Schedule new ones from a cohort’s Sessions tab."
        }
        actions={
          persona !== "learner" ? (
            <Button variant="primary" href="/programs?tab=cohorts">
              Schedule a session
            </Button>
          ) : (
            <Button variant="secondary" href="/plans">
              Pre-op plans
            </Button>
          )
        }
      />
      <DemoDataNote
        sample="scores, reports and past headset sessions"
        live={persona === "learner" ? "the sessions scheduled for you" : "the sessions scheduled in your cohorts"}
      />

      <StatStrip
        label="Session totals"
        items={[
          { label: "Sessions", value: stats.sessions, note: filtered ? "Matching these filters" : "All time" },
          {
            label: "Mean score",
            value: stats.meanScore ?? "—",
            note:
              stats.reported === 0
                ? "No reports yet"
                : `Across ${stats.reported} report${stats.reported === 1 ? "" : "s"}`,
          },
          {
            label: "Below pass mark",
            value: stats.belowPass,
            note: stats.reported === 0 ? "Nothing scored yet" : "Of those reported",
          },
          {
            label: "In progress",
            value: stats.live,
            note: stats.live === 0 ? "Nothing running" : "Running now",
          },
        ]}
      />

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
                ) : persona === "learner" ? (
                  <Button variant="primary" href="/cases">
                    Browse cases
                  </Button>
                ) : (
                  <Button variant="primary" href="/programs?tab=cohorts">
                    Open cohorts
                  </Button>
                )
              }
            >
              {filtered
                ? "Clear one of them, or widen the timeframe."
                : persona === "learner"
                  ? "Plan a case on the desktop, then perform it in the headset. The report compares the two."
                  : "Open a cohort and schedule a training or assessment session from one of its assigned cases."}
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
                    <Td head>{shortDate(session.scheduledAt ?? session.endedAt ?? session.startedAt)}</Td>
                    <Td>
                      {session.caseTitle}
                      {isSampleSession(session.id) && (
                        <>
                          {" "}
                          <Chip tone="muted">Sample</Chip>
                        </>
                      )}
                    </Td>
                    <Td>{titleCase(session.mode)}</Td>
                    <Td>
                      {session.design ?? "—"} · {session.fixation ? titleCase(session.fixation) : "—"}
                    </Td>
                    <Td numeric>{session.durationS ? clock(session.durationS) : session.duration ? `${session.duration}m` : "—"}</Td>
                    <Td numeric>{score ?? "—"}</Td>
                    <Td>
                      {/* A Badge announces a verdict; "Interrupted" and "No
                          report" are lifecycle facts, so they are Chips The verdict itself is the one the
                          report stored, not a re-marking. */}
                      {session.status === "scheduled" ? (
                        <Badge status="warn">Upcoming</Badge>
                      ) : session.status === "live" ? (
                        <Badge status="active">In progress</Badge>
                      ) : session.status === "cancelled" ? (
                        <Chip tone="muted">Cancelled</Chip>
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
                      <SessionActions session={session} />
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
