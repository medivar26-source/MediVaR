import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Calendar } from "lucide-react";
import { AppShell, Breadcrumbs, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { getProgramDetail } from "@/lib/data/programs";
import { getCohort, getCohortCases, getCohortSessions } from "@/lib/data/cohorts";
import { listCasesForAuthoring } from "@/lib/data/content";
import { shortDate, titleCase } from "@/lib/format";
import { cx } from "@/lib/cx";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
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

/**
 * A cohort's workspace is where it is *managed*: scheduling sessions, choosing which cases it
 * can open, and enrolling learners. How its learners are performing lives in the program's
 * "Learners & Performance" and "Cohort Performance" tabs.
 */
const COHORT_TABS = [
  { value: "sessions", label: "Sessions" },
  { value: "cases", label: "Case Access" },
  { value: "enrollment", label: "Enrollment" },
] as const;

/** Old cohort tabs and where their content moved. */
const MOVED_TABS: Record<string, string> = {
  overview: "performance",
  residents: "learners",
  reports: "learners",
};

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

  if (rawTab && MOVED_TABS[rawTab]) {
    redirect(`/programs/${programId}?tab=${MOVED_TABS[rawTab]}&cohort=${cohortId}`);
  }

  const tab: CohortTab = COHORT_TABS.find((t) => t.value === rawTab)?.value ?? "sessions";

  const { cohort, presets } = detail;

  const [cohortCases, sessions, catalogue] = await Promise.all([
    getCohortCases(cohort.id),
    getCohortSessions(cohort.id),
    listCasesForAuthoring({ status: "active" }).catch(() => ({ cases: [] })),
  ]);

  const assignableCases = catalogue.cases.map((c) => ({
    id: c.id,
    name: c.title,
    difficulty: c.difficulty,
  }));

  const assignable = presets.filter(
    (preset) => preset.ownerId === user.id || persona === "admin",
  );

  const activeTabLabel =
    COHORT_TABS.find((t) => t.value === tab)?.label ?? "Sessions";

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
        lede={`${cohort.learners} learner${cohort.learners === 1 ? "" : "s"} · owned by ${cohort.ownerName ?? "—"} · created ${shortDate(cohort.createdAt)}`}
        actions={
          <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
            <Button href={`/programs/${program.id}?tab=learners&cohort=${cohort.id}`} variant="secondary">
              Learners &amp; Performance
            </Button>
            <Button href={`/programs/${program.id}?tab=performance&cohort=${cohort.id}`} variant="secondary">
              Cohort Performance
            </Button>
            <Button href={`/programs/${program.id}?tab=cohorts`} variant="secondary">
              All Cohorts
            </Button>
          </div>
        }
      />

      {/* Cohort Workspace Navigation Tabs */}
      <nav className={p.tabs} aria-label="Cohort sections">
        {COHORT_TABS.map((t) => (
          <Link
            key={t.value}
            href={`/programs/${program.id}/cohorts/${cohort.id}?tab=${t.value}`}
            className={cx(p.tab, tab === t.value && p.tabOn)}
            aria-current={tab === t.value ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

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
          <SectionHeader title="Enrollment & Learner Provisioning" />
          <section className={p.panel} aria-label="Manage Learners">
            <div>
              <p className={p.panelTitle}>Provision Learners</p>
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
