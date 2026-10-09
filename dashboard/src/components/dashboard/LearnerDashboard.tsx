import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shell";
import { Badge, type BadgeStatus, Button, DemoDataNote } from "@/components/ui";
import { HeroMetric, StatCard, StatRow } from "@/components/viz";
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
import { LiveDial } from "./LiveDial";
import ls from "./learner-dashboard.module.css";
import s from "./dashboard.module.css";

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
}: {
  user: Profile;
  data: Data;
  programs?: ProgramSummary[];
  plans?: PlanRow[];
  cases?: CaseCard[];
}) {
  const { stats, activeSession, latestReport } = data;
  const passMark = PASS_MARK[user.defaultDifficulty];

  // The next action, and each case's status, come from the learner's real plans and sessions.
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
  // A session is only worth turning up to with a sealed plan for its case.
  const planReady = new Map(
    enrichedCases.map((c) => [c.id, c.status === "ready_for_vr" || c.status === "completed"]),
  );

  return (
    <>
      <PageHeader
        eyebrow={
          programs.length > 0
            ? `${programs[0].name}${programs[0].cohort_name ? ` · Cohort: ${programs[0].cohort_name}` : ""}`
            : "Personal Training Cockpit"
        }
        title={`Welcome back, ${user.displayName}`}
        lede={`${user.level ?? "Learner"} · Pass mark ${passMark} · ${stats.sessionsCompleted} completed sessions · ${completedCasesCount} of ${cases.length} cases completed`}
        actions={
          activeSession ? (
            <LiveDial
              state={activeSession.state}
              initialElapsedS={activeSession.elapsedS}
              progress={activeSession.progress}
              href={`/sessions/${activeSession.session.id}`}
              label={`${activeSession.session.caseTitle}, scene ${activeSession.session.currentScene}`}
            />
          ) : undefined
        }
      />
      <DemoDataNote />

      <div className={ls.container}>
        {/* 1. The one thing to do next */}
        <div className={ls.nextActionHero}>
          <div className={ls.nextActionContent}>
            <div className={ls.nextActionEyebrow}>
              <Badge status={mapBadgeTone(nextAction.badgeTone)}>
                {nextAction.badge}
              </Badge>
              <span>Next up</span>
            </div>
            <h2 className={ls.nextActionTitle}>{nextAction.title}</h2>
            <p className={ls.nextActionSubtitle}>{nextAction.subtitle}</p>
          </div>
          <div className={ls.nextActionCta}>
            <Button variant="primary" size="lg" icon={ArrowRight} href={nextAction.href}>
              {nextAction.actionLabel}
            </Button>
          </div>
        </div>

        {/* 2. Programs: one line, because the curriculum lives under Programs */}
        {programs.length > 0 && (
          <div className={ls.programsRow}>
            <span className={ls.programsRowLabel}>Your programs</span>
            {programs.map((prog) => (
              <Link key={prog.id} href={`/programs/${prog.id}`} className={ls.programChip}>
                {prog.name}
                {prog.cohort_name ? ` · ${prog.cohort_name}` : ""}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}

        {/* 3. Progress as one strip; the detail is under Progress */}
        <div>
          <div className={ls.sectionHeader}>
            <h3 className={ls.sectionTitle}>Your progress</h3>
            <Link href="/performance" className={ls.sectionLink}>
              Full progress →
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

        {/* 4. Assigned cases, each with its own button, beside the sessions coming up */}
        <div className={ls.twoCol}>
          <div>
            <div className={ls.sectionHeader}>
              <h3 className={ls.sectionTitle}>Assigned cases</h3>
              <Link href="/cases" className={ls.sectionLink}>
                All cases ({cases.length}) →
              </Link>
            </div>
            {enrichedCases.length === 0 ? (
              <div className={ls.emptyBox}>
                <p>No cases are assigned to you yet.</p>
                <Button variant="secondary" size="sm" href="/cases">
                  Browse the case library
                </Button>
              </div>
            ) : (
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
                let actionText = "Start planning";
                if (c.status === "in_planning" && c.associatedPlanId) {
                  actionHref = `/plan/${c.associatedPlanId}`;
                  actionText = "Resume planning";
                } else if (c.status === "ready_for_vr" && c.associatedPlanId) {
                  actionHref = `/plan/${c.associatedPlanId}/review`;
                  actionText = "View plan";
                } else if (
                  c.status === "completed" ||
                  c.status === "needs_retry"
                ) {
                  actionHref = `/cases/${c.id}`;
                  actionText = "View history";
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
            )}
          </div>

          <div>
            <div className={ls.sectionHeader}>
              <h3 className={ls.sectionTitle}>Upcoming sessions</h3>
              <Link href="/sessions" className={ls.sectionLink}>
                All sessions →
              </Link>
            </div>
            {data.upcomingSessions && data.upcomingSessions.length > 0 ? (
              <div className={ls.casesGrid}>
                {data.upcomingSessions.map((sess) => {
                  const ready = sess.caseId ? planReady.get(sess.caseId) : undefined;
                  return (
                    <div key={sess.id} className={ls.caseCard}>
                      <div className={ls.caseCardHead}>
                        <h4 className={ls.caseTitle}>{sess.name}</h4>
                        <Badge status={sess.status === "in_progress" ? "active" : "warn"}>
                          {sess.status === "in_progress" ? "In progress" : "Upcoming"}
                        </Badge>
                      </div>
                      <div className={ls.caseChips}>
                        <span className={ls.cohortMeta}>{sess.caseName ?? "No case"}</span>
                        <span className={ls.cohortMeta}>· {titleCase(sess.mode)}</span>
                        <span className={ls.cohortMeta}>· {sess.duration} mins</span>
                      </div>
                      <div className={ls.caseFoot}>
                        <span>{new Date(sess.scheduledAt).toLocaleString()}</span>
                        {ready !== undefined && (
                          <Badge status={ready ? "pass" : "warn"}>
                            {ready ? "Plan ready" : "Plan not sealed"}
                          </Badge>
                        )}
                      </div>
                      {sess.caseId && (
                        <Link href={`/cases/${sess.caseId}`} className={ls.caseAction}>
                          {ready ? "Open case" : "Prepare plan"}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={ls.emptyBox}>
                <p>No sessions are scheduled. Your instructor schedules them from your cohort.</p>
              </div>
            )}
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

      </div>
    </>
  );
}
