import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FolderOpen,
  Play,
} from "lucide-react";
import { AppShell, Breadcrumbs, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
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
import { getProgramDetail, getProgramCohorts } from "@/lib/data/programs";
import { listCases } from "@/lib/data/cases";
import { getSessionList } from "@/lib/data/sessions";
import { clock, shortDate, titleCase } from "@/lib/format";
import { cx } from "@/lib/cx";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import p from "../../panels.module.css";
import { ActivitiesTab } from "./_instructor/ActivitiesTab";
import { CohortsTab } from "./_instructor/CohortsTab";
import { LearnersTab } from "./_instructor/LearnersTab";
import { PerformanceTab } from "./_instructor/PerformanceTab";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgramDetail(id).catch(() => null);
  return { title: program ? `${program.name} · Program` : "Program Details" };
}

/**
 * The instructor's program: what learners do (Activities), who they are grouped as (Cohorts),
 * how each learner performed, session by session (Learners & Performance), and how a cohort
 * did as a whole (Cohort Performance).
 */
const PROGRAM_TABS = [
  { value: "activities", label: "Activities" },
  { value: "cohorts", label: "Cohorts" },
  { value: "learners", label: "Learners & Performance" },
  { value: "performance", label: "Cohort Performance" },
] as const;

type ProgramTab = (typeof PROGRAM_TABS)[number]["value"];

/**
 * Program workspace.
 *
 * Instructors: Activities, Cohorts, Learners & Performance, Cohort Performance.
 * Learners: their personalised curriculum, assigned cases and attempt history.
 */
