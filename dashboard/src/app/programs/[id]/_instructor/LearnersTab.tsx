import Link from "next/link";
import { Users, Calendar } from "lucide-react";
import { SectionHeader } from "@/components/shell";
import { Badge, Button, Chip, EmptyState, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { getCohort, getCohortSessions, getSessionRoster } from "@/lib/data/cohorts";
import { getReportsList } from "@/lib/data/performance";
import { clock, relativeTime, shortDate, titleCase } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/roles";
import { PASS_MARK, type Difficulty, type Profile } from "@/lib/types";
import p from "@/app/panels.module.css";
import { CohortChips } from "./CohortChips";
import { SessionPicker } from "./SessionPicker";

/**
 * Learners and how they performed — one list, not a separate learners page.
 *
 * With no session chosen it shows each learner's record across the cohort. Choosing a session
 * narrows it to that session's roster: who took part, who finished, and the score and outcome
 * from the report when one exists.
 */
export async function LearnersTab({
  user,
  programId,
  cohorts,
  cohortId,
  sessionId,
}: {
  user: Profile;
  programId: string;
  cohorts: { id: string; name: string }[];
  cohortId: string | undefined;
  sessionId: string | undefined;
}) {
  if (cohorts.length === 0 || !cohortId) {
    return (
      <EmptyState icon={Users} title="No cohorts yet">
        Create a cohort in the Cohorts tab, then add learners to see how they perform here.
      </EmptyState>
    );
  }

  const [detail, sessions, reports] = await Promise.all([
    getCohort(cohortId),
    getCohortSessions(cohortId),
    getReportsList(user).catch(() => []),
  ]);

  if (!detail) {
    return (
      <EmptyState icon={Users} title="This cohort could not be loaded">
        It may have been removed, or you may not supervise it.
      </EmptyState>
    );
  }

  const now = new Date().toISOString();
  const selected = sessions.find((s) => s.id === sessionId);
  const baseHref = `/programs/${programId}?tab=learners&cohort=${cohortId}`;

  // Newest first, so the session an instructor just ran is the first one offered.
  const ordered = [...sessions].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  const roster = selected ? await getSessionRoster(selected.id) : [];

  return (
    <>
      <CohortChips programId={programId} tab="learners" cohorts={cohorts} selectedId={cohortId} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--s-3)", flexWrap: "wrap", marginBottom: "var(--s-4)" }}>
        <SessionPicker
          baseHref={baseHref}
          value={selected?.id ?? ""}
          allLabel="All sessions (overall record)"
          options={ordered.map((s) => ({
            value: s.id,
            label: `${s.name} · ${shortDate(s.scheduledAt)}${s.caseName ? ` · ${s.caseName}` : ""}`,
          }))}
        />
        <Button variant="secondary" size="sm" href={`/programs/${programId}/cohorts/${cohortId}?tab=enrollment`}>
          Enrol learners
        </Button>
      </div>

      {selected ? (
        <SessionView
          session={selected}
          roster={roster}
          reports={reports}
          clearHref={baseHref}
        />
      ) : (
        <>
          <SectionHeader title={`Learners in ${detail.cohort.name}`} />
          {detail.learners.length === 0 ? (
            <EmptyState icon={Users} title="Nobody has joined yet">
              Provision new learner accounts or enrol existing ones from the cohort workspace.
            </EmptyState>
          ) : (
            <Table label={`Learners in ${detail.cohort.name}`}>
              <THead>
                <Tr>
                  <Th>Learner</Th>
                  <Th>Role</Th>
                  <Th numeric>Sessions</Th>
                  <Th numeric>Assessments</Th>
                  <Th numeric>Mean</Th>
                  <Th>Weakest area</Th>
                  <Th numeric>Critical</Th>
                  <Th>Last active</Th>
                </Tr>
              </THead>
              <TBody>
                {[...detail.learners]
                  // Who needs attention first: lowest mean, then anyone who never started.
                  .sort((a, b) => (a.meanScore ?? 101) - (b.meanScore ?? 101))
                  .map((learner) => (
                    <Tr key={learner.id}>
                      <Td head>
                        <Link href={`/learners/${learner.id}`}>{learner.displayName}</Link>
                      </Td>
                      <Td>{ROLE_LABEL[learner.role]}</Td>
                      <Td numeric>{learner.sessions}</Td>
                      <Td numeric>{learner.assessments}</Td>
                      <Td numeric>{learner.meanScore ?? "—"}</Td>
                      <Td>{learner.weakestCategory ? <Chip tone="muted">{learner.weakestCategory}</Chip> : "—"}</Td>
                      <Td numeric>{learner.criticalErrors}</Td>
                      <Td>{learner.lastActiveAt ? relativeTime(learner.lastActiveAt, now) : "Never"}</Td>
                    </Tr>
                  ))}
              </TBody>
            </Table>
          )}
          <p className={p.note}>
            Pick a session above to see who took part in it and how each learner did.
          </p>
        </>
      )}
    </>
  );
}

