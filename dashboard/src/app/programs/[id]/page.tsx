import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  FolderOpen,
  GraduationCap,
  Play,
  Users,
  Target,
  Award,
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
import { NewCohort } from "@/app/cohorts/NewCohort";
import p from "../../panels.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgramDetail(id).catch(() => null);
  return { title: program ? `${program.name} · Program` : "Program Details" };
}

const PROGRAM_TABS = [
  { value: "overview", label: "Overview" },
  { value: "curriculum", label: "Curriculum" },
  { value: "skills", label: "Skills" },
  { value: "assessment", label: "Assessment" },
  { value: "cohorts", label: "Cohorts" },
] as const;

type ProgramTab = (typeof PROGRAM_TABS)[number]["value"];

/**
 * Unified Program Workspace.
 *
 * For Instructors:
 *   Organized into the approved hierarchy:
 *   - Overview (Summary, status, statistics)
 *   - Curriculum (Cases and learning pathways assigned to program)
 *   - Skills (Competency areas and surgical skills configuration)
 *   - Assessment (Evaluation criteria, tolerances, thresholds)
 *   - Cohorts (Cohort groups belonging to this program, cohort creation & workspaces)
 *
 * For Learners:
 *   Preserves the personalized curriculum, assigned cases, and attempt history.
 */
