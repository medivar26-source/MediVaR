import Link from "next/link";
import { SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  Chip,
  ProgressBar,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { BarChart, StatCard, StatRow } from "@/components/viz";
import type { getPerformanceOverview, getSkillGroups } from "@/lib/data/performance";
import { clock, longDuration, shortDate, titleCase } from "@/lib/format";
import { PASS_MARK } from "@/lib/types";
import { cx } from "@/lib/cx";
import s from "./performance.module.css";

/**
 * The views of a learner's performance. They are shared by the Progress page (as tabs) and by the
 * Performance page (kept for instructors), so the two can never show different figures.
 */

export function Overview({
  view,
}: {
  view: Awaited<ReturnType<typeof getPerformanceOverview>>;
}) {
  const { stats } = view;

  return (
    <>
      <StatRow>
        <StatCard
          label="Sessions completed"
          value={String(stats.completed)}
          variant="accent"
          sub={`${stats.assessments} assessment${stats.assessments === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Average score"
          value={stats.meanScore !== undefined ? String(stats.meanScore) : "—"}
          variant="accent"
          sub={
            stats.passRate !== undefined
              ? `${stats.passRate}% at or above pass mark`
              : undefined
          }
        />
        <StatCard
          label="Best score"
          value={stats.bestScore !== undefined ? String(stats.bestScore) : "—"}
          variant="accent"
          sub={stats.bestDate ? shortDate(stats.bestDate) : undefined}
        />
        <StatCard
          label="Total time"
          value={longDuration(stats.totalTimeS)}
          variant="accent"
          sub={
            stats.meanTimeS !== undefined
              ? `avg ${longDuration(stats.meanTimeS)} / session`
              : undefined
          }
        />
      </StatRow>

      <div className={s.columns}>
        <section className={s.panel} aria-label="Recent session scores">
          <div>
            <p className={s.panelTitle}>Recent session scores</p>
            <p className={s.panelSub}>
              Pass marks — Beginner 60 · Intermediate 70 · Expert 80
            </p>
          </div>
          <BarChart data={view.lastScores} max={100} height={180} />
          <p className={s.caption}>{view.lastScoresCaption}</p>
        </section>

        <section className={s.panel} aria-label="By skill">
          <div>
            <p className={s.panelTitle}>By skill</p>
            <p className={s.panelSub}>
              Category averages across every scored report
            </p>
          </div>
          <SkillBars view={view} compact />
          <p className={s.caption}>
            {view.weakest && view.strongest
              ? `Weakest ${view.weakest.label} at ${view.weakest.pct}%; strongest ${view.strongest.label} at ${view.strongest.pct}%.`
              : "Category averages appear after the first scored report."}
          </p>
        </section>
      </div>

      <SectionHeader title="By procedure" />
      <div className={s.procGrid}>
        {view.procedures.map((proc) =>
          proc.status === "published" ? (
            <Card key={proc.id} padding="lg">
              <div className={s.panelTitle}>{proc.name}</div>
              {proc.tagline && <p className={s.panelSub}>{proc.tagline}</p>}
              <dl className={s.procMeta}>
                <div>
                  <dt>Sessions</dt>
                  <dd>{proc.sessions}</dd>
                </div>
                <div>
                  <dt>Best</dt>
                  <dd>{proc.best ?? "—"}</dd>
                </div>
                <div>
                  <dt>Latest</dt>
                  <dd>{proc.latest ?? "—"}</dd>
                </div>
              </dl>
            </Card>
          ) : (
            <Card key={proc.id} padding="lg" tone="sunken">
              <div className={cx(s.panelTitle, s.unpublished)}>{proc.name}</div>
              <p className={s.panelSub}>
                {titleCase(proc.status)} — not yet published.
              </p>
            </Card>
          ),
        )}
      </div>
    </>
  );
}

function SkillBars({
  view,
  compact,
}: {
  view: Awaited<ReturnType<typeof getPerformanceOverview>>;
  compact?: boolean;
}) {
  return (
    <div className={s.skillList}>
      {view.categories.map((cat) => {
        const bar = (
          <ProgressBar
            value={cat.pct}
            label={cat.label}
            valueLabel={`${cat.pct}%`}
            size={compact ? "sm" : "md"}
          />
        );
        return cat.slug ? (
          <Link
            key={cat.key}
            href={`/performance/${cat.slug}`}
            className={s.skillRow}
            aria-label={`${cat.label} — ${cat.pct}%. Open scene breakdown.`}
          >
            {bar}
          </Link>
        ) : (
          <div key={cat.key} className={s.skillRowStatic}>
            {bar}
          </div>
        );
      })}
    </div>
  );
}

export function Skills({
  view,
}: {
  view: Awaited<ReturnType<typeof getPerformanceOverview>>;
}) {
  return (
    <div className={s.panel}>
      <div>
        <p className={s.panelTitle}>Report categories</p>
        <p className={s.panelSub}>
          Your average share of the marks in each category, across every scored
          report. Open a category for its scene-by-scene breakdown.
        </p>
      </div>
      <SkillBars view={view} />
      <p className={s.caption}>
        {view.categories.map((c) => `${c.short} ${c.pct}%`).join(" · ")}
      </p>
    </div>
  );
}

export function History({
  view,
}: {
  view: Awaited<ReturnType<typeof getPerformanceOverview>>;
}) {
  return (
    <Table label="Session history">
      <THead>
        <Tr>
          <Th>Date</Th>
          <Th>Case</Th>
          <Th>Mode</Th>
          <Th>Difficulty</Th>
          <Th>Variant</Th>
          <Th numeric>Duration</Th>
          <Th numeric>Score</Th>
          <Th numeric>Pass mark</Th>
          <Th>Outcome</Th>
          <Th>
            <span className="srOnly">Open</span>
          </Th>
        </Tr>
      </THead>
      <TBody>
        {view.history.map((session) => {
          const passMark = PASS_MARK[session.difficulty];
          const scored =
            session.status === "completed" && session.totalScore !== undefined;
          return (
            <Tr key={session.id}>
              <Td head>{shortDate(session.startedAt)}</Td>
              <Td>{session.caseTitle}</Td>
              <Td>{titleCase(session.mode)}</Td>
              <Td>{titleCase(session.difficulty)}</Td>
              <Td>
                {session.design} · {titleCase(session.fixation)}
              </Td>
              <Td numeric>{clock(session.durationS)}</Td>
              <Td numeric>{scored ? session.totalScore : "—"}</Td>
              <Td numeric>{passMark}</Td>
              <Td>
                {scored ? (
                  <Badge
                    status={
                      (session.totalScore as number) >= passMark
                        ? "pass"
                        : "fail"
                    }
                  >
                    {(session.totalScore as number) >= passMark
                      ? "Passed"
                      : "Not passed"}
                  </Badge>
                ) : (
                  <Chip tone="muted">{titleCase(session.status)}</Chip>
                )}
              </Td>
              <Td>
                <Button variant="ghost" size="sm" href={`/sessions/${session.id}`}>
                  Open
                </Button>
              </Td>
            </Tr>
          );
        })}
      </TBody>
    </Table>
  );
}

/**
 * By skill, grouped by procedure. Each group lists the report categories averaged over the learner's
 * scored sessions on that procedure; a category opens its scene-by-scene breakdown.
 */
export function SkillGroupsView({
  groups,
}: {
  groups: Awaited<ReturnType<typeof getSkillGroups>>;
}) {
  if (groups.length === 0) {
    return (
      <div className={s.panel}>
        <p className={s.panelTitle}>No skill breakdown yet</p>
        <p className={s.panelSub}>
          Skills are averaged from scored reports, so they appear after your first scored session on a procedure.
        </p>
      </div>
    );
  }

  return (
    <>
      {groups.map((group) => (
        <section key={group.procedureId} className={s.panel} aria-label={`Skills in ${group.procedureName}`}>
          <div>
            <p className={s.panelTitle}>{group.procedureName}</p>
            <p className={s.panelSub}>
              {group.sessions} scored session{group.sessions === 1 ? "" : "s"}. Your average share of the marks in
              each category; open one for its scene-by-scene breakdown.
            </p>
          </div>
          {group.categories.length === 0 ? (
            <p className={s.panelSub}>
              {group.hasScoringModel
                ? "No category has been scored yet."
                : "This procedure does not have scored skill categories yet."}
            </p>
          ) : (
            <div className={s.skillList}>
              {group.categories.map((cat) => {
                const bar = <ProgressBar value={cat.pct} label={cat.label} valueLabel={`${cat.pct}%`} />;
                return cat.slug ? (
                  <Link
                    key={cat.key}
                    href={`/performance/${cat.slug}`}
                    className={s.skillRow}
                    aria-label={`${cat.label} — ${cat.pct}%. Open scene breakdown.`}
                  >
                    {bar}
                  </Link>
                ) : (
                  <div key={cat.key} className={s.skillRowStatic}>
                    {bar}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </>
  );
}
