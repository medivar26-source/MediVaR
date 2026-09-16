import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Users } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Badge, Chip, EmptyState } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getCohorts } from "@/lib/data/cohorts";
import { NewCohort } from "./NewCohort";
import { shortDate } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Cohorts" };

/**
 * Instructors and administrators only — a learner is redirected rather than
 * shown an empty page. `cohorts_read` would in fact return their own cohort, so
 * this is a navigation decision and not the boundary. The store has to enforce
 * the same rule independently, and does not yet.
 */
export default async function CohortsPage() {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const cohorts = await getCohorts();

  const learners = cohorts.reduce((sum, c) => sum + c.learners, 0);
  const belowPass = cohorts.reduce((sum, c) => sum + c.belowPass, 0);
  const scored = cohorts.filter((c) => c.meanScore !== undefined);

  return (
    <AppShell user={user} searchHint='Try searching "cohorts"'>
      <PageHeader
        title="Cohorts"
        lede="The groups you teach, what each one is scoring, and which rule set their plans are made under."
      />

      {cohorts.length === 0 ? (
        <EmptyState icon={Users} title="No cohorts yet">
          A cohort is what scopes an instructor&rsquo;s reach: you can read the
          work of the learners in cohorts you own, and nobody else&rsquo;s.
          Create one, then invite learners into it with a link — or ask an
          administrator to assign them.
        </EmptyState>
      ) : (
        <>
          <StatRow>
            <StatCard
              label="Cohorts"
              value={String(cohorts.length)}
              variant="dark"
            />
            <StatCard label="Learners" value={String(learners)} />
            <StatCard
              label="Below pass"
              value={String(belowPass)}
              variant="accent"
              sub="against the intermediate mark"
            />
            <StatCard
              label="Configured"
              value={String(cohorts.filter((c) => c.presetId).length)}
              sub="cohorts carrying a preset"
            />
          </StatRow>

          <div className={p.cards}>
            {cohorts.map((cohort) => (
              <Link
                key={cohort.id}
                href={`/cohorts/${cohort.id}`}
                className={p.card}
              >
                <div className={p.panelHead}>
                  <p className={p.cardTitle}>{cohort.name}</p>
                  {cohort.meanScore !== undefined && (
                    <Badge status={cohort.meanScore >= 70 ? "pass" : "warn"}>
                      {cohort.meanScore}
                    </Badge>
                  )}
                </div>
                {/* Two lines, not one sentence. The first is what the cohort
                    is doing, the second is what it is — a run-on that put the
                    owner's name in the same breath as the pass mark made
                    neither of them findable. */}
                <p className={p.cardBody}>
                  {cohort.learners} learner{cohort.learners === 1 ? "" : "s"}
                  {cohort.meanScore === undefined
                    ? " · no scored reports yet"
                    : ` · ${cohort.belowPass} below the pass mark`}
                </p>
                <p className={p.cardMeta}>
                  {cohort.ownerName ?? "—"} · {shortDate(cohort.createdAt)}
                </p>
                <div className={p.cardFoot}>
                  <Chip tone="muted">
                    {cohort.presetName ?? "Authored tolerances"}
                  </Chip>
                  <span className={p.cardOpen}>
                    Open
                    <ChevronRight className={p.cardChevron} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <SectionHeader
            title="Learners"
            action={
              <Link href="/cohorts/learners" className={p.clear}>
                Every learner you supervise
              </Link>
            }
          />

          <section className={p.panel} aria-label="About cohort figures">
            <p className={p.panelSub}>
              A cohort mean is drawn from the reports of everybody in it, and{" "}
              {scored.length === cohorts.length
                ? "every cohort here has enough scored work to show one"
                : `${cohorts.length - scored.length} of ${cohorts.length} do not have a scored report yet, so they show none rather than a zero`}
              .
            </p>
            <p className={p.note}>
              Where a figure would be drawn from fewer than three contributors
              the database withholds it, in this screen and in a learner&rsquo;s
              percentile alike — a mean of two is one person&rsquo;s score
              wearing a disguise.
            </p>
          </section>
        </>
      )}

      <SectionHeader title="Add a cohort" />
      <section className={p.panel} aria-label="Add a cohort">
        <div>
          <p className={p.panelTitle}>New cohort</p>
          <p className={p.panelSub}>
            You own what you create, and ownership is what lets you read the work
            of the people in it. Learners join through an invite link issued on
            the cohort&rsquo;s own page.
          </p>
        </div>
        <NewCohort />
      </section>
    </AppShell>
  );
}