export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);
  const isInstructor = persona === "instructor" || persona === "admin";

  const program = await getProgramDetail(id).catch(() => null);
  if (!program) notFound();

  // --------------------------------------------------------------------------
  // INSTRUCTOR / ADMIN WORKSPACE
  // --------------------------------------------------------------------------
  if (isInstructor) {
    const tab: ProgramTab =
      (PROGRAM_TABS.find((t) => t.value === rawTab)?.value ?? "overview") as ProgramTab;

    const [cohorts, { cases }] = await Promise.all([
      getProgramCohorts(id).catch(() => []),
      listCases(user.id, { attempted: "all" }).catch(() => ({ cases: [] })),
    ]);

    const totalLearners = cohorts.reduce((sum, c) => sum + (c.learners || 0), 0);
    const belowPass = cohorts.reduce(
      (sum, c) => sum + (c.below_pass ?? c.belowPass ?? 0),
      0,
    );
    const activeTabLabel =
      PROGRAM_TABS.find((t) => t.value === tab)?.label ?? "Overview";

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
          actions={
            <Button
              variant="secondary"
              href={`/programs/${program.id}?tab=cohorts`}
              icon={Users}
            >
              View Cohorts
            </Button>
          }
        />

        <nav className={p.tabs} aria-label="Program sections">
          {PROGRAM_TABS.map((t) => (
            <Link
              key={t.value}
              href={
                t.value === "overview"
                  ? `/programs/${program.id}`
                  : `/programs/${program.id}?tab=${t.value}`
              }
              className={cx(p.tab, tab === t.value && p.tabOn)}
              aria-current={tab === t.value ? "page" : undefined}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <>
            <StatRow>
              <StatCard
                label="Cohorts"
                value={String(cohorts.length)}
                variant="dark"
              />
              <StatCard
                label="Enrolled learners"
                value={String(totalLearners)}
              />
              <StatCard
                label="Below pass"
                value={String(belowPass)}
                variant="accent"
                sub="across all cohorts"
              />
              <StatCard
                label="Curriculum cases"
                value={String(cases.length)}
                sub="cases"
              />
            </StatRow>

            <SectionHeader title="Program Overview" />
            <section className={p.panel} aria-label="Program details">
              <div className={p.panelHead}>
                <div>
                  <p className={p.panelTitle}>Academic Structure</p>
                  <p className={p.panelSub}>
                    {program.description || "Core surgical simulation curriculum for Total Knee Arthroplasty (TKA)."}
                  </p>
                </div>
                <Chip tone="muted">
                  {program.status === "active" ? "Active" : "Archived"}
                </Chip>
              </div>

              <div className={p.rows}>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Program Identifier</p>
                    <p className={p.rowDetail}>{program.id}</p>
                  </div>
                </div>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Creation Date</p>
                    <p className={p.rowDetail}>{shortDate(program.created_at)}</p>
                  </div>
                </div>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Assigned Cohorts</p>
                    <p className={p.rowDetail}>
                      {cohorts.length} active cohort group{cohorts.length === 1 ? "" : "s"} under supervision.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* CURRICULUM TAB */}
        {tab === "curriculum" && (
          <>
            <SectionHeader
              title="Curriculum Cases"
              action={
                <Button variant="secondary" size="sm" href="/cases">
                  Case Library
                </Button>
              }
            />
            {cases.length === 0 ? (
              <EmptyState icon={FolderOpen} title="No curriculum cases yet">
                Browse the Case Library to author or publish surgical cases for this program.
              </EmptyState>
            ) : (
              <div className={p.cards}>
                {cases.map((item) => (
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
                        <Chip tone="muted">v{item.version ?? 1}</Chip>
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
                          {item.status ?? "Published"}
                        </span>
                        <span className={p.cardOpen}>
                          Inspect case →
                        </span>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* SKILLS TAB */}
        {tab === "skills" && (
          <>
            <SectionHeader title="Surgical Competencies & Skills" />
            <section className={p.panel} aria-label="Skills overview">
              <div>
                <p className={p.panelTitle}>Curriculum Competency Framework</p>
                <p className={p.panelSub}>
                  Core surgical milestones and procedural proficiencies evaluated throughout this program.
                </p>
              </div>

              <div className={p.rows}>
                {[
                  {
                    name: "Preoperative Radiographic Assessment",
                    desc: "Accurately identifying anatomic landmarks (femoral head center, distal condyles, tibial plateau, ankle center) and deriving MAD, AMA, mHKA, MPTA, LDFA, and PTS.",
                    tag: "Planning",
                  },
                  {
                    name: "Distal Femoral Resection",
                    desc: "Navigating cutting blocks to achieve neutral varus/valgus alignment and anatomical distal resection depth.",
                    tag: "Femoral",
                  },
                  {
                    name: "Proximal Tibial Resection",
                    desc: "Setting posterior slope and restoring neutral mechanical coronal axis with conservative resection depth.",
                    tag: "Tibial",
                  },
                  {
                    name: "Component Sizing & Seating",
                    desc: "Matching anterior-posterior and medial-lateral geometry without anterior notching, posterior overhang, or mediolateral mismatch.",
                    tag: "Sizing",
                  },
                  {
                    name: "Soft Tissue & Gap Balancing",
                    desc: "Restoring equal extension and flexion gaps and achieving ligamentous balance through conservative release.",
                    tag: "Balancing",
                  },
                ].map((skill) => (
                  <div key={skill.name} className={p.row}>
                    <div className={p.rowBody}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <p className={p.rowTitle}>{skill.name}</p>
                        <Chip tone="muted">{skill.tag}</Chip>
                      </div>
                      <p className={p.rowDetail}>{skill.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ASSESSMENT TAB */}
        {tab === "assessment" && (
          <>
            <SectionHeader title="Program Assessment Standards" />
            <section className={p.panel} aria-label="Assessment configuration">
              <div>
                <p className={p.panelTitle}>Scoring & Tolerance Thresholds</p>
                <p className={p.panelSub}>
                  Automated grading rubrics, angular tolerances, and error caps configured for this program.
                </p>
              </div>

              <div className={p.rows}>
                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Standard Pass Mark</p>
                    <p className={p.rowDetail}>
                      Residents must achieve a minimum overall score of 70% on intermediate difficulty simulations.
                    </p>
                  </div>
                  <div className={p.rowAside}>
                    <Badge status="pass">70% Threshold</Badge>
                  </div>
                </div>

                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Angular Coronal Alignment</p>
                    <p className={p.rowDetail}>
                      Mechanical axis (mHKA) must fall within ±3° of neutral (180°) for full competency marks.
                    </p>
                  </div>
                  <div className={p.rowAside}>
                    <Chip tone="muted">±3.0°</Chip>
                  </div>
                </div>

                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Resection Depth Tolerance</p>
                    <p className={p.rowDetail}>
                      Distal femoral and proximal tibial bone cuts graded within ±2 mm of the preoperative surgical plan.
                    </p>
                  </div>
                  <div className={p.rowAside}>
                    <Chip tone="muted">±2.0 mm</Chip>
                  </div>
                </div>

                <div className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>Critical Safety Violations</p>
                    <p className={p.rowDetail}>
                      More than 2 critical safety violations (e.g., neurovascular structure breach or severe notch) triggers an automatic fail verdict.
                    </p>
                  </div>
                  <div className={p.rowAside}>
                    <Badge status="fail">Max 2 Allowed</Badge>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* COHORTS TAB */}
        {tab === "cohorts" && (
          <>
            <StatRow>
              <StatCard
                label="Cohorts"
                value={String(cohorts.length)}
                variant="dark"
              />
              <StatCard label="Learners" value={String(totalLearners)} />
              <StatCard
                label="Below pass"
                value={String(belowPass)}
                variant="accent"
                sub="against the intermediate mark"
              />
            </StatRow>

            {cohorts.length === 0 ? (
              <EmptyState icon={Users} title="No cohorts yet">
                A cohort is what scopes an instructor&rsquo;s reach. Create one below to add residents and schedule sessions.
              </EmptyState>
            ) : (
              <div className={p.cards}>
                {cohorts.map((cohort) => {
                  const mean = cohort.mean_score ?? cohort.meanScore;
                  const below = cohort.below_pass ?? cohort.belowPass ?? 0;
                  const dateVal = cohort.created_at || cohort.createdAt;
                  const preset = cohort.preset_name ?? cohort.presetName ?? "Authored tolerances";

                  return (
                    <Link
                      key={cohort.id}
                      href={`/programs/${program.id}/cohorts/${cohort.id}`}
                      className={p.card}
                    >
                      <div className={p.panelHead}>
                        <p className={p.cardTitle}>{cohort.name}</p>
                        {mean !== undefined && mean !== null && (
                          <Badge status={mean >= 70 ? "pass" : "warn"}>
                            {mean}
                          </Badge>
                        )}
                      </div>
                      <p className={p.cardBody}>
                        {cohort.learners || 0} learner{(cohort.learners || 0) === 1 ? "" : "s"}
                        {mean === undefined || mean === null
                          ? " · no scored reports yet"
                          : ` · ${below} below the pass mark`}
                      </p>
                      <p className={p.cardMeta}>
                        {cohort.owner_name ?? cohort.ownerName ?? "—"} · {dateVal ? shortDate(dateVal) : "—"}
                      </p>
                      <div className={p.cardFoot}>
                        <Chip tone="muted">{preset}</Chip>
                        <span className={p.cardOpen}>
                          Open Cohort Workspace
                          <ChevronRight className={p.cardChevron} strokeWidth={2} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            <SectionHeader
              title="Supervised Learners"
              action={
                <Link href="/learners" className={p.clear}>
                  Every learner you supervise
                </Link>
              }
            />

            <SectionHeader title="Add a cohort" />
            <section className={p.panel} aria-label="Add a cohort">
              <div>
                <p className={p.panelTitle}>New cohort</p>
                <p className={p.panelSub}>
                  Create a new cohort under this program.
                </p>
              </div>
              <NewCohort programId={program.id} />
            </section>
          </>
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
