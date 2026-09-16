import { Users } from "lucide-react";
import { PageHeader } from "@/components/shell";
import { Badge, Banner, Button } from "@/components/ui";
import {
  BarChart,
  DistributionBar,
  HeroMetric,
  RankedList,
  StatCard,
  StatRow,
  TrendChart,
} from "@/components/viz";
import { initialsOf } from "@/lib/format";
import type { InstructorDashboard as Data } from "@/lib/data/dashboard";
import type { Profile } from "@/lib/types";
import { PASS_MARK } from "@/lib/types";
import { Panel } from "./ContextRow";
import { TabbedPanel } from "./TabbedPanel";
import { Toolbar } from "./Toolbar";
import { cx } from "@/lib/cx";
import { WEEK_OPTIONS } from "@/lib/window";
import s from "./dashboard.module.css";

const BAND_COLOUR = [
  "var(--pass)",
  "var(--brand)",
  "var(--fail)",
  "var(--border-strong)",
];

export function InstructorDashboard({
  user,
  data,
  weeks,
}: {
  user: Profile;
  data: Data;
  weeks: number;
}) {
  const { stats } = data;
  const passMark = PASS_MARK.intermediate;
  const cohortName = data.cohort?.name ?? "No cohort assigned";
  const urgent = data.needsAttention.filter((n) => n.severity === "fail");

  return (
    <>
      <PageHeader
        eyebrow={cohortName}
        title="Who needs you"
        lede={`${stats.learners} learners · cohort mean ${stats.meanScore}% · pass mark ${passMark}`}
        actions={
          <Button variant="primary" icon={Users} href="/cohorts">
            Manage cohort
          </Button>
        }
      />

      {urgent.length > 0 && (
        <Banner
          tone="fail"
          title={`${urgent.length} learner${urgent.length === 1 ? " is" : "s are"} below the pass mark`}
          action={
            <Button size="sm" href="/cohorts/learners">
              Review all
            </Button>
          }
        >
          Three or more critical errors cap a session at 59 and mark it Not
          passed regardless of category scores.
        </Banner>
      )}

      <div style={{ height: "var(--s-5)" }} />

      <Toolbar
        exportName="mediver-cohort"
        window={{
          param: "weeks",
          value: weeks,
          fallback: 7,
          options: WEEK_OPTIONS,
        }}
        action={{ label: "All learners", href: "/cohorts/learners" }}
        exportRows={[
          ["Learner", "Role", "Sessions", "Assessments", "Mean", "Critical"],
          ...data.learners.map((l) => [
            l.displayName,
            l.role,
            l.sessions,
            l.assessments,
            l.meanScore ?? "",
            l.criticalErrors,
          ]),
        ]}
      />

      <div className={s.heroBand}>
        <HeroMetric
          label="Cohort mean"
          value={String(stats.meanScore)}
          valueTail="%"
          delta={stats.meanDelta}
          deltaSuffix=" pts"
          compare={
            <>
              Pass mark <b>{passMark}</b> · {stats.belowPassMark} below ·{" "}
              {stats.criticalErrors} critical errors across the cohort
            </>
          }
        />

        <StatRow>
          <StatCard
            label="Learners"
            value={stats.learners}
            sub={cohortName}
          />
          <StatCard
            label="Below pass mark"
            value={stats.belowPassMark}
            variant="dark"
            sub="Needs intervention"
            chevron
          />
          <StatCard
            label="Sessions this week"
            value={stats.sessionsThisWeek}
          />
          <StatCard
            label="Critical errors"
            value={stats.criticalErrors}
            variant="accent"
            deltaSuffix=""
          />
        </StatRow>
      </div>

      <DistributionBar
        segments={data.bands.map((b, i) => ({
          label: b.label,
          value: b.value,
          pct: b.pct,
          colour: BAND_COLOUR[i],
        }))}
      />

      <div className={s.body}>
        <div className={s.col}>
          <Panel
            title="Needs attention"
            sub="Below the pass mark first, then inactive 14 days or more"
            action={<Badge status="fail">{data.needsAttention.length}</Badge>}
          >
            <div className={s.stack}>
              {data.needsAttention.map(({ learner, reason, severity }) => (
                <div
                  key={learner.id}
                  className={cx(s.attn, severity === "fail" && s.attnFail)}
                >
                  <span
                    className={cx(
                      s.attnAvatar,
                      severity === "fail" && s.attnAvatarFail,
                    )}
                    aria-hidden="true"
                  >
                    {initialsOf(learner.displayName)}
                  </span>
                  <div className={s.attnBody}>
                    <p className={s.attnName}>{learner.displayName}</p>
                    <p className={s.attnReason}>{reason}</p>
                  </div>
                  <Badge status={severity}>
                    {severity === "fail" ? "Below pass" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </Panel>

          <TabbedPanel
            title="Where the cohort loses marks"
            sub="Scenes with the most failed and borderline verdicts"
            tabs={[
              {
                label: "Scenes",
                content: (
                  <RankedList
                    items={data.hotspots.map((h) => ({
                      tag: h.scene,
                      label: h.label,
                      value: `${h.affected}/${h.learners}`,
                      pct: Math.round((h.affected / h.learners) * 100),
                    }))}
                  />
                ),
              },
              {
                label: "Categories",
                content: (
                  <RankedList
                    items={[...data.categories]
                      .sort((a, b) => a.pct - b.pct)
                      .map((c) => ({
                        tag: `${c.pct}%`,
                        label: c.label,
                        value: c.pct >= 80 ? "On track" : "Weak",
                        pct: c.pct,
                      }))}
                  />
                ),
              },
            ]}
          />
        </div>

        <div className={s.col}>
          <Panel
            title="Cohort mean over time"
            sub="Weeks where fewer than three learners were active are left blank"
          >
            <TrendChart
              values={data.dynamic.values}
              compare={data.dynamic.compare}
              seriesLabel="Cohort mean"
              labels={data.dynamic.labels}
              markers={[
                {
                  at: data.dynamic.values.length - 1,
                  label: "now",
                  tone: "pass",
                },
              ]}
              caption={data.dynamic.caption}
            />
          </Panel>

          <div className={s.splitPanel}>
            <div className={s.splitDark}>
              <span className={s.splitLabel}>Cohort weakness</span>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Lowest category</span>
                <span className={s.splitStatValue}>
                  {Math.min(...data.categories.map((c) => c.pct))}%
                </span>
              </div>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Highest</span>
                <span className={s.splitStatValue}>
                  {Math.max(...data.categories.map((c) => c.pct))}%
                </span>
              </div>
              <div className={s.splitStat}>
                <span className={s.splitStatLabel}>Sessions / week</span>
                <span className={s.splitStatValue}>
                  {stats.sessionsThisWeek}
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

          <div className={s.note}>
            Instructor visibility is scoped to learners
            whose <code>cohort_id</code> belongs to a cohort you own Signed in as {user.displayName}.
          </div>
        </div>
      </div>
    </>
  );
}
