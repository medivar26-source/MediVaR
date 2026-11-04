import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Clock,
  Crosshair,
  Eye,
  Gauge as GaugeIcon,
  Lightbulb,
  Minus,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Badge, Button, Card, CardHeader, Chip, EmptyState } from "@/components/ui";
import { getReport, getSession, weakestCategory } from "@/lib/data/sessions";
import { canViewSession, sessionLinks } from "@/lib/data/session-links";
import { clock, shortDate, timeOfDay, titleCase } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { getFeedbackForAttempt } from "@/lib/data/residents";
import { ResidentApiError } from "@/lib/data/residents-api";
import {
  auditOf,
  findingsOf,
  gaugeAxis,
  gaugeOf,
  leaksOf,
  markSplits,
  markTotals,
  paceOf,
  passSummary,
  precisionOf,
  round,
  rulesOf,
  tallyOf,
  type Gauge,
} from "@/lib/report-analytics";
import { InstructorFeedback } from "./InstructorFeedback";
import { CategoryRadar, PaceChart, ParetoChart, ScoreRing } from "./ReportCharts";
import s from "./report.module.css";

/* ---------- formatting ---------- */

const MINUS = "−";

/** "9.0 mm", "3.2°", or a bare number for a component size. */
function withUnit(value: number, unit: string): string {
  if (unit === "°" || unit === "deg") return `${value}°`;
  if (!unit) return String(value);
  return `${value} ${unit}`;
}

/** "+2.9 mm", "−4.4°", "0 mm": a deviation with its sign, using a true minus. */
function signed(value: number, unit: string, dp = 1): string {
  const v = round(value, dp);
  const sign = v > 0 ? "+" : v < 0 ? MINUS : "";
  const unitPart = unit === "°" || unit === "deg" ? "°" : unit ? ` ${unit}` : "";
  return `${sign}${Math.abs(v)}${unitPart}`;
}

const pct = (share: number, dp = 0) => `${round(share * 100, dp)}%`;

