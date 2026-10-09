import { Badge } from "@/components/ui";
import { BarChart, DistributionBar, RankedList, TrendChart } from "@/components/viz";
import { clock } from "@/lib/format";
import type { LearnerDashboard as Data } from "@/lib/data/dashboard";
import { WEEK_OPTIONS } from "@/lib/window";
import { Panel } from "./ContextRow";
import { TabbedPanel } from "./TabbedPanel";
import { Toolbar } from "./Toolbar";
import ls from "./learner-dashboard.module.css";
import s from "./dashboard.module.css";

const CATEGORY_COLOUR = ["var(--brand)", "var(--pass)", "var(--dark)", "var(--warn)"];

/**
 * Historical breakdown: mark loss, weekly cadence, score trend and category spread.
 * It lives on Progress > Trends so the home page can stay about what to do next.
 */
export function LearnerAnalytics({ data, weeks }: { data: Data; weeks: number }) {
  const bandTotal = data.categories.reduce((a, c) => a + c.pct, 0);
  const best = Math.max(...data.categories.map((c) => c.pct));

  return (
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
                d.session.criticalErrors ?? 0,
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
  );
}
