import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Users, Calendar, FileText, FolderOpen } from "lucide-react";
import { AppShell, Breadcrumbs, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  ProgressBar,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { RankedList, StatCard, StatRow } from "@/components/viz";
import { getProgramDetail } from "@/lib/data/programs";
import {
  getCohort,
  getCohortCases,
  getCohortSessions,
  type SessionSummary,
} from "@/lib/data/cohorts";
import { listCasesForAuthoring } from "@/lib/data/content";
import { getReportsList } from "@/lib/data/performance";
import { clock, relativeTime, shortDate, titleCase } from "@/lib/format";
import { cx } from "@/lib/cx";
import { personaFor, ROLE_LABEL } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import { AssignPreset } from "@/app/cohorts/AssignPreset";
import { ManageLearnersPanel } from "@/app/cohorts/ManageLearnersPanel";
import { AssignCasesPanel } from "@/app/cohorts/AssignCasesPanel";
import { NewSession } from "@/app/cohorts/NewSession";
import { EditSessionModal } from "@/app/cohorts/EditSessionModal";
import { CancelSessionButton } from "@/app/cohorts/CancelSessionButton";
import p from "@/app/panels.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; cohortId: string }>;
}): Promise<Metadata> {
  const { cohortId } = await params;
  const detail = await getCohort(cohortId).catch(() => null);
  return {
    title: detail?.cohort ? `${detail.cohort.name} · Cohort Workspace` : "Cohort Workspace",
  };
}

const COHORT_TABS = [
  { value: "overview", label: "Overview" },
  { value: "residents", label: "Residents" },
  { value: "sessions", label: "Sessions" },
  { value: "reports", label: "Reports" },
  { value: "cases", label: "Case Access" },
  { value: "enrollment", label: "Enrollment" },
] as const;

type CohortTab = (typeof COHORT_TABS)[number]["value"];