/** "+14:44" / "−1:05": a clock reading with its sign. */
function signedClock(seconds: number): string {
  return `${seconds > 0 ? "+" : seconds < 0 ? MINUS : ""}${clock(Math.abs(seconds))}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [session, user] = await Promise.all([getSession(id), getCurrentUser()]);
  const report = session && canViewSession(user, session) ? await getReport(session.id) : null;
  return { title: report ? `Report — ${report.header.caseTitle}` : "Report" };
}

/**
 * The surgical case report.
 *
 * **The score is the stored one.** Every mark, verdict and total comes out of the report `score_session` wrote;
 * nothing here re-scores anything. What this page adds is *explanation*, all of it computed in
 * `lib/report-analytics` (and unit-tested there): how the total was built from technique and time marks, where
 * the marks went, how close each measurement landed to its tolerance, how the clock compared with par — and an
 * audit that re-derives the scorer's own rules from the stored inputs and says whether they agree.
 *
 * The order is the order somebody reads a result in: the verdict, what to take from it, how it was built,
 * where it was lost, what was measured, how long it took, scene by scene, and finally the proof.
 */
export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const { id } = await params;
  const { view: requestedView } = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  const session = await getSession(id);
  if (!session || !canViewSession(user, session)) notFound();

  // A session is scheduled under one id and performed under another, and pages link by either. The report
  // lives at the performed (attempt) id, so a scheduled id is sent there rather than answered with a 404.
  if (session.id !== id) {
    redirect(`/sessions/${session.id}/report${requestedView ? `?view=${encodeURIComponent(requestedView)}` : ""}`);
  }

  const report = await getReport(session.id);

  // A session that has not produced a report has a live mirror instead. Sending
  // somebody to an empty report page when there is a running operation to watch
  // is the wrong answer to the same URL.
  if (!report) redirect(`/sessions/${session.id}`);

  // Feedback is keyed to a real users.id (migration 006's FK). Today's seeded
  // sessions carry a synthetic profile id that was never provisioned as a
  // real user, so the lookup below legitimately 404s for them — the panel
  // says so rather than pretending feedback saved. A resident created
  // through Manage Learners and given a real session will resolve normally.
  let existingFeedback: Awaited<ReturnType<typeof getFeedbackForAttempt>> = [];
  let feedbackUnavailable: string | undefined;
  if (persona === "instructor" || persona === "admin") {
    try {
      existingFeedback = await getFeedbackForAttempt(session.userId ?? "", session.id);
    } catch (err) {
      feedbackUnavailable =
        err instanceof ResidentApiError
          ? err.message
          : "Feedback couldn't be loaded for this attempt.";
    }
  }

  /* ---------- the figures ---------- */

  const links = sessionLinks(session);
  const rules = rulesOf(report);
  const pass = passSummary(report);
  const gauges = report.parameters.map(gaugeOf);
  const axis = gaugeAxis(gauges);
  const precision = precisionOf(gauges);
  const { leaks, totalLost } = leaksOf(report.categories);
  const pace = paceOf(report.timeline);
  const tally = tallyOf(report.timeline);
  const splits = markSplits(report);
  const totals = splits ? markTotals(report, splits) : null;
  const checks = auditOf(report);
  const findings = findingsOf(report, { gauges, precision, leaks, totalLost, pace, tally });
  const weakest = weakestCategory(report.categories);
  const categoryLabel = new Map(report.categories.map((c) => [c.key, c.label]));
  const largest = Math.max(...report.categories.map((c) => c.max), 1);
  const failedChecks = checks.filter((c) => !c.ok);
  const levelLabel = titleCase(report.header.difficulty);

  const unmetLevel = pass.levels.find((l) => !l.met);
  const levelsMet = pass.levels.filter((l) => l.met).length;

  /* ---------- the pages ----------
     One page per part of the report, each its own address (`?view=`), so no single page is long. The overview
     is the default; a view that does not exist, or is not offered to this viewer, falls back to it. */
  const isStaff = persona === "instructor" || persona === "admin";
  const reportBase = `/sessions/${session.id}/report`;
  const tabs = [
    { id: "overview", label: "Overview", hint: undefined as string | undefined, show: true },
    { id: "score", label: "Score breakdown", hint: `${report.categories.length}`, show: true },
    { id: "lost", label: "Marks lost", hint: totalLost > 0 ? `${MINUS}${totalLost}` : undefined, show: true },
    { id: "measured", label: "Measurements", hint: report.parameters.length ? `${report.parameters.length}` : undefined, show: true },
    { id: "pace", label: "Pace", hint: undefined, show: pace !== null },
    { id: "scenes", label: "Scenes", hint: `${tally.reached}`, show: report.timeline.length > 0 },
    { id: "audit", label: "Audit", hint: failedChecks.length > 0 ? "!" : undefined, show: true },
    { id: "feedback", label: "Instructor feedback", hint: undefined, show: isStaff },
  ].filter((tab) => tab.show);
  const view = tabs.find((tab) => tab.id === requestedView)?.id ?? "overview";
  const viewIndex = tabs.findIndex((tab) => tab.id === view);
  const previousTab = tabs[viewIndex - 1];
  const nextTab = tabs[viewIndex + 1];
  const hrefFor = (tabId: string) => (tabId === "overview" ? reportBase : `${reportBase}?view=${tabId}`);

  const gaugeById = new Map(gauges.map((g) => [g.key, g]));

  // Planning is scored from the plan alone, so its category mark is the mean criterion score of its marks.
  const preop = report.categories.find((c) => c.key === "preop_planning");
  const planningMean = report.planning?.meanScore ?? null;
  let planningNote: string | null = null;
  if (preop && planningMean !== null) {
    const expected = round((preop.max * planningMean) / 100, 2);
    const stored = preop.raw != null && Math.abs(preop.raw - expected) > 0.011 ? ` (stored ${preop.raw})` : "";
    planningNote = `Planning is scored from the plan alone: ${round(planningMean, 2)}% of ${preop.max} marks = ${expected}${stored}, rounded half up to ${preop.score}.`;
  }

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        eyebrow={
          // A database case id is a UUID, which means nothing to a reader; a sample case id ("CASE_001") does.
          /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(report.header.caseId)
            ? shortDate(report.header.date)
            : `${report.header.caseId} · ${shortDate(report.header.date)}`
        }
        title={report.header.caseTitle}
        lede={`${titleCase(report.header.mode)} · ${levelLabel} · ${report.header.design} · ${titleCase(report.header.fixation)}`}
        actions={
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {links.case && (
              <Button variant="secondary" href={links.case}>
                Back to case
              </Button>
            )}
            {links.plan && (
              <Button variant="secondary" href={links.plan}>
                Open plan
              </Button>
            )}
            <Button variant="secondary" href={links.session}>
              Session
            </Button>
            <Button variant="ghost" href="/sessions">
              All sessions
            </Button>
          </div>
        }
      />

      <nav className={s.tabs} aria-label="Pages of this report">
        <ul>
          {tabs.map((tab) => (
            <li key={tab.id}>
              <Link
                prefetch={false}
                href={hrefFor(tab.id)}
                className={tab.id === view ? s.tabOn : s.tab}
                aria-current={tab.id === view ? "page" : undefined}
              >
                {tab.label}
                {tab.hint && <span className={tab.hint === "!" ? s.tabHintBad : s.tabHint}>{tab.hint}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* On every page but the overview a slim strip keeps the verdict in sight. */}
      {view !== "overview" && (
        <div className={s.strip}>
          <span className={s.stripScore}>
            {report.total}
            <small> / {report.max}</small>
          </span>
          {report.passed ? <Badge status="pass">Passed</Badge> : <Badge status="fail">Below pass mark</Badge>}
          <span className={s.stripNote}>
            Pass mark {report.passMark} at {levelLabel}
            {pass.margin >= 0 ? ` · ${round(pass.margin, 2)} clear` : ` · ${round(Math.abs(pass.margin), 2)} short`}
          </span>
          <Link prefetch={false} href={reportBase} className={s.stripLink}>
            Back to overview
          </Link>
        </div>
      )}

      {view === "overview" && (
        <>
      {/* ================= the verdict ================= */}

      <section className={s.hero} aria-labelledby="verdict-title">
        <div className={s.scoreBlock}>
          <p className={s.scoreLabel} id="verdict-title">
            Total score
          </p>
          <ScoreRing total={report.total} max={report.max} passMark={report.passMark} passed={report.passed} />
          <p className={report.passed ? s.verdictPillPass : s.verdictPillFail}>
            {report.passed ? <Check aria-hidden="true" strokeWidth={2.75} /> : <X aria-hidden="true" strokeWidth={2.75} />}
            {report.passed ? "Passed" : "Below pass mark"}
          </p>
          <p className={s.scoreMeta}>
            {pass.percent}% of the marks · pass mark {report.passMark} at {levelLabel}
          </p>
        </div>

        <div className={s.verdictBody}>
          <div className={s.verdictHead}>
            <h2 className={s.verdictLine}>
              {report.passed
                ? `${pass.margin} mark${pass.margin === 1 ? "" : "s"} clear of the ${levelLabel} pass mark`
                : pass.capReached
                  ? `Ended by critical errors, not by the marks`
                  : `${round(Math.abs(pass.margin), 2)} mark${Math.abs(pass.margin) === 1 ? "" : "s"} short of the ${levelLabel} pass mark`}
            </h2>
            <div className={s.verdictChips}>
              {report.captions.percentile && <Chip>{report.captions.percentile}</Chip>}
              {report.sample && <Chip tone="muted">Sample data</Chip>}
            </div>
          </div>

          {/* The cap is the most serious thing the report can say, so it says it
              in full and does not rewrite the categories to match. A learner has
              to be able to see that they scored well on cuts *and* that a
              critical error ended the session anyway. The sentences come from
              the accessor, beside the numbers they describe */}
          {report.captions.capped && (
            <p className={s.capped}>
              <TriangleAlert className={s.capIcon} strokeWidth={2.25} aria-hidden="true" />
              <span>
                <b>{report.captions.capped}</b> {report.captions.cappedDetail}
              </span>
            </p>
          )}

          {/* the pass ladder: the total against the pass mark of each level */}
          <div className={s.ladder}>
            <div className={s.ladderTrack} aria-hidden="true">
              <span className={report.passed ? s.ladderFillPass : s.ladderFillFail} style={{ width: `${pass.percent}%` }} />
              {pass.levels.map((level) => (
                <span key={level.level} className={s.ladderTick} style={{ left: `${(level.mark / pass.max) * 100}%` }} />
              ))}
              <span className={s.ladderMarker} style={{ left: `${pass.percent}%` }} />
            </div>
            <ol className={s.ladderLevels}>
              {pass.levels.map((level) => (
                <li
                  key={level.level}
                  className={level.met ? s.levelMet : s.levelUnmet}
                  aria-current={level.level === report.header.difficulty ? "true" : undefined}
                >
                  <span className={s.levelName}>
                    {level.met ? <Check aria-hidden="true" strokeWidth={3} /> : <Minus aria-hidden="true" strokeWidth={3} />}
                    {titleCase(level.level)}
                  </span>
                  <span className={s.levelMark}>
                    {level.mark}
                    <i>
                      {level.margin >= 0 ? "+" : MINUS}
                      {round(Math.abs(level.margin), 2)}
                    </i>
                  </span>
                </li>
              ))}
            </ol>
            <p className={s.ladderNote}>
              Meets {levelsMet} of {pass.levels.length} levels
              {unmetLevel
                ? `; ${round(Math.abs(unmetLevel.margin), 2)} marks short of ${titleCase(unmetLevel.level)} (${unmetLevel.mark}).`
                : "."}
            </p>
          </div>

          <dl className={s.runFacts}>
            {[
              { label: "Surgeon", value: report.header.user },
              { label: "Duration", value: clock(report.header.durationS ?? undefined) },
              { label: "Scenes", value: `${tally.reached} of ${tally.total}` },
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

      {/* ================= the run in six numbers ================= */}

      <ul className={s.kpis} aria-label="The run in numbers">
        <li className={s.kpi}>
          <span className={s.kpiIcon}>
            <Check aria-hidden="true" strokeWidth={2.25} />
          </span>
          <span className={s.kpiLabel}>Clean scenes</span>
          <span className={s.kpiValue}>
            {tally.pass}
            <small>/ {tally.reached}</small>
          </span>
          <span className={s.kpiNote}>
            {pct(tally.cleanRate)} passed outright · {tally.borderline} borderline · {tally.fail} failed
          </span>
        </li>

        {pace && (
          <li className={s.kpi}>
            <span className={s.kpiIcon}>
              <Clock aria-hidden="true" strokeWidth={2.25} />
            </span>
            <span className={s.kpiLabel}>Operating time</span>
            <span className={s.kpiValue}>
              {clock(pace.totalS)}
              <small>min</small>
            </span>
            <span className={s.kpiNote}>
              par {clock(pace.parS)} · {signedClock(pace.deltaS)} ({round(pace.totalS / pace.parS, 2)}× par)
            </span>
          </li>
        )}

        {precision.measured > 0 && (
          <li className={s.kpi}>
            <span className={s.kpiIcon}>
              <Crosshair aria-hidden="true" strokeWidth={2.25} />
            </span>
            <span className={s.kpiLabel}>Tolerance used</span>
            <span className={s.kpiValue}>
              {pct(precision.meanUse)}
              <small>on average</small>
            </span>
            <span className={s.kpiNote}>
              {precision.byZone.pass} on target · {precision.byZone.borderline} borderline · {precision.byZone.fail} outside, of{" "}
              {precision.measured}
            </span>
          </li>
        )}

        <li className={s.kpi}>
          <span className={s.kpiIcon}>
            <CircleAlert aria-hidden="true" strokeWidth={2.25} />
          </span>
          <span className={s.kpiLabel}>Warnings</span>
          <span className={s.kpiValue}>{tally.warnings}</span>
          <span className={s.kpiNote}>
            across {tally.scenesWithWarnings} scene{tally.scenesWithWarnings === 1 ? "" : "s"}
          </span>
        </li>

        <li className={s.kpi}>
          <span className={s.kpiIcon}>
            {pass.criticalErrors >= pass.criticalLimit ? (
              <ShieldAlert aria-hidden="true" strokeWidth={2.25} />
            ) : (
              <ShieldCheck aria-hidden="true" strokeWidth={2.25} />
            )}
          </span>
          <span className={s.kpiLabel}>Critical errors</span>
          <span className={s.kpiValue}>
            {pass.criticalErrors}
            <small>of {pass.criticalLimit} allowed</small>
          </span>
          <span className={s.pips} role="img" aria-label={`${pass.criticalErrors} of ${pass.criticalLimit} critical errors`}>
            {Array.from({ length: pass.criticalLimit }, (_, i) => (
              <i key={i} className={i < pass.criticalErrors ? s.pipOn : s.pipOff} />
            ))}
          </span>
        </li>

        {totals && totals.timeAvailable > 0 && (
          <li className={s.kpi}>
            <span className={s.kpiIcon}>
              <GaugeIcon aria-hidden="true" strokeWidth={2.25} />
            </span>
            <span className={s.kpiLabel}>Speed marks</span>
            <span className={s.kpiValue}>
              {round(totals.timeEarned, 1)}
              <small>/ {round(totals.timeAvailable, 1)}</small>
            </span>
            <span className={s.kpiNote}>
              {round(totals.timeAvailable - totals.timeEarned, 1)} marks left on the clock
            </span>
          </li>
        )}
      </ul>


      {/* ================= what to take from it ================= */}

      {findings.length > 0 && (
        <section id="read-first" className={s.section} aria-labelledby="read-first-title">
          <header className={s.sectionHead}>
            <h2 id="read-first-title" className={s.sectionTitle}>
              Read this first
            </h2>
            <p className={s.sectionLede}>What the figures below say, in plain words. Each line is read off a number on this page.</p>
          </header>
          <ul className={s.findings}>
            {findings.map((finding) => (
              <li key={finding.title} className={s[`finding_${finding.tone}`]}>
                <span className={s.findingIcon}>
                  {finding.tone === "good" ? (
                    <Check aria-hidden="true" strokeWidth={2.5} />
                  ) : finding.tone === "act" ? (
                    <Lightbulb aria-hidden="true" strokeWidth={2.25} />
                  ) : (
                    <Eye aria-hidden="true" strokeWidth={2.25} />
                  )}
                </span>
                <span className={s.findingBody}>
                  <b>{finding.title}</b>
                  <span>{finding.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
        </>
      )}

      {/* ================= how the total was built ================= */}

      {view === "score" && (
      <section id="ledger" className={s.section} aria-labelledby="ledger-title">
        <header className={s.sectionHead}>
          <h2 id="ledger-title" className={s.sectionTitle}>
            How the {report.total} was built
          </h2>
          <p className={s.sectionLede}>{report.captions.categories}</p>
        </header>

        <div className={s.twoCol}>
          <Card padding="lg">
            <CardHeader title="Score ledger" subtitle="Marks earned in each category, split into technique and time" />

            <div className={s.ledger}>
              <div className={s.ledgerHead}>
                <span>Category</span>
                <span>Earned of available</span>
                <span className={s.right}>Unrounded</span>
                <span className={s.right}>Mark</span>
              </div>

              {report.categories.map((category) => {
                const split = splits?.find((x) => x.key === category.key);
                const trackW = (category.max / largest) * 100;
                const techW = split ? (split.techniqueEarned / largest) * 100 : (category.score / largest) * 100;
                const timeW = split ? (split.timeEarned / largest) * 100 : 0;
                return (
                  <div className={s.ledgerRow} key={category.key}>
                    <span className={s.ledgerName}>
                      <b>{category.label}</b>
                      <small>
                        technique {category.accuracy}%
                        {category.timing === null ? " · not timed" : ` · time ${category.timing}%`}
                      </small>
                    </span>
                    <span className={s.ledgerBar} aria-hidden="true">
                      <span className={s.ledgerGhost} style={{ width: `${trackW}%` }} />
                      <span className={s.ledgerTech} style={{ width: `${techW}%` }} />
                      {timeW > 0 && <span className={s.ledgerTime} style={{ left: `${techW}%`, width: `${timeW}%` }} />}
                    </span>
                    <span className={`${s.ledgerRaw} ${s.right}`}>{category.raw != null ? round(category.raw, 2) : "—"}</span>
                    <span className={`${s.ledgerMark} ${s.right}`}>
                      {category.score}
                      <small>/{category.max}</small>
                    </span>
                  </div>
                );
              })}

              <div className={s.ledgerSum}>
                <span className={s.ledgerEquation}>
                  {report.categories.map((c) => c.score).join(" + ")} = <b>{report.categories.reduce((t, c) => t + c.score, 0)}</b>
                </span>
                {totals && (
                  <span className={s.ledgerRounding}>
                    Unrounded {round(totals.rawTotal, 2)}; rounding each category half up {totals.roundingEffect >= 0 ? "added" : "removed"}{" "}
                    {round(Math.abs(totals.roundingEffect), 2)}
                  </span>
                )}
              </div>

              <ul className={s.legend} aria-label="Legend">
                <li>
                  <i className={s.swatchTech} /> Technique
                </li>
                <li>
                  <i className={s.swatchTime} /> Time against par
                </li>
                <li>
                  <i className={s.swatchGhost} /> Not earned
                </li>
              </ul>
            </div>

            {totals && (
              <dl className={s.split}>
                <div>
                  <dt>Technique</dt>
                  <dd>
                    {round(totals.techniqueEarned, 1)}
                    <small> of {round(totals.techniqueAvailable, 1)}</small>
                  </dd>
                  <dd className={s.splitNote}>{pct(totals.techniqueEarned / totals.techniqueAvailable)} earned</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>
                    {round(totals.timeEarned, 1)}
                    <small> of {round(totals.timeAvailable, 1)}</small>
                  </dd>
                  <dd className={s.splitNote}>
                    {totals.timeAvailable > 0 ? `${pct(totals.timeEarned / totals.timeAvailable)} earned` : "not timed"}
                  </dd>
                </div>
                <div>
                  <dt>Weight</dt>
                  <dd>
                    {pct(rules.techniqueShare)}
                    <small> / {pct(rules.timingShare)}</small>
                  </dd>
                  <dd className={s.splitNote}>technique / time, per timed scene</dd>
                </div>
              </dl>
            )}
          </Card>

          <Card padding="lg">
            <CardHeader
              title="Category balance"
              subtitle={`Share of each category's marks earned. The dashed ring is the pass mark (${pct(report.passMark / report.max)}).`}
            />
            <CategoryRadar
              passShare={report.max > 0 ? report.passMark / report.max : 0}
              spokes={report.categories
                .filter((c) => c.max > 0)
                .map((c) => ({ key: c.key, label: c.label, short: c.short, share: c.score / c.max, score: c.score, max: c.max }))}
            />
            {weakest && (
              <p className={s.weakest}>
                Weakest: <b>{weakest.label}</b> at {weakest.score} of {weakest.max} — {weakest.accuracy}% on technique
                {weakest.timing === null ? " (not timed)." : `, ${weakest.timing}% on time.`}
              </p>
            )}
          </Card>
        </div>
      </section>
      )}

      {/* ================= where the marks went ================= */}

      {view === "lost" && (
      <section id="lost" className={s.section} aria-labelledby="lost-title">
        <header className={s.sectionHead}>
          <h2 id="lost-title" className={s.sectionTitle}>
            Where the marks went
          </h2>
          <p className={s.sectionLede}>
            {totalLost > 0
              ? `${totalLost} of ${report.max} marks were lost. Fixing the first bar is worth the most.`
              : "Nothing was deducted in any category."}
          </p>
        </header>

        <div className={s.twoCol}>
          <Card padding="lg">
            <CardHeader title="Marks lost by category" subtitle="Largest first; the line is the running share of everything lost" />
            {leaks.length === 0 ? (
              <EmptyState icon={Check} title="Nothing was deducted">
                Every category came back with its full marks.
              </EmptyState>
            ) : (
              <ParetoChart leaks={leaks} totalLost={totalLost} />
            )}
          </Card>

          <Card padding="none">
            <CardHeader
              flush
              title="Deductions, scene by scene"
              subtitle={
                report.feedback.length === 0
                  ? "No scene lost marks."
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
                        {item.text} · {categoryLabel.get(item.category) ?? item.category}
                      </span>
                    </span>
                    <span className={item.severity === "fail" ? s.lostFail : s.lostWarn}>
                      {MINUS}
                      {item.points}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </section>
      )}

      {/* ================= what was measured ================= */}

      {view === "measured" && (
      <section id="measured" className={s.section} aria-labelledby="measured-title">
        <header className={s.sectionHead}>
          <h2 id="measured-title" className={s.sectionTitle}>
            Planned versus achieved
          </h2>
          <p className={s.sectionLede}>
            Measured against the plan frozen when the headset paired, never against a generic ideal. Every gauge is
            scaled in units of that parameter&rsquo;s own tolerance, so a 1.2° axis error and a 1.2 mm joint-line error
            read alike.
          </p>
        </header>

        <Card padding="lg">
          {report.parameters.length === 0 ? (
            <EmptyState icon={Minus} title="The headset recorded no measurements">
              This session ended before any parameter was measured, so there is nothing to compare against the plan.
            </EmptyState>
          ) : (
            <>
              <ul className={s.zoneKey} aria-label="How to read the gauges">
                <li>
                  <i className={s.keyPass} /> Within half the tolerance — pass
                </li>
                <li>
                  <i className={s.keyWarn} /> Within the tolerance — borderline
                </li>
                <li>
                  <i className={s.keyFail} /> Beyond the tolerance — fail
                </li>
                <li>
                  <i className={s.keyPlan} /> The plan
                </li>
              </ul>

              <div className={s.params}>
                <div className={s.paramHead}>
                  <span>Parameter</span>
                  <span className={s.right}>Planned</span>
                  <span className={s.right}>Achieved</span>
                  <span className={s.gaugeScale}>
                    <span>{MINUS}{axis}× tolerance</span>
                    <span>on plan</span>
                    <span>+{axis}×</span>
                  </span>
                  <span className={s.right}>Off plan</span>
                  <span>Verdict</span>
                </div>

                {report.parameters.map((parameter) => {
                  const gauge = gaugeById.get(parameter.key) as Gauge;
                  return (
                    <div className={s.param} key={parameter.key}>
                      <span className={s.paramLabel}>
                        {parameter.label}
                        {parameter.scene && <small>Scene {parameter.scene}</small>}
                      </span>
                      <span className={`${s.paramNum} ${s.right}`}>
                        {parameter.planned === null ? "—" : withUnit(parameter.planned, parameter.unit)}
                      </span>
                      <span className={`${s.paramNum} ${s.right}`}>
                        {parameter.achieved === null ? "—" : withUnit(parameter.achieved, parameter.unit)}
                      </span>
                      <GaugeTrack gauge={gauge} axis={axis} tolerance={parameter.tolerance} unit={parameter.unit} />
                      <span className={`${s.paramDelta} ${s.right}`}>
                        {gauge.signed === null ? (
                          "—"
                        ) : (
                          <>
                            <b>{signed(gauge.signed, parameter.unit)}</b>
                            <small>
                              {pct(gauge.ratio as number)} of ±{parameter.tolerance}
                              {parameter.unit === "°" ? "°" : parameter.unit ? ` ${parameter.unit}` : ""}
                            </small>
                          </>
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
              </div>

              <p className={s.paramNote}>
                Verdict rule: pass at or inside half the tolerance, borderline up to the tolerance, fail beyond it.
                {precision.measured > 0 &&
                  ` Across ${precision.measured} measured parameters the average deviation used ${pct(precision.meanUse)} of the band (root-mean-square ${pct(precision.rmsUse)}, which weighs a single large miss more heavily).`}
              </p>
            </>
          )}
        </Card>

        {report.planning && report.planning.criteria.length > 0 && (
          <Card padding="lg" className={s.stack}>
            <CardHeader
              title="Pre-operative plan against the reference"
              subtitle="What the learner planned at the desk, measured against the reference for this case"
              action={
                report.planning.meanScore !== null ? (
                  <Chip>Mean criterion score {round(report.planning.meanScore, 2)}</Chip>
                ) : undefined
              }
            />
            <div className={s.plan}>
              <div className={s.planHead}>
                <span>Criterion</span>
                <span className={s.right}>Planned</span>
                <span className={s.right}>Reference</span>
                <span className={s.right}>Off reference</span>
                <span>Score</span>
              </div>
              {report.planning.criteria.map((criterion) => {
                const off = round(criterion.planned - criterion.reference, 2);
                const unit = criterion.unit === "size" ? "" : criterion.unit;
                return (
                  <div className={s.planRow} key={criterion.key}>
                    <span className={s.paramLabel}>{criterion.name}</span>
                    <span className={`${s.paramNum} ${s.right}`}>{withUnit(criterion.planned, unit)}</span>
                    <span className={`${s.paramNum} ${s.right}`}>{withUnit(criterion.reference, unit)}</span>
                    <span className={`${s.paramNum} ${s.right}`}>
                      {signed(off, unit)}
                      <small className={s.inlineNote}>±{criterion.tolerance || 0}</small>
                    </span>
                    <span className={s.planScore}>
                      <span className={s.planTrack} aria-hidden="true">
                        <span
                          className={criterion.score >= 90 ? s.planFillPass : criterion.score >= 60 ? s.planFillWarn : s.planFillFail}
                          style={{ width: `${Math.min(100, Math.max(0, criterion.score))}%` }}
                        />
                      </span>
                      <b>{round(criterion.score, 0)}</b>
                    </span>
                  </div>
                );
              })}
            </div>
            {planningNote && <p className={s.paramNote}>{planningNote}</p>}
          </Card>
        )}
      </section>
      )}

      {/* ================= pace ================= */}

      {view === "pace" && pace && (
        <section id="pace" className={s.section} aria-labelledby="pace-title">
          <header className={s.sectionHead}>
            <h2 id="pace-title" className={s.sectionTitle}>
              Pace against par
            </h2>
            <p className={s.sectionLede}>
              Each scene earns {pct(rules.timingShare)} of its marks on time: full credit at par, none at the scene&rsquo;s time limit,
              in proportion between.
            </p>
          </header>

          <ul className={s.paceStats}>
            <li>
              <span>Actual</span>
              <b>{clock(pace.totalS)}</b>
            </li>
            <li>
              <span>Par</span>
              <b>{clock(pace.parS)}</b>
            </li>
            <li>
              <span>{pace.deltaS > 0 ? "Over par" : "Under par"}</span>
              <b>{signedClock(pace.deltaS)}</b>
            </li>
            <li>
              <span>Efficiency</span>
              <b>{pct(pace.efficiency)}</b>
              <small>par ÷ actual</small>
            </li>
            <li>
              <span>Scenes over par</span>
              <b>
                {pace.overParCount}
                <small> of {pace.scenes.length}</small>
              </b>
            </li>
            <li>
              <span>Over time limit</span>
              <b>{pace.overLimitCount}</b>
            </li>
          </ul>

          <div className={s.twoCol}>
            <Card padding="lg">
              <CardHeader
                title="Elapsed time"
                subtitle="Cumulative time at the end of each scene, against the par clock. The shaded band is the time lost so far."
                action={
                  <ul className={s.miniLegend} aria-label="Legend">
                    <li>
                      <i className={s.lineActual} /> Actual
                    </li>
                    <li>
                      <i className={s.linePar} /> Par
                    </li>
                  </ul>
                }
              />
              <PaceChart pace={pace} />
            </Card>

            <Card padding="lg">
              <CardHeader title="By phase" subtitle="Time in each part of the operation, with par marked" />
              <ul className={s.parts}>
                {(() => {
                  const widest = Math.max(...pace.parts.map((p) => Math.max(p.durationS, p.parS)), 1);
                  return pace.parts.map((part) => (
                    <li key={part.part} className={s.part}>
                      <span className={s.partName}>
                        {part.part}
                        <small>
                          {part.scenes} scene{part.scenes === 1 ? "" : "s"}
                        </small>
                      </span>
                      <span className={s.partTrack} aria-hidden="true">
                        <span
                          className={part.deltaS > 0 ? s.partFillOver : s.partFillUnder}
                          style={{ width: `${(part.durationS / widest) * 100}%` }}
                        />
                        <span className={s.partPar} style={{ left: `${(part.parS / widest) * 100}%` }} />
                      </span>
                      <span className={s.partTime}>
                        {clock(part.durationS)}
                        <small>{signedClock(part.deltaS)}</small>
                      </span>
                    </li>
                  ));
                })()}
              </ul>
              {pace.slowest[0] && pace.slowest[0].deltaS > 0 && (
                <p className={s.weakest}>
                  Biggest time losses:{" "}
                  {pace.slowest
                    .filter((x) => x.deltaS > 0)
                    .map((x) => `${x.scene} ${x.label} (${signedClock(x.deltaS)})`)
                    .join(" · ")}
                </p>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* ================= scene by scene ================= */}

      {view === "scenes" && report.timeline.length > 0 && (
        <section id="scenes" className={s.section} aria-labelledby="scenes-title">
          <header className={s.sectionHead}>
            <h2 id="scenes-title" className={s.sectionTitle}>
              The operation, scene by scene
            </h2>
            <p className={s.sectionLede}>
              {tally.reached} of {tally.total} scenes reached. The bar is time used out of the scene&rsquo;s limit, with par marked.
            </p>
          </header>

          <Card padding="none">
            <div className={s.sceneHead}>
              <span>Scene</span>
              <span />
              <span>Time</span>
              <span className={s.right}>Marks</span>
              <span>Outcome</span>
            </div>
            <ol className={s.timeline}>
              {report.timeline.map((entry) => {
                const over =
                  entry.durationS !== null && entry.parTimeS !== null ? entry.durationS - entry.parTimeS : null;
                const scale = Math.max(entry.maxTimeS ?? 0, entry.durationS ?? 0, entry.parTimeS ?? 0, 1);
                const note = report.feedback.find((f) => f.scene === entry.scene);

                return (
                  <li key={entry.scene} className={entry.reached ? s.sceneRow : s.sceneSkipped}>
                    <span className={s.sceneTag}>{entry.scene}</span>
                    <span className={s.sceneBody}>
                      <span className={s.sceneLabel}>{entry.label}</span>
                      <span className={s.sceneMeta}>
                        {entry.part}
                        {entry.warnings > 0 && ` · ${entry.warnings} warning${entry.warnings === 1 ? "" : "s"}`}
                        {!entry.reached && " · Not reached"}
                      </span>
                      {note && entry.outcome !== "pass" && <span className={s.sceneNote}>{note.text}</span>}
                    </span>
                    <span className={s.sceneTime}>
                      {entry.reached && entry.durationS !== null ? (
                        <>
                          <span className={s.timeBar} aria-hidden="true">
                            <span
                              className={entry.maxTimeS != null && entry.durationS > entry.maxTimeS ? s.timeFillOver : over !== null && over > 0 ? s.timeFillSlow : s.timeFillOk}
                              style={{ width: `${(entry.durationS / scale) * 100}%` }}
                            />
                            {entry.parTimeS !== null && (
                              <span className={s.timePar} style={{ left: `${(entry.parTimeS / scale) * 100}%` }} />
                            )}
                          </span>
                          <span className={s.timeText}>
                            {clock(entry.durationS)}
                            {over !== null && <small>{over > 0 ? `${over}s over par` : over < 0 ? `${Math.abs(over)}s under` : "on par"}</small>}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span className={`${s.sceneMarks} ${s.right}`}>
                      {entry.points != null && entry.maxPoints != null && entry.maxPoints > 0 ? (
                        <>
                          <b>{round(entry.points, 2)}</b>
                          <small>/ {round(entry.maxPoints, 2)}</small>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span>
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
        </section>
      )}

      {/* ================= the proof ================= */}

      {view === "audit" && (
      <section id="audit" className={s.section} aria-labelledby="audit-title">
        <header className={s.sectionHead}>
          <h2 id="audit-title" className={s.sectionTitle}>
            Audit trail
          </h2>
          <p className={s.sectionLede}>
            Every rule the scorer states, re-applied to the stored inputs. A check appears only when the report carries
            what it needs.
          </p>
        </header>

        <Card padding="lg">
          <CardHeader
            title={failedChecks.length === 0 ? `All ${checks.length} checks agree` : `${failedChecks.length} of ${checks.length} checks disagree`}
            subtitle={report.scoringVersion ? `Scoring version ${report.scoringVersion}` : "Re-derived from the stored report"}
            action={
              failedChecks.length === 0 ? (
                <Badge status="pass">Reconciled</Badge>
              ) : (
                <Badge status="fail">Needs review</Badge>
              )
            }
          />

          <ul className={s.checks}>
            {checks.map((check) => (
              <li key={check.id} className={check.ok ? s.checkOk : s.checkBad}>
                <span className={s.checkIcon}>
                  {check.ok ? <Check aria-hidden="true" strokeWidth={3} /> : <X aria-hidden="true" strokeWidth={3} />}
                  <span className="srOnly">{check.ok ? "Agrees" : "Disagrees"}</span>
                </span>
                <span className={s.checkBody}>
                  <b>{check.label}</b>
                  <code>{check.rule}</code>
                  <span>{check.detail}</span>
                </span>
              </li>
            ))}
          </ul>

          <dl className={s.rules}>
            <div>
              <dt>Pass marks</dt>
              <dd>{pass.levels.map((l) => `${titleCase(l.level)} ${l.mark}`).join(" · ")}</dd>
            </div>
            <div>
              <dt>Critical-error cap</dt>
              <dd>
                {pass.criticalLimit} critical errors cap the total at {pass.capMark}
              </dd>
            </div>
            <div>
              <dt>Scene credit</dt>
              <dd>
                {Object.entries(rules.techniqueCredit)
                  .map(([verdict, credit]) => `${verdict} ${pct(credit)}`)
                  .join(" · ")}{" "}
                of the technique share
              </dd>
            </div>
            <div>
              <dt>Activity</dt>
              <dd>
                <Activity className={s.inlineIcon} aria-hidden="true" strokeWidth={2} /> Report generated {shortDate(report.generatedAt)},{" "}
                {timeOfDay(report.generatedAt)} UTC
              </dd>
            </div>
          </dl>
        </Card>
      </section>
      )}

      {view === "feedback" && isStaff && (
        <InstructorFeedback
          residentId={session.userId ?? ""}
          attemptId={session.id}
          existing={existingFeedback}
          unavailableReason={feedbackUnavailable}
        />
      )}

      {/* Previous / next, so the pages read in order without going back to the tab bar. */}
      <nav className={s.pager} aria-label="Report pagination">
        {previousTab ? (
          <Link prefetch={false} href={hrefFor(previousTab.id)} className={s.pagerPrev}>
            <ArrowLeft aria-hidden="true" strokeWidth={2.25} />
            <span>
              <small>Previous</small>
              {previousTab.label}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {nextTab && (
          <Link prefetch={false} href={hrefFor(nextTab.id)} className={s.pagerNext}>
            <span>
              <small>Next</small>
              {nextTab.label}
            </span>
            <ArrowRight aria-hidden="true" strokeWidth={2.25} />
          </Link>
        )}
      </nav>
    </AppShell>
  );
}

/* ---------- the tolerance gauge ---------- */

/**
 * One parameter on a track whose centre is the plan and whose width is `±axis` tolerances. The bands behind the
 * marker are the verdict rule drawn to scale — pass inside ½ tolerance, borderline inside 1, fail beyond — so
 * where the marker sits *is* the verdict, and how far from the next band it sits is the margin.
 */
function GaugeTrack({
  gauge,
  axis,
  tolerance,
  unit,
}: {
  gauge: Gauge;
  axis: number;
  tolerance: number;
  unit: string;
}) {
  if (gauge.ratio === null || gauge.signed === null) {
    return <span className={s.gaugeNone}>Not planned</span>;
  }
  const direction = gauge.signed < 0 ? -1 : 1;
  const position = Math.min(97.5, Math.max(2.5, 50 + (direction * gauge.ratio * 50) / axis));
  const tone = gauge.zone === "fail" ? s.devFail : gauge.zone === "borderline" ? s.devWarn : s.devPass;
  const markerTone = gauge.zone === "fail" ? s.markFail : gauge.zone === "borderline" ? s.markWarn : s.markPass;
  const label = `${signed(gauge.signed, unit)} from plan, ${pct(gauge.ratio)} of the ±${tolerance} tolerance`;

  return (
    <span className={s.gauge} role="img" aria-label={label}>
      <span className={s.zoneWarn} style={{ width: `${100 / axis}%` }} />
      <span className={s.zonePass} style={{ width: `${50 / axis}%` }} />
      <span className={s.gaugePlan} />
      <span className={tone} style={{ left: `${Math.min(50, position)}%`, width: `${Math.abs(position - 50)}%` }} />
      <span className={markerTone} style={{ left: `${position}%` }} />
    </span>
  );
}
