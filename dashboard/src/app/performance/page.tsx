import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Play } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  ProgressBar,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { BarChart, StatCard, StatRow } from "@/components/viz";
import { getPerformanceOverview } from "@/lib/data/performance";
import { clock, longDuration, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import { cx } from "@/lib/cx";
import s from "./performance.module.css";

export const metadata: Metadata = { title: "Performance" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "By skill" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const view = await getPerformanceOverview(user.id);

  const tab: TabId = TABS.some((t) => t.id === params.tab)
    ? (params.tab as TabId)
    : "overview";

  const lede = user.level
    ? `${user.displayName} · ${user.level}`
    : user.displayName;

  return (
    <AppShell user={user} searchHint='Try searching "performance"'>
      <PageHeader title="Performance" lede={lede} />

      {/* The tab is the URL: it survives a reload and can be
          sent in a message, and the server renders only the selected panel. */}
      <nav className={s.tabs} aria-label="Performance views">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "overview" ? "/performance" : `/performance?tab=${t.id}`}
            className={cx(s.tab, tab === t.id && s.tabOn)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {view.stats.completed === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No completed sessions yet"
          action={
            <Button variant="primary" icon={Play} href="/setup">
              Start simulation
            </Button>
          }
        >
          Performance appears after the first completed session — every figure
          on this screen is derived from scored reports, so there is nothing
          honest to draw yet.
        </EmptyState>
      ) : (
        <>
          {tab === "overview" && <Overview view={view} />}
          {tab === "skills" && <Skills view={view} />}
          {tab === "history" && <History view={view} />}
        </>
      )}
    </AppShell>
  );
}

function Overview({
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

function Skills({
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

function History({
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
