import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, GraduationCap } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, EmptyState, DemoDataNote } from "@/components/ui";
import { LearnerAnalytics } from "@/components/dashboard/LearnerAnalytics";
import { getLearnerDashboard } from "@/lib/data/dashboard";
import {
  getActivity,
  getPerformanceOverview,
  getReportsList,
  getSkillGroups,
} from "@/lib/data/performance";
import { personaFor } from "@/lib/roles";
import { WEEK_OPTIONS, windowFromParam } from "@/lib/window";
import { getCurrentUser } from "@/lib/session";
import { cx } from "@/lib/cx";
import { ActivityView } from "../activity/ActivityView";
import { ReportsView } from "../reports/ReportsView";
import { History, Overview, SkillGroupsView } from "./PerformanceViews";
import s from "./performance.module.css";

export const metadata: Metadata = { title: "Insights" };

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
 * Insights: an instructor's or administrator's Activity, Reports and Performance on one page, as a
 * learner's are on Progress. They were three pages in the side navigation, with By skill as a fourth
 * group of links; they are tabs here, with the same views and the same data as before. The tab is in
 * the URL (`?tab=`), so it survives a reload and can be linked to, and only the selected tab's data is
 * read. The old addresses (`/activity`, `/reports`) send staff to the matching tab.
 */
export default async function PerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; weeks?: string }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();

  // A learner's Overview, By skill, Trends and History are tabs of Progress. The old address keeps working.
  if (personaFor(user.role) === "learner") {
    redirect(params.tab && params.tab !== "overview" ? `/progress?tab=${encodeURIComponent(params.tab)}` : "/progress");
  }

  const tab: TabId = TABS.find((t) => t.id === params.tab)?.id ?? "overview";

  return (
    <AppShell user={user} searchHint='Try searching "performance"'>
      <PageHeader title="Insights" lede="Reports from the sessions you supervise, and your own practice." />
      <DemoDataNote
        sample="scores, activity and reports for past sessions"
        live="the sessions scheduled in your cohorts"
      />

      {/* The tab is the URL: it survives a reload and can be
          sent in a message, and the server renders only the selected panel. */}
      <nav className={s.tabs} aria-label="Insights views">
        {TABS.map((t) => (
          <Link prefetch={false}
            key={t.id}
            href={t.id === "overview" ? "/performance" : `/performance?tab=${t.id}`}
            className={cx(s.tab, tab === t.id && s.tabOn)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "activity" && <ActivityView view={await getActivity(user.id)} />}
      {tab === "reports" && <ReportsTab />}
      {tab !== "activity" && tab !== "reports" && (
        <PracticeTab tab={tab} userId={user.id} weeksParam={params.weeks} />
      )}
    </AppShell>
  );
}

async function ReportsTab() {
  const user = await getCurrentUser();
  const reports = await getReportsList(user);
  // A name column only earns its width when the list spans more than the viewer's own sessions.
  const showLearner = reports.some((r) => r.userId !== user.id);
  return <ReportsView reports={reports} learner={false} showLearner={showLearner} />;
}

/** Overview, By skill, Trends and History: the viewer's own scored sessions. */
async function PracticeTab({
  tab,
  userId,
  weeksParam,
}: {
  tab: Exclude<TabId, "activity" | "reports">;
  userId: string;
  weeksParam?: string;
}) {
  const view = await getPerformanceOverview(userId);

  if (view.stats.completed === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No practice sessions of your own yet"
        action={
          <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap", justifyContent: "center" }}>
            <Button variant="primary" icon={GraduationCap} href="/programs">
              Open programs
            </Button>
            <Button variant="secondary" href="/performance?tab=reports">
              Reports
            </Button>
          </div>
        }
      >
        This tab counts the sessions you run yourself. Your learners&rsquo; results are in each
        program&rsquo;s Cohort performance tab, and every report you can read is under Reports.
      </EmptyState>
    );
  }

  if (tab === "overview") return <Overview view={view} />;
  if (tab === "skills") return <SkillGroupsView groups={await getSkillGroups(userId)} />;
  if (tab === "history") return <History view={view} />;
  const weeks = windowFromParam(weeksParam, WEEK_OPTIONS);
  return <LearnerAnalytics data={await getLearnerDashboard(userId, weeks)} weeks={weeks} />;
}
