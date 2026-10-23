import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BarChart3, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Button, EmptyState, DemoDataNote } from "@/components/ui";
import { LearnerAnalytics } from "@/components/dashboard/LearnerAnalytics";
import { getLearnerDashboard } from "@/lib/data/dashboard";
import { getPerformanceOverview } from "@/lib/data/performance";
import { personaFor } from "@/lib/roles";
import { WEEK_OPTIONS, windowFromParam } from "@/lib/window";
import { getCurrentUser } from "@/lib/session";
import { cx } from "@/lib/cx";
import { History, Overview, Skills } from "./PerformanceViews";
import s from "./performance.module.css";

export const metadata: Metadata = { title: "Performance" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "skills", label: "By skill" },
  { id: "trends", label: "Trends" },
  { id: "history", label: "History" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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

  const view = await getPerformanceOverview(user.id);

  const tab: TabId = TABS.some((t) => t.id === params.tab)
    ? (params.tab as TabId)
    : "overview";

  // Trends (mark loss, weekly cadence, score dynamic) used to sit on the home page.
  const weeks = windowFromParam(params.weeks, WEEK_OPTIONS);
  const trends = tab === "trends" ? await getLearnerDashboard(user.id, weeks) : undefined;

  const lede = user.level
    ? `${user.displayName} · ${user.level}`
    : user.displayName;

  return (
    <AppShell user={user} searchHint='Try searching "performance"'>
      <PageHeader title="Performance" lede={lede} />
      <DemoDataNote />


      {/* The tab is the URL: it survives a reload and can be
          sent in a message, and the server renders only the selected panel. */}
      <nav className={s.tabs} aria-label="Performance views">
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

      {view.stats.completed === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No completed sessions yet"
          action={
            <Button variant="primary" icon={Play} href="/cases">
              Start a case
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
          {trends && <LearnerAnalytics data={trends} weeks={weeks} />}
          {tab === "history" && <History view={view} />}
        </>
      )}
    </AppShell>
  );
}