type Roster = Awaited<ReturnType<typeof getSessionRoster>>;
type Reports = Awaited<ReturnType<typeof getReportsList>>;
type CohortSession = Awaited<ReturnType<typeof getCohortSessions>>[number];

function SessionView({
  session,
  roster,
  reports,
  clearHref,
}: {
  session: CohortSession;
  roster: Roster;
  reports: Reports;
  clearHref: string;
}) {
  const difficulty = (session.difficulty ?? "intermediate") as Difficulty;
  const passMark = PASS_MARK[difficulty] ?? 70;
  const done = roster.filter((r) => r.status === "completed").length;

  return (
    <>
      <SectionHeader
        title={session.name}
        action={
          <Link href={clearHref} className={p.clear}>
            Back to overall record
          </Link>
        }
      />
      <p className={p.panelSub} style={{ marginBottom: "var(--s-4)" }}>
        {new Date(session.scheduledAt).toLocaleString()} · {session.caseName ?? "No case"} · {titleCase(session.mode)} ·{" "}
        {titleCase(session.status.replace("_", " "))} · {done} of {roster.length} completed
      </p>

      {roster.length === 0 ? (
        <EmptyState icon={Calendar} title="No learners on this session">
          A session&rsquo;s roster is set when it is scheduled, from the cohort&rsquo;s members at that time.
        </EmptyState>
      ) : (
        <Table label={`Performance in ${session.name}`}>
          <THead>
            <Tr>
              <Th>Learner</Th>
              <Th>Status</Th>
              <Th>Completed</Th>
              <Th numeric>Duration</Th>
              <Th numeric>Score</Th>
              <Th>Outcome</Th>
              <Th>
                <span className="srOnly">Report</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {roster.map((r) => {
              const report = reports.find((x) => x.id === session.id && x.userId === r.residentId);
              const scored = report?.totalScore !== undefined;
              const passed = scored && (report!.totalScore as number) >= passMark && (report!.criticalErrors ?? 0) < 3;
              return (
                <Tr key={r.id}>
                  <Td head>
                    <Link href={`/learners/${r.residentId}`}>{r.displayName}</Link>
                  </Td>
                  <Td>
                    <Badge status={r.status === "completed" ? "pass" : "neutral"}>{titleCase(r.status.replace("_", " "))}</Badge>
                  </Td>
                  <Td>{r.completedAt ? shortDate(r.completedAt) : "—"}</Td>
                  <Td numeric>{report ? clock(report.durationS) : "—"}</Td>
                  <Td numeric>{scored ? report!.totalScore : "—"}</Td>
                  <Td>{scored ? <Badge status={passed ? "pass" : "fail"}>{passed ? "Passed" : "Not passed"}</Badge> : "—"}</Td>
                  <Td>
                    {report && (
                      <Button variant="ghost" size="sm" href={`/sessions/${session.id}/report`}>
                        Report
                      </Button>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
      <p className={p.note}>
        Scores appear once the headset has reported the session. Pass mark for {titleCase(difficulty)} is {passMark}.
      </p>
    </>
  );
}