export default async function CohortWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; cohortId: string }>;
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const { id: programId, cohortId } = await params;
  const { tab: rawTab, status: sessionStatusFilter } = await searchParams;

  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") {
    redirect(`/programs/${programId}`);
  }

  const [program, detail] = await Promise.all([
    getProgramDetail(programId).catch(() => null),
    getCohort(cohortId).catch(() => null),
  ]);

  if (!program || !detail) {
    notFound();
  }

  const tab: CohortTab =
    (COHORT_TABS.find((t) => t.value === rawTab)?.value ?? "overview") as CohortTab;

  const { cohort, learners, categories, hotspots, presets } = detail;

  const [cohortCases, sessions, catalogue, allReports] = await Promise.all([
    getCohortCases(cohort.id),
    getCohortSessions(cohort.id),
    listCasesForAuthoring({ status: "active" }).catch(() => ({ cases: [] })),
    getReportsList(user).catch(() => []),
  ]);

  const assignableCases = catalogue.cases.map((c) => ({
    id: c.id,
    name: c.title,
    difficulty: c.difficulty,
  }));

  const now = new Date().toISOString();
  const scored = learners.filter((l) => l.meanScore !== undefined);

  const assignable = presets.filter(
    (preset) => preset.ownerId === user.id || persona === "admin",
  );

  const activeTabLabel =
    COHORT_TABS.find((t) => t.value === tab)?.label ?? "Overview";

  // Filter cohort sessions based on session status chip
  const filterKey = (sessionStatusFilter ?? "all").toLowerCase();
  const filteredSessions = sessions.filter((s) => {
    if (filterKey === "all") return true;
    if (filterKey === "upcoming") return s.status === "scheduled";
    if (filterKey === "live") return s.status === "in_progress" || s.status === "live";
    if (filterKey === "interrupted") return s.status === "cancelled" || s.status === "aborted";
    if (filterKey === "completed") return s.status === "completed";
    return true;
  });

  // Filter reports belonging to learners of this cohort
  const cohortLearnerIds = new Set(learners.map((l) => l.id));
  const cohortReports = allReports.filter((r) => cohortLearnerIds.has(r.userId));

  return (
    <AppShell user={user} searchHint='Try searching "cohorts"'>
      <Breadcrumbs
        items={[
          { label: "Programs", href: "/programs" },
          { label: program.name, href: `/programs/${program.id}` },
          { label: "Cohorts", href: `/programs/${program.id}?tab=cohorts` },
          {
            label: cohort.name,
            href: `/programs/${program.id}/cohorts/${cohort.id}`,
          },
          { label: activeTabLabel },
        ]}
      />

      <PageHeader
        eyebrow={`Program: ${program.name}`}
        title={cohort.name}
        lede={`${cohort.learners} resident${cohort.learners === 1 ? "" : "s"} · owned by ${cohort.ownerName ?? "—"} · created ${shortDate(cohort.createdAt)}`}
        actions={
          <Button
            href={`/programs/${program.id}?tab=cohorts`}
            variant="secondary"
          >
            All Cohorts
          </Button>
        }
      />

      {/* Cohort Workspace Navigation Tabs */}
      <nav className={p.tabs} aria-label="Cohort sections">
        {COHORT_TABS.map((t) => (
          <Link
            key={t.value}
            href={
              t.value === "overview"
                ? `/programs/${program.id}/cohorts/${cohort.id}`
                : `/programs/${program.id}/cohorts/${cohort.id}?tab=${t.value}`
            }
            className={cx(p.tab, tab === t.value && p.tabOn)}
            aria-current={tab === t.value ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {/* 1. OVERVIEW TAB */}
      {tab === "overview" && (
        <>
          <StatRow>
            <StatCard
              label="Mean score"
              value={cohort.meanScore !== undefined ? String(cohort.meanScore) : "—"}
              variant="accent"
              sub={
                cohort.meanScore === undefined
                  ? "no scored reports yet"
                  : `across ${scored.length} resident${scored.length === 1 ? "" : "s"}`
              }
            />
            <StatCard
              label="Below pass"
              value={String(cohort.belowPass)}
              variant="accent"
              sub="against intermediate mark"
            />
            <StatCard
              label="Critical errors"
              value={String(
                learners.reduce((sum, l) => sum + l.criticalErrors, 0),
              )}
              variant="accent"
              sub="across every session"
            />
            <StatCard
              label="No sessions yet"
              value={String(learners.filter((l) => l.sessions === 0).length)}
              variant="accent"
              sub="have not performed once"
            />
          </StatRow>

          <div className={p.even}>
            <section className={p.panel} aria-label="Cohort weakness profile">
              <div>
                <p className={p.panelTitle}>Weakness profile</p>
                <p className={p.panelSub}>
                  What this cohort is weak <em>at</em>. Every scored report from a member, averaged across the assessment categories.
                </p>
              </div>
              {categories.length === 0 ? (
                <p className={p.panelSub}>
                  No scored reports yet, so there is nothing to average.
                </p>
              ) : (
                <div className={p.rows}>
                  {categories.map((category) => (
                    <div key={category.key} className={p.row}>
                      <div className={p.rowBody}>
                        <p className={p.rowTitle}>{category.label}</p>
                        <ProgressBar
                          value={category.pct}
                          threshold={70}
                          tone={category.pct >= 70 ? "pass" : "warn"}
                        />
                      </div>
                      <div className={p.rowAside}>
                        <Badge status={category.pct >= 70 ? "pass" : "warn"}>
                          {category.pct}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={p.panel} aria-label="Scene hotspots">
              <div>
                <p className={p.panelTitle}>Scene hotspots</p>
                <p className={p.panelSub}>
                  <em>Where</em> in the operation it goes wrong. The scenes that most often ended in a failed or borderline verdict.
                </p>
              </div>
              {hotspots.length === 0 ? (
                <p className={p.panelSub}>
                  No scene has cost this cohort marks yet.
                </p>
              ) : (
                <RankedList
                  items={hotspots.map((hotspot) => ({
                    tag: hotspot.scene,
                    label: hotspot.label,
                    value: `${hotspot.affected}`,
                    pct: hotspot.learners
                      ? Math.round((hotspot.affected / hotspot.learners) * 100)
                      : 0,
                  }))}
                />
              )}
            </section>
          </div>
        </>
      )}

      {/* 2. RESIDENTS TAB */}
      {tab === "residents" && (
        <>
          <SectionHeader
            title="Enrolled Residents"
            action={
              <Button
                variant="secondary"
                size="sm"
                href={`/programs/${program.id}/cohorts/${cohort.id}?tab=enrollment`}
              >
                Enroll resident
              </Button>
            }
          />
          {learners.length === 0 ? (
            <EmptyState icon={Users} title="Nobody has joined yet">
              Provision new resident accounts or enroll existing residents using the Enrollment tab.
            </EmptyState>
          ) : (
            <Table label={`Residents in ${cohort.name}`}>
              <THead>
                <Tr>
                  <Th>Resident</Th>
                  <Th>Role</Th>
                  <Th numeric>Sessions</Th>
                  <Th numeric>Assessments</Th>
                  <Th numeric>Mean</Th>
                  <Th>Weakest</Th>
                  <Th numeric>Critical</Th>
                  <Th>Last active</Th>
                </Tr>
              </THead>
              <TBody>
                {learners.map((learner) => (
                  <Tr key={learner.id}>
                    <Td head>
                      <Link href={`/cohorts/learners/${learner.id}`}>
                        {learner.displayName}
                      </Link>
                    </Td>
                    <Td>{ROLE_LABEL[learner.role]}</Td>
                    <Td numeric>{learner.sessions}</Td>
                    <Td numeric>{learner.assessments}</Td>
                    <Td numeric>{learner.meanScore ?? "—"}</Td>
                    <Td>
                      {learner.weakestCategory ? (
                        <Chip tone="muted">{learner.weakestCategory}</Chip>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td numeric>{learner.criticalErrors}</Td>
                    <Td>
                      {learner.lastActiveAt
                        ? relativeTime(learner.lastActiveAt, now)
                        : "Never"}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}

          <p className={p.note}>
            The pass mark is 70 for intermediate simulations. A resident&rsquo;s individual reports reflect the standard applicable to each session.
          </p>
        </>
      )}

      {/* 3. SESSIONS TAB (WITH STATUS FILTERS IN PAGE) */}
      {tab === "sessions" && (
        <>
          <SectionHeader title="Schedule a Session" />
          <section className={p.panel} aria-label="Schedule session">
            <div>
              <p className={p.panelTitle}>New Training Session</p>
              <p className={p.panelSub}>
                Plan upcoming training labs or assessment sessions for this cohort from one of the assigned cases below. Every current cohort resident is added to the roster.
              </p>
            </div>
            <NewSession cohortId={cohort.id} cases={cohortCases} />
          </section>

          <SectionHeader title="Cohort Sessions" />

          {/* Session Status Filter Chips: [All] [Upcoming] [Live] [Interrupted] [Completed] */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "var(--s-4)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "var(--t-caption)",
                color: "var(--text-muted)",
                fontWeight: "var(--fw-medium)",
                marginRight: "0.25rem",
              }}
            >
              Status:
            </span>
            {[
              { id: "all", label: "All" },
              { id: "upcoming", label: "Upcoming" },
              { id: "live", label: "Live" },
              { id: "interrupted", label: "Interrupted" },
              { id: "completed", label: "Completed" },
            ].map((f) => {
              const on = filterKey === f.id;
              return (
                <Link
                  key={f.id}
                  href={
                    f.id === "all"
                      ? `/programs/${program.id}/cohorts/${cohort.id}?tab=sessions`
                      : `/programs/${program.id}/cohorts/${cohort.id}?tab=sessions&status=${f.id}`
                  }
                  style={{ textDecoration: "none" }}
                >
                  <Chip tone={on ? "default" : "muted"}>{f.label}</Chip>
                </Link>
              );
            })}
          </div>

          {filteredSessions.length === 0 ? (
            <EmptyState icon={Calendar} title="No sessions match this status">
              {sessions.length === 0
                ? "Schedule a session above to organize training dates for this cohort."
                : "No sessions currently found with this status filter."}
            </EmptyState>
          ) : (
            <Table label={`Sessions in ${cohort.name}`}>
              <THead>
                <Tr>
                  <Th>Session Name</Th>
                  <Th>Case</Th>
                  <Th>Mode</Th>
                  <Th>Scheduled Date & Time</Th>
                  <Th numeric>Duration</Th>
                  <Th>Status</Th>
                  <Th>Roster</Th>
                  <Th>Actions</Th>
                </Tr>
              </THead>
              <TBody>
                {filteredSessions.map((session) => {
                  const statusBadge =
                    session.status === "in_progress" || session.status === "live"
                      ? "active"
                      : session.status === "scheduled"
                        ? "warn"
                        : session.status === "cancelled" || session.status === "aborted"
                          ? "fail"
                          : "neutral";

                  return (
                    <Tr key={session.id}>
                      <Td head>
                        <div>
                          <strong>{session.name}</strong>
                          {session.description && (
                            <div style={{ fontSize: "0.85rem", opacity: 0.7 }}>
                              {session.description}
                            </div>
                          )}
                        </div>
                      </Td>
                      <Td>{session.caseName ?? "—"}</Td>
                      <Td>
                        <Chip tone="muted">{titleCase(session.mode)}</Chip>
                      </Td>
                      <Td>{new Date(session.scheduledAt).toLocaleString()}</Td>
                      <Td numeric>{session.duration} mins</Td>
                      <Td>
                        <Badge status={statusBadge}>
                          {titleCase(session.status.replace("_", " "))}
                        </Badge>
                      </Td>
                      <Td>
                        {session.completedCount} / {session.residentCount}
                      </Td>
                      <Td>
                        {(session.status === "scheduled" ||
                          session.status === "in_progress" ||
                          session.status === "live") && (
                          <div
                            style={{
                              display: "inline-flex",
                              gap: "0.5rem",
                              alignItems: "center",
                            }}
                          >
                            <EditSessionModal session={session} />
                            <CancelSessionButton
                              sessionId={session.id}
                              cohortId={cohort.id}
                            />
                          </div>
                        )}
                        {session.status === "completed" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            href={`/sessions/${session.id}/report`}
                          >
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
        </>
      )}

      {/* 4. REPORTS TAB */}
      {tab === "reports" && (
        <>
          <SectionHeader title="Cohort Performance Reports" />
          {cohortReports.length === 0 ? (
            <EmptyState icon={FileText} title="No cohort reports yet">
              Evaluation reports appear here once residents in this cohort complete simulations in the headset.
            </EmptyState>
          ) : (
            <Table label="Cohort Reports">
              <THead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Resident</Th>
                  <Th>Case</Th>
                  <Th>Mode</Th>
                  <Th>Difficulty</Th>
                  <Th numeric>Duration</Th>
                  <Th numeric>Score</Th>
                  <Th>Outcome</Th>
                  <Th>
                    <span className="srOnly">Open</span>
                  </Th>
                </Tr>
              </THead>
              <TBody>
                {cohortReports.map((report) => {
                  const passMark = PASS_MARK[report.difficulty];
                  const scored = report.totalScore !== undefined;
                  const passed =
                    scored &&
                    (report.totalScore as number) >= passMark &&
                    report.criticalErrors < 3;

                  return (
                    <Tr key={report.id}>
                      <Td head>{shortDate(report.endedAt ?? report.startedAt)}</Td>
                      <Td>{report.learnerName ?? "—"}</Td>
                      <Td>{report.caseTitle}</Td>
                      <Td>{titleCase(report.mode)}</Td>
                      <Td>{titleCase(report.difficulty)}</Td>
                      <Td numeric>{clock(report.durationS)}</Td>
                      <Td numeric>{scored ? report.totalScore : "—"}</Td>
                      <Td>
                        {scored && (
                          <Badge status={passed ? "pass" : "fail"}>
                            {passed ? "Passed" : "Not passed"}
                          </Badge>
                        )}
                      </Td>
                      <Td>
                        <Button
                          variant="ghost"
                          size="sm"
                          href={`/sessions/${report.id}/report`}
                        >
                          Report
                        </Button>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </>
      )}

      {/* 5. CASE ACCESS TAB */}
      {tab === "cases" && (
        <>
          <SectionHeader title="Case Access" />
          <section className={p.panel} aria-label="Assign cases">
            <div>
              <p className={p.panelTitle}>Accessible Cases</p>
              <p className={p.panelSub}>
                Select which cases from the Case Library are available to this cohort. Every resident in the cohort receives access through membership.
              </p>
            </div>
            <AssignCasesPanel
              cohortId={cohort.id}
              assignedCaseIds={cohortCases.map((c) => c.id)}
              cases={assignableCases}
            />
          </section>

          <SectionHeader title="Configuration Preset" />
          <section className={p.panel} aria-label="Configuration preset">
            <div>
              <p className={p.panelTitle}>Cohort Preset</p>
              <p className={p.panelSub}>
                {cohort.presetName
                  ? `New plans from this cohort are stamped with ${cohort.presetName}, and every session run from one names it on its report.`
                  : "New plans from this cohort run against authored tolerances."}
              </p>
            </div>

            {assignable.length === 0 ? (
              <p className={p.panelSub}>
                You have no presets to assign. A preset is created from the Configure panel on a case.
              </p>
            ) : (
              <AssignPreset
                cohortId={cohort.id}
                currentPresetId={cohort.presetId}
                presets={assignable.map((preset) => ({
                  id: preset.id,
                  name: preset.name,
                }))}
              />
            )}
          </section>
        </>
      )}

      {/* 6. ENROLLMENT TAB */}
      {tab === "enrollment" && (
        <>
          <SectionHeader title="Enrollment & Resident Provisioning" />
          <section className={p.panel} aria-label="Manage Residents">
            <div>
              <p className={p.panelTitle}>Provision Residents</p>
              <p className={p.panelSub}>
                Directly provision new resident accounts or enroll existing residents into this cohort using their unique Learner ID.
              </p>
            </div>
            <ManageLearnersPanel cohortId={cohort.id} />
          </section>
        </>
      )}
    </AppShell>
  );
}
