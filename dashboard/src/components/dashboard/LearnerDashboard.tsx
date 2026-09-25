import { ArrowRight, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shell";
import { Badge, type BadgeStatus, Button } from "@/components/ui";
import {
  BarChart,
  DistributionBar,
  HeroMetric,
  RankedList,
  StatCard,
  StatRow,
  TrendChart,
} from "@/components/viz";
import { clock, longDuration, shortDate, titleCase } from "@/lib/format";
import type { LearnerDashboard as Data } from "@/lib/data/dashboard";
import type { ProgramSummary } from "@/lib/data/programs";
import type { PlanRow } from "@/lib/data/plans";
import type { CaseCard } from "@/lib/data/cases";
import {
  resolveNextAction,
  enrichCasesWithStatus,
} from "@/lib/data/learner-action";
import type { Profile } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";
import { Panel } from "./ContextRow";
import { LiveDial } from "./LiveDial";
import { TabbedPanel } from "./TabbedPanel";
import { Toolbar } from "./Toolbar";
import { WEEK_OPTIONS } from "@/lib/window";
import ls from "./learner-dashboard.module.css";
import s from "./dashboard.module.css";

const CATEGORY_COLOUR = [
  "var(--brand)",
  "var(--pass)",
  "var(--dark)",
  "var(--warn)",
];

function mapBadgeTone(tone: string): BadgeStatus {
  if (tone === "brand") return "active";
  if (tone === "pass" || tone === "warn" || tone === "fail" || tone === "active") {
    return tone;
  }
  return "neutral";
}

export function LearnerDashboard({
  user,
  data,
  programs = [],
  plans = [],
  cases = [],
  weeks,
}: {
  user: Profile;
  data: Data;
  programs?: ProgramSummary[];
  plans?: PlanRow[];
  cases?: CaseCard[];
  weeks: number;
}) {
  const { stats, activeSession, latestReport } = data;
  const passMark = PASS_MARK[user.defaultDifficulty];
  const bandTotal = data.categories.reduce((a, c) => a + c.pct, 0);
  const best = Math.max(...data.categories.map((c) => c.pct));

  // 1. Resolve primary next action and enriched case statuses from real persisted data
  const nextAction = resolveNextAction({
    activeSession,
    plans,
    cases,
    latestReport,
  });
  const enrichedCases = enrichCasesWithStatus(cases, plans);
  const completedCasesCount = enrichedCases.filter(
    (c) => c.status === "completed",
  ).length;

  return (
    <>
      {/* SECTION A: Welcome & Context (PageHeader) */}
      <PageHeader
        eyebrow={
          programs.length > 0
            ? `${programs[0].name}${programs[0].cohort_name ? ` · Cohort: ${programs[0].cohort_name}` : ""}`
            : "Personal Training Cockpit"
        }
        title={`Welcome back, ${user.displayName}`}
        lede={`${user.level ?? "Learner"} · Pass mark ${passMark} · ${stats.sessionsCompleted} completed sessions · ${completedCasesCount} of ${cases.length} cases completed`}
        actions={
          <>
            {activeSession && (
              <LiveDial
                state={activeSession.state}
                initialElapsedS={activeSession.elapsedS}
                progress={activeSession.progress}
                href={`/sessions/${activeSession.session.id}`}
                label={`${activeSession.session.caseTitle}, scene ${activeSession.session.currentScene}`}
              />
            )}
            <Button variant="secondary" href="/cases">
              Browse cases
            </Button>
            <Button variant="primary" icon={Play} href={nextAction.href}>
              {nextAction.type === "continue_plan"
                ? "Continue plan"
                : nextAction.type === "ready_vr"
                  ? "VR transfer"
                  : nextAction.type === "live_session" ||
                      nextAction.type === "interrupted_session"
                    ? "Resume session"
                    : "Start simulation"}
            </Button>
          </>
        }
      />

      <div className={ls.container}>
        {/* SECTION B: Next Action Hero Banner */}
        <div className={ls.nextActionHero}>
          <div className={ls.nextActionContent}>
            <div className={ls.nextActionEyebrow}>
              <Badge status={mapBadgeTone(nextAction.badgeTone)}>
                {nextAction.badge}
              </Badge>
              <span>Next Recommended Action</span>
            </div>
            <h2 className={ls.nextActionTitle}>{nextAction.title}</h2>
            <p className={ls.nextActionSubtitle}>{nextAction.subtitle}</p>
          </div>
          <div className={ls.nextActionCta}>
            <Button variant="primary" icon={ArrowRight} href={nextAction.href}>
              {nextAction.actionLabel}
            </Button>
          </div>
        </div>

        {/* SECTION C: Enrolled Programs */}
        {programs.length > 0 && (
          <div>
            <div className={ls.sectionHeader}>
              <h3 className={ls.sectionTitle}>Your Programs</h3>
              <Link href="/programs" className={ls.sectionLink}>
                View all programs ({programs.length}) →
              </Link>
            </div>
            <div className={ls.programsGrid}>
              {programs.map((prog) => {
                const pct =
                  cases.length > 0
                    ? Math.round((completedCasesCount / cases.length) * 100)
                    : 0;
                return (
                  <Link
                    key={prog.id}
                    href={`/programs/${prog.id}`}
                    className={ls.programCard}
                  >
                    <div className={ls.programCardHead}>
                      <div>
                        <h4 className={ls.programName}>{prog.name}</h4>
                        {prog.cohort_name && (
                          <div className={ls.cohortMeta}>
                            <span>
                              Cohort:{" "}
                              <strong style={{ color: "var(--ink)" }}>
                                {prog.cohort_name}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                      <Badge
                        status={
                          pct >= 100 ? "pass" : pct > 0 ? "warn" : "neutral"
                        }
                      >
                        {pct}% complete
                      </Badge>
                    </div>
                    {prog.description && (
                      <p className={ls.programDesc}>{prog.description}</p>
                    )}
                    <div className={ls.programFoot}>
                      <span>
                        {completedCasesCount} of {cases.length} cases completed
                      </span>
                      <span className={ls.programOpen}>
                        Open curriculum <ChevronRight size={14} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION D: Assigned Cases with Lifecycle Statuses */}
        {enrichedCases.length > 0 && (
          <div>
            <div className={ls.sectionHeader}>
              <div>
                <h3 className={ls.sectionTitle}>Assigned Cases</h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--t-caption)",
                    color: "var(--text-muted)",
                  }}
                >
                  Clinical training scenarios in your active program curriculum
                </p>
              </div>
              <Link href="/cases" className={ls.sectionLink}>
                All cases ({cases.length}) →
              </Link>
            </div>
            <div className={ls.casesGrid}>
              {enrichedCases.slice(0, 6).map((c) => {
                const badgeStatus: BadgeStatus =
                  c.status === "completed"
                    ? "pass"
                    : c.status === "ready_for_vr"
                      ? "pass"
                      : c.status === "in_planning"
                        ? "active"
                        : c.status === "needs_retry"
                          ? "warn"
                          : "neutral";

                let actionHref = `/cases/${c.id}`;
                let actionText = "Start case →";
                if (c.status === "in_planning" && c.associatedPlanId) {
                  actionHref = `/plan/${c.associatedPlanId}`;
                  actionText = "Continue plan →";
                } else if (c.status === "ready_for_vr" && c.associatedPlanId) {
                  actionHref = `/plan/${c.associatedPlanId}/review`;
                  actionText = "Review & pair →";
                } else if (
                  c.status === "completed" ||
                  c.status === "needs_retry"
                ) {
                  actionHref = `/cases/${c.id}`;
                  actionText = "Review history →";
                }

                return (
                  <Link key={c.id} href={actionHref} className={ls.caseCard}>
                    <div className={ls.caseCardHead}>
                      <h4 className={ls.caseTitle}>{c.title}</h4>
                      <Badge status={badgeStatus}>{c.statusLabel}</Badge>
                    </div>
                    <div className={ls.caseChips}>
                      <span className={ls.cohortMeta}>{c.pathologyLabel}</span>
                      <span className={ls.cohortMeta}>
                        · {titleCase(c.side)}
                      </span>
                      <span className={ls.cohortMeta}>
                        · {titleCase(c.difficulty)}
                      </span>
                    </div>
                    {c.summary && <p className={ls.caseSummary}>{c.summary}</p>}
                    <div className={ls.caseFoot}>
                      <span>
                        {c.bestScore !== undefined
                          ? `Best: ${c.bestScore}/100`
                          : c.attempts > 0
                            ? `${c.attempts} attempt${c.attempts > 1 ? "s" : ""}`
                            : "No attempts yet"}
                      </span>
                      <span className={ls.caseAction}>{actionText}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION E: Active Simulation & Latest Assessment */}
        <div className={ls.splitGrid}>
          {/* Panel 1: Simulation State */}
          <div className={ls.cardPanel}>
            <div>
              <h3 className={ls.cardPanelTitle}>Current Simulation</h3>
              <p className={ls.cardPanelSub}>
                Real-time status of your headset connection
              </p>
              {activeSession ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--s-3)",
                    marginTop: "var(--s-3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span style={{ fontWeight: "var(--fw-semibold)" }}>
                      {activeSession.session.caseTitle}
                    </span>
                    <Badge
                      status={
                        activeSession.state === "live" ? "pass" : "warn"
                      }
                    >
                      {activeSession.state === "live"
                        ? "Active Now"
                        : "Interrupted"}
                    </Badge>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--t-caption)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Scene {activeSession.session.currentScene} · Elapsed{" "}
                    {clock(activeSession.elapsedS)}
                  </p>
                </div>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--t-body)",
                    color: "var(--text-muted)",
                  }}
                >
                  No simulation is currently active. Launch a headset session by
                  entering your PIN or selecting an approved pre-operative plan.
                </p>
              )}
            </div>
            <div
              style={{
                marginTop: "var(--s-4)",
                display: "flex",
                gap: "var(--s-2)",
              }}
            >
              {activeSession ? (
                <Button
                  variant="primary"
                  icon={Play}
                  href={`/sessions/${activeSession.session.id}`}
                >
                  {activeSession.state === "live"
                    ? "Join live dial"
                    : "Resume session"}
                </Button>
              ) : (
                <Button variant="secondary" href="/plans">
                  View paired plans
                </Button>
              )}
            </div>
          </div>

          {/* Panel 2: Latest Assessment Report */}
          <div className={ls.cardPanel}>
            <div>
              <h3 className={ls.cardPanelTitle}>Latest Assessment</h3>
              <p className={ls.cardPanelSub}>
                Results from your most recent completed simulation
              </p>
              {latestReport ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--s-2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "var(--fw-semibold)",
                        fontSize: "var(--t-body)",
                      }}
                    >
                      {latestReport.session.caseTitle}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--t-h3)",
                        fontWeight: "var(--fw-bold)",
                        color:
                          latestReport.report.totalScore >= passMark
                            ? "var(--pass)"
                            : "var(--warn)",
                      }}
                    >
                      {latestReport.report.totalScore} / 100
                    </span>
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "var(--t-caption)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Completed {shortDate(latestReport.session.endedAt)} · Duration{" "}
                    {clock(latestReport.session.durationS)} ·{" "}
                    {latestReport.session.criticalErrors} critical error
                    {latestReport.session.criticalErrors === 1 ? "" : "s"}
                  </p>
                </div>
              ) : (
                <p
                  style={{
                    margin: 0,
                    fontSize: "var(--t-body)",
                    color: "var(--text-muted)",
                  }}
                >
                  No completed assessments yet. Complete a case simulation in
                  headset to view detailed scoring and breakdown.
                </p>
              )}
            </div>
            <div style={{ marginTop: "var(--s-4)" }}>
              {latestReport ? (
                <Button
                  variant="secondary"
                  href={`/sessions/${latestReport.session.id}/report`}
                >
                  View evaluation report →
                </Button>
              ) : (
                <Button variant="secondary" href="/cases">
                  Start a case
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* SECTION F: Personal Progress Metrics */}
        <div>
          <div className={ls.sectionHeader}>
            <h3 className={ls.sectionTitle}>Personal Progress</h3>
            <Link href="/performance" className={ls.sectionLink}>
              Performance details →
            </Link>
          </div>
          <div className={s.heroBand}>
            <HeroMetric
              label="Overall readiness"
              value={String(stats.meanScore ?? "—")}
              valueTail=" / 100"
              delta={stats.latestDelta}
              deltaSuffix=" pts"
              compare={
                latestReport ? (
                  <>
                    {stats.passRate}% pass rate · latest{" "}
                    <b>{latestReport.report.totalScore}</b> on{" "}
                    {shortDate(latestReport.session.endedAt)} ·{" "}
                    {clock(latestReport.session.durationS)}
                  </>
                ) : undefined
              }
            />

            <StatRow>
              <StatCard
                label="Best score"
                value={stats.bestScore ?? "—"}
                sub={latestReport?.session.caseTitle.split(" — ")[0]}
                chevron
              />
              <StatCard
                label="Weakest area"
                value={data.weakest ? `${data.weakest.pct}%` : "—"}
                variant="dark"
                sub={data.weakest?.label}
                chevron
              />
              <StatCard
                label="Sessions"
                value={stats.sessionsCompleted}
                sub={longDuration(stats.totalTimeS)}
              />
              <StatCard
                label="Critical errors"
                value={stats.criticalErrors}
                variant="accent"
                deltaSuffix=""
                sub="−5 pts each"
              />
            </StatRow>
          </div>
        </div>

        {/* SECTION G: Focus Area Recommendation */}
        {data.weakest && (
          <div className={ls.focusCard}>
            <div className={ls.focusInfo}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--s-2)",
                }}
              >
                <Badge status="warn">Focus Area</Badge>
                <span
                  style={{
                    fontSize: "var(--t-caption)",
                    color: "var(--text-muted)",
                    fontWeight: "var(--fw-medium)",
                  }}
                >
                  Priority Improvement Target
                </span>
              </div>
              <h3
                style={{
                  margin: "var(--s-2) 0 0 0",
                  fontSize: "var(--t-h3)",
                  fontWeight: "var(--fw-bold)",
                }}
              >
                {data.weakest.label}
              </h3>
              <p
                style={{
                  margin: "var(--s-1) 0 0 0",
                  fontSize: "var(--t-body)",
                  color: "var(--text-muted)",
                  maxWidth: "640px",
                }}
              >
                Averaging {data.weakest.pct}% — your lowest scored domain.
                Practising the surgical scenes that evaluate this category will
                have the biggest impact on your readiness.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "var(--s-3)",
                flexShrink: 0,
              }}
            >
              <div className={ls.focusScore}>{data.weakest.pct}%</div>
              <Button variant="primary" href="/setup">
                Practise category
              </Button>
            </div>
          </div>
        )}

        {/* SECTION H: Recent Activity */}
        <div>
          <div className={ls.sectionHeader}>
            <h3 className={ls.sectionTitle}>Recent Sessions</h3>
            <Link href="/sessions" className={ls.sectionLink}>
              All sessions ({data.details.length}) →
            </Link>
          </div>
          {data.details.length === 0 ? (
            <div
              style={{
                padding: "var(--s-5)",
                background: "var(--surface)",
                border: "var(--bw) solid var(--border)",
                borderRadius: "var(--r-md)",
                color: "var(--text-muted)",
              }}
            >
              No sessions completed yet. Launch a case to begin your training log.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                border: "var(--bw) solid var(--border)",
                borderRadius: "var(--r-md)",
                background: "var(--surface)",
                overflow: "hidden",
              }}
            >
              {data.details.slice(0, 5).map((d, i) => (
                <div
                  key={d.session.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--s-3) var(--s-4)",
                    borderBottom:
                      i < Math.min(data.details.length, 5) - 1
                        ? "var(--bw) solid var(--divider)"
                        : "none",
                    gap: "var(--s-3)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "var(--fw-semibold)",
                        fontSize: "var(--t-body)",
                      }}
                    >
                      {d.session.caseTitle}
                    </span>
                    <span
                      style={{
                        fontSize: "var(--t-caption)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {shortDate(d.session.startedAt)} ·{" "}
                      {titleCase(d.session.mode)} ·{" "}
                      {clock(d.session.durationS)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--s-3)",
                    }}
                  >
                    <Badge
                      status={
                        d.session.totalScore !== undefined &&
                        d.session.totalScore >= passMark
                          ? "pass"
                          : "warn"
                      }
                    >
                      {d.session.totalScore !== undefined
                        ? `${d.session.totalScore} pts`
                        : "—"}
                    </Badge>
                    <Link
                      href={`/sessions/${d.session.id}/report`}
                      style={{
                        fontSize: "var(--t-caption)",
                        color: "var(--brand)",
                        fontWeight: "var(--fw-semibold)",
                        textDecoration: "none",
                      }}
                    >
                      Report →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION I: Detailed Analytics (Drawer / Lower section) */}
        <div className={ls.analyticsSection}>
          <div className={ls.sectionHeader}>
            <div>
              <h3 className={ls.sectionTitle}>Detailed Analytics</h3>
              <p
                style={{
                  margin: 0,
                  fontSize: "var(--t-caption)",
                  color: "var(--text-muted)",
                }}
              >
                Historical performance breakdown, mark loss trends, and weekly
                cadence
              </p>
            </div>
          </div>

          <Toolbar
            exportName="mediver-readiness"
            window={{
              param: "weeks",
              value: weeks,
              fallback: 7,
              options: WEEK_OPTIONS,
            }}
            action={{ label: "Session history", href: "/sessions" }}
            exportRows={[
              ["Session", "Case", "Score", "Duration", "Critical", "Mode"],
              ...data.details.map((d) => [
                d.session.id,
                d.session.caseTitle,
                d.session.totalScore ?? "",
                clock(d.session.durationS),
                d.session.criticalErrors,
                d.session.mode,
              ]),
            ]}
          />

          <div style={{ marginTop: "var(--s-4)" }}>
            <DistributionBar
              segments={data.categories.slice(0, 4).map((c, i) => ({
                label: c.label,
                value: c.pct,
                pct: Math.round((c.pct / bandTotal) * 100),
                colour: CATEGORY_COLOUR[i],
              }))}
            />
          </div>

          <div className={ls.analyticsGrid}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-4)",
              }}
            >
              <TabbedPanel
                title="Where you lose marks"
                sub="Points lost, and time spent, ranked across every completed session"
                tabs={[
                  {
                    label: "Points",
                    content: (
                      <RankedList
                        items={data.marksLost.map((m) => ({
                          tag: m.scene,
                          label: m.label,
                          value: `−${m.points}`,
                          pct: m.pct,
                        }))}
                      />
                    ),
                  },
                  {
                    label: "Time",
                    content: (
                      <RankedList
                        items={data.timeLost.map((m) => ({
                          tag: m.scene,
                          label: m.label,
                          value: clock(m.seconds),
                          pct: m.pct,
                        }))}
                      />
                    ),
                  },
                ]}
              />

              <Panel
                title="Sessions per week"
                sub={`Last ${weeks} weeks`}
                action={
                  <Badge status="pass">
                    {data.weekly[data.weekly.length - 1]?.sessions ?? 0} this
                    week
                  </Badge>
                }
              >
                <BarChart
                  data={data.weekly.map((w) => ({
                    label: w.label,
                    value: w.sessions,
                  }))}
                  height={180}
                />
              </Panel>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--s-4)",
              }}
            >
              <Panel
                title="Score dynamic"
                sub="Your weekly mean against the cohort mean"
              >
                <TrendChart
                  values={data.dynamic.values}
                  compare={data.dynamic.compare}
                  labels={data.dynamic.labels}
                  markers={[
                    {
                      at: data.dynamic.values.length - 1,
                      label: "latest",
                      tone: "pass",
                    },
                  ]}
                  caption={data.dynamic.caption}
                />
              </Panel>

              <div className={s.splitPanel}>
                <div className={s.splitDark}>
                  <span className={s.splitLabel}>Category spread</span>
                  <div className={s.splitStat}>
                    <span className={s.splitStatLabel}>Strongest</span>
                    <span className={s.splitStatValue}>{best}%</span>
                  </div>
                  <div className={s.splitStat}>
                    <span className={s.splitStatLabel}>Weakest</span>
                    <span className={s.splitStatValue}>
                      {data.weakest?.pct}%
                    </span>
                  </div>
                  <div className={s.splitStat}>
                    <span className={s.splitStatLabel}>Spread</span>
                    <span className={s.splitStatValue}>
                      {best - (data.weakest?.pct ?? 0)} pts
                    </span>
                  </div>
                </div>
                <div className={s.splitChart}>
                  <div className={s.panelHead}>
                    <div>
                      <p className={s.panelTitle}>By category</p>
                      <p className={s.panelSub}>
                        Percentage of available marks
                      </p>
                    </div>
                  </div>
                  <BarChart
                    data={data.categories.map((c) => ({
                      label: c.short,
                      value: c.pct,
                    }))}
                    max={100}
                    height={180}
                    formatTag={(v) => `${v}%`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
