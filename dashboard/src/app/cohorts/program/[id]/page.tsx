import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, Users, ChevronLeft } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Badge, Chip, EmptyState } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getProgramDetail, getProgramCohorts } from "@/lib/data/programs";
import { NewCohort } from "@/app/cohorts/NewCohort";
import { shortDate } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import p from "../../../panels.module.css";

export const metadata: Metadata = { title: "Program Cohorts" };

export default async function ProgramCohortsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const program = await getProgramDetail(id).catch(() => null);
  if (!program) notFound();

  const cohorts = await getProgramCohorts(id);

  const learners = cohorts.reduce((sum, c) => sum + (c.learners || 0), 0);
  const belowPass = cohorts.reduce((sum, c) => sum + (c.below_pass ?? c.belowPass ?? 0), 0);
  const scored = cohorts.filter((c) => (c.mean_score ?? c.meanScore) !== undefined && (c.mean_score ?? c.meanScore) !== null);

  return (
    <AppShell user={user} searchHint='Try searching "cohorts"'>
      <div style={{ marginBottom: "1rem" }}>
        <Link href="/cohorts" className={p.clear} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <ChevronLeft size={16} /> Back to Programs
        </Link>
      </div>

      <PageHeader
        title={`${program.name} Cohorts`}
        lede={program.description || "Manage the groups and learners inside this program."}
      />

      {cohorts.length === 0 ? (
        <EmptyState icon={Users} title="No cohorts yet">
          A cohort is what scopes an instructor&rsquo;s reach.
          Create one, then add learners to it directly.
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
          </StatRow>

          <div className={p.cards}>
            {cohorts.map((cohort) => {
              const mean = cohort.mean_score ?? cohort.meanScore;
              const below = cohort.below_pass ?? cohort.belowPass ?? 0;
              const dateVal = cohort.created_at || cohort.createdAt;
              const preset = cohort.preset_name ?? cohort.presetName ?? "Authored tolerances";

              return (
                <Link
                  key={cohort.id}
                  href={`/cohorts/${cohort.id}`}
                  className={p.card}
                >
                  <div className={p.panelHead}>
                    <p className={p.cardTitle}>{cohort.name}</p>
                    {mean !== undefined && mean !== null && (
                      <Badge status={mean >= 70 ? "pass" : "warn"}>
                        {mean}
                      </Badge>
                    )}
                  </div>
                  <p className={p.cardBody}>
                    {cohort.learners || 0} learner{(cohort.learners || 0) === 1 ? "" : "s"}
                    {mean === undefined || mean === null
                      ? " · no scored reports yet"
                      : ` · ${below} below the pass mark`}
                  </p>
                  <p className={p.cardMeta}>
                    {cohort.owner_name ?? cohort.ownerName ?? "—"} · {dateVal ? shortDate(dateVal) : "—"}
                  </p>
                  <div className={p.cardFoot}>
                    <Chip tone="muted">
                      {preset}
                    </Chip>
                    <span className={p.cardOpen}>
                      Open
                      <ChevronRight className={p.cardChevron} strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <SectionHeader
            title="Learners"
            action={
              <Link href="/cohorts/learners" className={p.clear}>
                Every learner you supervise
              </Link>
            }
          />
        </>
      )}

      <SectionHeader title="Add a cohort" />
      <section className={p.panel} aria-label="Add a cohort">
        <div>
          <p className={p.panelTitle}>New cohort</p>
          <p className={p.panelSub}>
            Create a new cohort under this program.
          </p>
        </div>
        <NewCohort programId={program.id} />
      </section>
    </AppShell>
  );
}
