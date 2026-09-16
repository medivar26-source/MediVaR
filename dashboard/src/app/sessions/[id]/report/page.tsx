import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, Check, Minus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Badge, Card, CardHeader, Chip, EmptyState } from "@/components/ui";
import {
  deviationOf,
  getReport,
  getSession,
  weakestCategory,
} from "@/lib/data/sessions";
import { clock, shortDate, timeOfDay, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import s from "./report.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  return { title: report ? `Report — ${report.header.caseTitle}` : "Report" };
}

/**
 * The surgical case report.
 *
 * **Every number on this page comes out of `reports.payload`**, which
 * `score_session` wrote in the database. Nothing here adds, averages or rounds
 * anything: if the dashboard could compute a score there would be two answers
 * to "what did they get", the headset's and the browser's, and no way to say
 * which was right.
 *
 * The order is the order somebody reads a result in: the verdict, then what it
 * was measured against, then where the marks went, then the run itself.
 */
export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const [session, report] = await Promise.all([getSession(id), getReport(id)]);
  if (!session) notFound();

  // A session that has not produced a report has a live mirror instead. Sending
  // somebody to an empty report page when there is a running operation to watch
  // is the wrong answer to the same URL.
  if (!report) redirect(`/sessions/${id}`);

  const weakest = weakestCategory(report.categories);
  const largest = Math.max(...report.categories.map((c) => c.max), 1);

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        eyebrow={`${report.header.caseId} · ${shortDate(report.header.date)}`}
        title={report.header.caseTitle}
        lede={`${titleCase(report.header.mode)} · ${titleCase(report.header.difficulty)} · ${report.header.design} · ${titleCase(report.header.fixation)}`}
      />

      {/* ---------- the verdict ---------- */}

      <section className={s.verdict}>
        <div className={s.scoreBlock}>
          <p className={s.scoreLabel}>Total score</p>
          <p className={s.score}>
            <span className={s.scoreValue}>{report.total}</span>
            <span className={s.scoreMax}>/ {report.max}</span>
          </p>
          <p className={s.scoreMeta}>
            Pass mark {report.passMark} at {titleCase(report.header.difficulty)}
          </p>
        </div>

        <div className={s.verdictBody}>
          <div className={s.verdictHead}>
            {report.passed ? (
              <Badge status="pass">Passed</Badge>
            ) : (
              <Badge status="fail">Below pass mark</Badge>
            )}
            {report.captions.percentile && (
              <span className={s.percentile}>{report.captions.percentile}</span>
            )}
          </div>

          {/* The cap is the most serious thing the report can say, so it says it
              in full and does not rewrite the categories to match. A learner has
              to be able to see that they scored well on cuts *and* that a
              critical error ended the session anyway. The sentences come from
              the accessor, beside the numbers they describe */}
          {report.captions.capped && (
            <p className={s.capped}>
              <AlertTriangle className={s.capIcon} strokeWidth={2.25} aria-hidden="true" />
              <span>
                <b>{report.captions.capped}</b> {report.captions.cappedDetail}
              </span>
            </p>
          )}

          <dl className={s.runFacts}>
            {[
              { label: "Surgeon", value: report.header.user },
              { label: "Duration", value: clock(report.header.durationS ?? undefined) },
              {
                label: "Critical errors",
                value: String(report.criticalErrors),
              },
              {
                label: "Generated",
                value: `${shortDate(report.generatedAt)}, ${timeOfDay(report.generatedAt)}`,
              },
            ].map((fact) => (
              <div key={fact.label} className={s.runFact}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className={s.layout}>
        <div className={s.col}>
          {/* ---------- planned versus achieved ---------- */}

          <Card padding="lg">
            <CardHeader
              title="Planned versus achieved"
              subtitle="Measured against the plan frozen when the headset paired, never against a generic ideal."
            />

            {report.parameters.length === 0 ? (
              <EmptyState icon={Minus} title="The headset recorded no measurements">
                This session ended before any parameter was measured, so there is
                nothing to compare against the plan.
              </EmptyState>
            ) : (
              <div className={s.params}>
                <div className={s.paramHead}>
                  <span>Parameter</span>
                  <span>Planned</span>
                  <span>Achieved</span>
                  <span>Deviation</span>
                  <span>Verdict</span>
                </div>

                {report.parameters.map((parameter) => {
                  const deviation = deviationOf(parameter);
                  return (
                    <div className={s.param} key={parameter.key}>
                      <span className={s.paramLabel}>{parameter.label}</span>
                      <span className={s.paramNum}>
                        {parameter.planned === null
                          ? "—"
                          : `${parameter.planned}${parameter.unit === "deg" ? "°" : " mm"}`}
                      </span>
                      <span className={s.paramNum}>
                        {parameter.achieved}
                        {parameter.unit === "deg" ? "°" : " mm"}
                      </span>
                      <span className={s.paramTrack} aria-hidden="true">
                        {deviation !== null && (
                          <span
                            className={
                              parameter.verdict === "fail"
                                ? s.paramFillFail
                                : parameter.verdict === "borderline"
                                  ? s.paramFillWarn
                                  : s.paramFillPass
                            }
                            style={{ width: `${Math.max(4, deviation * 100)}%` }}
                          />
                        )}
                      </span>
                      <span>
                        {parameter.verdict === "pass" ? (
                          <Badge status="pass">In tolerance</Badge>
                        ) : parameter.verdict === "borderline" ? (
                          <Badge status="warn">Borderline</Badge>
                        ) : parameter.verdict === "fail" ? (
                          <Badge status="fail">Outside</Badge>
                        ) : (
                          <Badge status="neutral">Not measured</Badge>
                        )}
                      </span>
                    </div>
                  );
                })}

                <p className={s.paramNote}>
                  The bar is the deviation as a share of that parameter&rsquo;s own
                  tolerance, so a 1.2° axis error and a 1.2 mm joint-line error read
                  the same. Full means at or beyond the band.
                </p>
              </div>
            )}
          </Card>

          {/* ---------- where the marks went ---------- */}

          <Card padding="none">
            <CardHeader
              flush
              title="Where the marks went"
              subtitle={
                report.feedback.length === 0
                  ? "Nothing was deducted in any category."
                  : `${report.feedback.length} deduction${report.feedback.length === 1 ? "" : "s"}, largest first`
              }
            />
            {report.feedback.length === 0 ? (
              <div className={s.emptyWrap}>
                <EmptyState icon={Check} title="Nothing was deducted">
                  Every scene in every category came back a pass.
                </EmptyState>
              </div>
            ) : (
              <ul className={s.feedback}>
                {report.feedback.map((item, index) => (
                  <li className={s.feedbackRow} key={`${item.scene}-${index}`}>
                    <span className={s.sceneTag}>{item.scene}</span>
                    <span className={s.feedbackBody}>
                      <span className={s.feedbackText}>{item.label}</span>
                      <span className={s.feedbackMeta}>
                        {item.text} · {item.category}
                      </span>
                    </span>
                    <span
                      className={item.severity === "fail" ? s.lostFail : s.lostWarn}
                    >
                      −{item.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className={s.col}>
          {/* ---------- categories ---------- */}

          <Card padding="lg">
            <CardHeader title="Score by category" subtitle={report.captions.categories} />
            <ul className={s.categories}>
              {report.categories.map((category) => (
                <li key={category.key} className={s.categoryRow}>
                  <span className={s.categoryLabel}>{category.label}</span>
                  <span className={s.categoryTrack} aria-hidden="true">
                    {/* `score / largest` is the earned share of the widest
                        category's track — and defined even when a stored
                        `max` is 0, where score-over-max would be NaN. */}
                    <span
                      className={s.categoryFill}
                      style={{
                        width: `${category.max > 0 ? (category.score / largest) * 100 : 0}%`,
                      }}
                    />
                    <span
                      className={s.categoryGhost}
                      style={{ width: `${(category.max / largest) * 100}%` }}
                    />
                  </span>
                  <span className={s.categoryScore}>
                    {category.score}
                    <span className={s.categoryMax}>/{category.max}</span>
                  </span>
                </li>
              ))}
            </ul>

            {weakest && (
              <p className={s.weakest}>
                Weakest: <b>{weakest.label}</b> at {weakest.score} of {weakest.max} —{" "}
                {weakest.accuracy}% on technique, {weakest.timing}% on time.
              </p>
            )}
          </Card>

          {/* ---------- the run ---------- */}

          <Card padding="none">
            <CardHeader
              flush
              title="The operation, scene by scene"
              subtitle={`${report.timeline.filter((t) => t.reached).length} of ${report.timeline.length} scenes reached`}
            />
            <ol className={s.timeline}>
              {report.timeline.map((entry) => {
                const over =
                  entry.durationS !== null && entry.parTimeS !== null
                    ? entry.durationS - entry.parTimeS
                    : null;

                return (
                  <li
                    key={entry.scene}
                    className={entry.reached ? s.timelineRow : s.timelineSkipped}
                  >
                    <span className={s.sceneTag}>{entry.scene}</span>
                    <span className={s.timelineBody}>
                      <span className={s.timelineLabel}>{entry.label}</span>
                      <span className={s.timelineMeta}>
                        {!entry.reached
                          ? "Not reached"
                          : over !== null && over > 0
                            ? `${clock(entry.durationS ?? undefined)} · ${over}s over par`
                            : clock(entry.durationS ?? undefined)}
                        {entry.warnings > 0 &&
                          ` · ${entry.warnings} warning${entry.warnings === 1 ? "" : "s"}`}
                      </span>
                    </span>
                    <span>
                      {/* "Skipped" is a lifecycle fact, not a verdict, so it is
                          a Chip */}
                      {!entry.reached ? (
                        <Chip tone="muted">Skipped</Chip>
                      ) : entry.outcome === "pass" ? (
                        <Badge status="pass">Pass</Badge>
                      ) : entry.outcome === "borderline" ? (
                        <Badge status="warn">Borderline</Badge>
                      ) : (
                        <Badge status="fail">Fail</Badge>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
