import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, DemoDataNote, EmptyState } from "@/components/ui";
import { LearnerAnalytics } from "@/components/dashboard/LearnerAnalytics";
import { getLearnerDashboard } from "@/lib/data/dashboard";
import { startEarlyReads } from "@/lib/data/early-reads";
import {
  getActivity,
  getPerformanceOverview,
  getReportsList,
  getSkillGroups,
} from "@/lib/data/performance";
import { cx } from "@/lib/cx";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { WEEK_OPTIONS, windowFromParam } from "@/lib/window";
import { ActivityView } from "../activity/ActivityView";
import { History, Overview, SkillGroupsView } from "../performance/PerformanceViews";
import s from "../performance/performance.module.css";
import { ReportsView } from "../reports/ReportsView";

export const metadata: Metadata = { title: "Progress" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "reports", label: "Reports" },
  { id: "skills", label: "By skill" },
  { id: "trends", label: "Trends" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Progress: everything a learner checks about how they are doing, on one page.
 *
 * Overview, Activity and Reports were three pages in the side navigation, with By skill as a fourth
 * group of links; Trends and History were already tabs of Performance. They are tabs here, with the
 * same views, so a figure reads the same wherever it is shown. The tab is in the URL (`?tab=`), so
 * it survives a reload and can be linked to, and only the selected tab's data is read.
 *
 * The old addresses (`/performance`, `/activity`, `/reports`) send a learner here. Instructors and
 * administrators read progress through their cohorts and keep their own pages.
 */
export default async function ProgressPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; weeks?: string }>;
}) {
  const params = await searchParams;
  const tab: TabId = TABS.find((t) => t.id === params.tab)?.id ?? "overview";

  // Overview, Activity and History list the learner's sessions: start that read while the identity check runs
  // (see `early-reads.ts`). The other tabs read built-in data and need nothing early.
  startEarlyReads({ sessions: tab === "overview" || tab === "activity" || tab === "history" });
  const user = await getCurrentUser();

  if (personaFor(user.role) !== "learner") redirect("/performance");

  return (
    <AppShell user={user} searchHint='Try searching "reports"'>
      <PageHeader title="Progress" lede="See how you are doing, open a report, or work on a skill." />
      <DemoDataNote
        sample="scores, activity and reports for past sessions"
        live="the sessions scheduled for you"
      />

      <nav className={s.tabs} aria-label="Progress views">
        {TABS.map((t) => (
          <Link prefetch={false}
            key={t.id}
            href={t.id === "overview" ? "/progress" : `/progress?tab=${t.id}`}
            className={cx(s.tab, tab === t.id && s.tabOn)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "overview" && <OverviewTab userId={user.id} />}
      {tab === "activity" && <ActivityView view={await getActivity(user.id)} />}
      {tab === "reports" && (
        <ReportsView reports={await getReportsList(user)} learner showLearner={false} />
      )}
      {tab === "skills" && <SkillGroupsView groups={await getSkillGroups(user.id)} />}
      {tab === "trends" && <TrendsTab userId={user.id} weeksParam={params.weeks} />}
      {tab === "history" && <HistoryTab userId={user.id} />}
    </AppShell>
  );
}

async function OverviewTab({ userId }: { userId: string }) {
  const view = await getPerformanceOverview(userId);
  if (view.stats.completed === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No completed sessions yet"
        action={
          <Button variant="primary" icon={Play} href="/cases">
            Start a case
          </Button>
        }
      >
        Your progress appears after your first completed session — every figure here is derived from
        scored reports, so there is nothing honest to draw yet.
      </EmptyState>
    );
  }
  return <Overview view={view} />;
}

async function HistoryTab({ userId }: { userId: string }) {
  const view = await getPerformanceOverview(userId);
  if (view.history.length === 0) {
    return (
      <EmptyState icon={BarChart3} title="No sessions yet">
        Your sessions appear here once you have run one.
      </EmptyState>
    );
  }
  return <History view={view} />;
}

async function TrendsTab({ userId, weeksParam }: { userId: string; weeksParam?: string }) {
  const weeks = windowFromParam(weeksParam, WEEK_OPTIONS);
  const trends = await getLearnerDashboard(userId, weeks);
  return <LearnerAnalytics data={trends} weeks={weeks} />;
}
