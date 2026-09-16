import { Play } from "lucide-react";
import { PageHeader } from "@/components/shell";
import { Badge, Button } from "@/components/ui";
import {
  BarChart,
  DistributionBar,
  HeroMetric,
  RankedList,
  StatCard,
  StatRow,
  TrendChart,
} from "@/components/viz";
import { clock, longDuration, shortDate } from "@/lib/format";
import type { LearnerDashboard as Data } from "@/lib/data/dashboard";
import type { Profile } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";
import { Panel } from "./ContextRow";
import { LiveDial } from "./LiveDial";
import { TabbedPanel } from "./TabbedPanel";
import { Toolbar } from "./Toolbar";
import { WEEK_OPTIONS } from "@/lib/window";
import s from "./dashboard.module.css";

const CATEGORY_COLOUR = [
  "var(--brand)",
  "var(--pass)",
  "var(--dark)",
  "var(--warn)",
];

export function LearnerDashboard({
  user,
  data,
  weeks,
}: {
  user: Profile;
  data: Data;
  weeks: number;
}) {
  const { stats, activeSession, latestReport } = data;
  const passMark = PASS_MARK[user.defaultDifficulty];
  const bandTotal = data.categories.reduce((a, c) => a + c.pct, 0);
  const best = Math.max(...data.categories.map((c) => c.pct));

  return (
    <>
      <PageHeader
        eyebrow="Your readiness"
        title={`Welcome back, ${user.displayName}`}
        lede={`${user.level ?? "Learner"} · pass mark ${passMark} · ${stats.sessionsCompleted} sessions completed`}
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
            <Button variant="primary" icon={Play} href="/setup">
              Start simulation
            </Button>
          </>
        }
      />

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

      <DistributionBar
        segments={data.categories.slice(0, 4).map((c, i) => ({
          label: c.label,
          value: c.pct,
          pct: Math.round((c.pct / bandTotal) * 100),
          colour: CATEGORY_COLOUR[i],
        }))}
      />

      <div className={s.body}>
        <div className={s.col}>
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
                {data.weekly[data.weekly.length - 1]?.sessions ?? 0} this week
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

        <div className={s.col}>
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
                <span className={s.splitStatValue}>{data.weakest?.pct}%</span>
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
                  <p className={s.panelSub}>Percentage of available marks</p>
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

          {data.weakest && (
            <Panel
              title={`Next: ${data.weakest.label}`}
              sub={`Averaging ${data.weakest.pct}% — your lowest category. Practising the scenes that feed it recovers more marks than anything else available to you.`}
            >
              <Button size="sm" variant="primary" href="/setup">
                Practise this category
              </Button>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}