export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; cohort?: string; session?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab, cohort: rawCohort, session: rawSession } = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);
  const isInstructor = persona === "instructor" || persona === "admin";

  const program = await getProgramDetail(id).catch(() => null);
  if (!program) notFound();

  // --------------------------------------------------------------------------
  // INSTRUCTOR / ADMIN WORKSPACE
  // --------------------------------------------------------------------------
  if (isInstructor) {
    // Old bookmarks (overview, curriculum, skills, assessment) land on Activities.
    const tab: ProgramTab = PROGRAM_TABS.find((t) => t.value === rawTab)?.value ?? "activities";

    const [cohorts, { cases }] = await Promise.all([
      getProgramCohorts(id).catch(() => []),
      listCases(user.id, { attempted: "all" }).catch(() => ({ cases: [] })),
    ]);

    const cohortList = cohorts.map((c) => ({ id: String(c.id), name: String(c.name) }));
    // Performance views are about one cohort at a time; default to the first.
    const cohortId = cohortList.find((c) => c.id === rawCohort)?.id ?? cohortList[0]?.id;
    const activeTabLabel = PROGRAM_TABS.find((t) => t.value === tab)?.label ?? "Activities";

    return (
      <AppShell user={user} searchHint='Try searching "programs"'>
        <Breadcrumbs
          items={[
            { label: "Programs", href: "/programs" },
            { label: program.name, href: `/programs/${program.id}` },
            { label: activeTabLabel },
          ]}
        />

        <PageHeader
          eyebrow="Program Workspace"
          title={program.name}
          lede={program.description || "Comprehensive clinical surgical simulation and procedural curriculum."}
        />

        <nav className={p.tabs} aria-label="Program sections">
          {PROGRAM_TABS.map((t) => (
            <Link
              key={t.value}
              href={t.value === "activities" ? `/programs/${program.id}` : `/programs/${program.id}?tab=${t.value}`}
              className={cx(p.tab, tab === t.value && p.tabOn)}
              aria-current={tab === t.value ? "page" : undefined}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === "activities" && <ActivitiesTab programId={program.id} cohorts={cohortList} cases={cases} />}
        {tab === "cohorts" && <CohortsTab programId={program.id} cohorts={cohorts} />}
        {tab === "learners" && (
          <LearnersTab
            user={user}
            programId={program.id}
            cohorts={cohortList}
            cohortId={cohortId}
            sessionId={rawSession}
          />
        )}
        {tab === "performance" && (
          <PerformanceTab user={user} programId={program.id} cohorts={cohortList} cohortId={cohortId} />
        )}
      </AppShell>
    );
  }

  // --------------------------------------------------------------------------
  // LEARNER DETAIL VIEW
  // --------------------------------------------------------------------------
  const [{ cases }, { sessions, stats }] = await Promise.all([
    listCases(user.id, { attempted: "all" }),
    getSessionList({}),
  ]);

  const scoredSessions = sessions.filter((s) => s.totalScore !== undefined);
  const bestScore =
    scoredSessions.length > 0
      ? Math.max(...scoredSessions.map((s) => s.totalScore as number))
      : undefined;

  const userPassMark = PASS_MARK[user.defaultDifficulty] ?? 70;
  // The next thing to do: the first case not yet attempted, else the first case.
  const nextCase = cases.find((c) => c.attempts === 0) ?? cases[0];

  return (
    <AppShell user={user} searchHint='Try searching "cases"'>
      <Breadcrumbs
        items={[
          { label: "Your Programs", href: "/programs" },
          { label: program.name },
        ]}
      />

      <PageHeader
        eyebrow="Training Program"
        title={program.name}
        lede={program.description || "Comprehensive clinical surgical simulation and procedural curriculum."}
        actions={
          nextCase ? (
            <Button variant="primary" icon={Play} href={`/cases/${nextCase.id}`}>
              {nextCase.attempts === 0 ? "Start next case" : "Practise a case"}
            </Button>
          ) : (
            <Button variant="secondary" href="/cases">
              Browse cases
            </Button>
          )
        }
      />

      {program.cohort_name && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "var(--s-2) var(--s-3)",
            background: "var(--surface-sunken)",
            border: "var(--bw) solid var(--border)",
            borderRadius: "var(--r-md)",
            marginBottom: "var(--s-5)",
          }}
        >
          <span
            style={{
              fontSize: "var(--t-caption)",
              color: "var(--text-muted)",
              fontWeight: "var(--fw-medium)",
            }}
          >
            Cohort:
          </span>
          <Chip tone="muted">{program.cohort_name}</Chip>
        </div>
      )}

      <StatRow>
        <StatCard
          label="Sessions completed"
          value={String(stats.sessions)}
          variant="dark"
        />
        <StatCard
          label="Best score"
          value={bestScore !== undefined ? String(bestScore) : "—"}
          variant="accent"
          sub={`Pass mark: ${userPassMark}`}
        />
        <StatCard
          label="Average score"
          value={stats.meanScore !== undefined ? String(stats.meanScore) : "—"}
          sub={stats.reported > 0 ? `Across ${stats.reported} attempts` : "No scored attempts"}
        />
        <StatCard
          label="Assigned cases"
          value={String(cases.length)}
          sub="Practice cases"
        />
      </StatRow>

      <SectionHeader title="Curriculum Cases" />
      {cases.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No cases assigned yet"
            action={<Button variant="primary" href="/cases">Browse cases</Button>}>
          There are no cases published in this program yet.
        </EmptyState>
      ) : (
        <div className={p.cards}>
          {cases.map((item) => {
            const passMark = PASS_MARK[item.difficulty] ?? 70;
            return (
              <Card key={item.id} padding="none" className={p.card}>
                <Link
                  href={`/cases/${item.id}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    padding: "var(--s-4)",
                  }}
                >
                  <div className={p.panelHead}>
                    <p className={p.cardTitle}>{item.title}</p>
                    {item.bestScore !== undefined ? (
                      <Badge status={item.bestScore >= passMark ? "pass" : "warn"}>
                        {item.bestScore}
                      </Badge>
                    ) : (
                      <Badge status="neutral">Not attempted</Badge>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "var(--s-2)",
                      margin: "var(--s-2) 0",
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip tone="muted">{item.pathologyLabel}</Chip>
                    <Chip tone="muted">{titleCase(item.side)} knee</Chip>
                    <Chip tone="muted">{titleCase(item.difficulty)}</Chip>
                  </div>

                  {item.summary && (
                    <p className={p.cardBody} style={{ flex: 1 }}>
                      {item.summary}
                    </p>
                  )}

                  <div className={p.cardFoot} style={{ marginTop: "var(--s-3)" }}>
                    <span style={{ fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
                      {item.attempts > 0
                        ? `${item.attempts} attempt${item.attempts === 1 ? "" : "s"}`
                        : "Unattempted"}
                    </span>
                    <span className={p.cardOpen}>
                      Plan case →
                    </span>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      <SectionHeader title="Your Recent Activity" />
      {sessions.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No sessions recorded yet">
          Complete a planning session and headset attempt to view your assessment records here.
        </EmptyState>
      ) : (
        <Table label="Program sessions">
          <THead>
            <Tr>
              <Th>Date</Th>
              <Th>Case</Th>
              <Th>Mode</Th>
              <Th>Difficulty</Th>
              <Th numeric>Duration</Th>
              <Th numeric>Score</Th>
              <Th>Status</Th>
              <Th>
                <span className="srOnly">Open</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {sessions.slice(0, 5).map((s) => (
              <Tr key={s.id}>
                <Td head>{shortDate(s.endedAt ?? s.startedAt)}</Td>
                <Td>{s.caseTitle}</Td>
                <Td>{titleCase(s.mode)}</Td>
                <Td>{titleCase(s.difficulty)}</Td>
                <Td numeric>{clock(s.durationS)}</Td>
                <Td numeric>{s.totalScore !== undefined ? s.totalScore : "—"}</Td>
                <Td>
                  <Badge status={s.status === "completed" ? "pass" : "warn"}>
                    {titleCase(s.status)}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    variant="ghost"
                    size="sm"
                    href={s.status === "completed" ? `/sessions/${s.id}/report` : `/sessions/${s.id}`}
                  >
                    {s.status === "completed" ? "Report" : "View"}
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}
