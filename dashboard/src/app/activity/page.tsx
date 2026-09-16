import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Badge, Chip, EmptyState } from "@/components/ui";
import { BarChart, StatCard, StatRow } from "@/components/viz";
import { getActivity } from "@/lib/data/performance";
import { longDuration, timeOfDay, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import s from "./activity.module.css";

export const metadata: Metadata = { title: "Activity" };

export default async function ActivityPage() {
  const user = await getCurrentUser();
  const view = await getActivity(user.id);

  return (
    <AppShell user={user} searchHint='Try searching "activity"'>
      <PageHeader
        title="Activity"
        lede="Your practice rhythm — every session, day by day, and the weekly pattern behind it."
      />

      {view.totals.sessions === 0 ? (
        <EmptyState icon={CalendarClock} title="No activity yet">
          Sessions appear here the moment one starts. Plan a case and pair a
          headset to begin.
        </EmptyState>
      ) : (
        <>
          <StatRow>
            <StatCard
              label="Sessions"
              value={String(view.totals.sessions)}
              variant="accent"
              sub="most recent 60 shown below"
            />
            <StatCard
              label="Completed"
              value={String(view.totals.completed)}
              variant="accent"
            />
            <StatCard
              label="Time in theatre"
              value={longDuration(view.totals.timeS)}
              variant="accent"
              sub="completed sessions"
            />
            <StatCard
              label="Active weeks"
              value={String(view.weekly.filter((w) => w.sessions > 0).length)}
              variant="accent"
              sub={`of the last ${view.weekly.length}`}
            />
          </StatRow>

          <div className={s.columns}>
            <section className={s.panel} aria-label="Sessions per week">
              <div>
                <p className={s.panelTitle}>Sessions per week</p>
                <p className={s.panelSub}>Last {view.weekly.length} weeks</p>
              </div>
              <BarChart
                data={view.weekly.map((w) => ({
                  label: w.label,
                  value: w.sessions,
                }))}
                height={180}
              />
              <p className={s.caption}>{view.weeklyCaption}</p>
            </section>

            <section className={s.panel} aria-label="About this log">
              <div>
                <p className={s.panelTitle}>Reading this log</p>
              </div>
              <p className={s.panelSub}>
                Each entry links to the session it records — a live session
                opens its mirror, a completed one its report. Scores are shown
                where a report exists; a session without one shows its state
                instead.
              </p>
            </section>
          </div>

          {view.days.map((day) => (
            <section key={day.day} className={s.day} aria-label={day.day}>
              <SectionHeader title={day.day} />
              <div className={s.dayList}>
                {day.sessions.map((session) => {
                  const scored =
                    session.status === "completed" &&
                    session.totalScore !== undefined;
                  return (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className={s.entry}
                    >
                      <span className={s.entryTime}>
                        {timeOfDay(session.startedAt)}
                      </span>
                      <span className={s.entryTitle}>{session.caseTitle}</span>
                      <span className={s.entryMeta}>
                        {titleCase(session.mode)} ·{" "}
                        {titleCase(session.difficulty)} · {session.design} ·{" "}
                        {titleCase(session.fixation)}
                      </span>
                      {scored ? (
                        <>
                          <span className={s.entryScore}>
                            {session.totalScore}
                          </span>
                          <Badge
                            status={
                              (session.totalScore as number) >=
                                PASS_MARK[session.difficulty] &&
                              session.criticalErrors < 3
                                ? "pass"
                                : "fail"
                            }
                          >
                            {(session.totalScore as number) >=
                              PASS_MARK[session.difficulty] &&
                            session.criticalErrors < 3
                              ? "Passed"
                              : "Not passed"}
                          </Badge>
                        </>
                      ) : (
                        <Chip tone="muted">{titleCase(session.status)}</Chip>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}
    </AppShell>
  );
}
