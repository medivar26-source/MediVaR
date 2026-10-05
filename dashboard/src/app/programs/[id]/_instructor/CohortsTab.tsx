import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { SectionHeader } from "@/components/shell";
import { Badge, Chip, EmptyState } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { shortDate } from "@/lib/format";
import { NewCohort } from "@/app/cohorts/NewCohort";
import p from "@/app/panels.module.css";

type CohortRow = {
  id: string;
  name: string;
  learners?: number;
  mean_score?: number | null;
  meanScore?: number | null;
  below_pass?: number;
  belowPass?: number;
  created_at?: string;
  createdAt?: string;
  owner_name?: string;
  ownerName?: string;
  preset_name?: string;
  presetName?: string;
};

/** The cohorts under this program, how each is doing, and where to create another. */
export function CohortsTab({ programId, cohorts }: { programId: string; cohorts: CohortRow[] }) {
  const totalLearners = cohorts.reduce((sum, c) => sum + (c.learners || 0), 0);
  const belowPass = cohorts.reduce((sum, c) => sum + (c.below_pass ?? c.belowPass ?? 0), 0);

  return (
    <>
      <StatRow>
        <StatCard label="Cohorts" value={String(cohorts.length)} variant="dark" />
        <StatCard label="Learners" value={String(totalLearners)} />
        <StatCard label="Below pass" value={String(belowPass)} variant="accent" sub="against the intermediate mark" />
      </StatRow>

      {cohorts.length === 0 ? (
        <EmptyState icon={Users} title="No cohorts yet">
          A cohort groups learners so you can assign cases and schedule sessions. Create one below.
        </EmptyState>
      ) : (
        <div className={p.cards}>
          {cohorts.map((cohort) => {
            const mean = cohort.mean_score ?? cohort.meanScore;
            const below = cohort.below_pass ?? cohort.belowPass ?? 0;
            const dateVal = cohort.created_at || cohort.createdAt;
            const preset = cohort.preset_name ?? cohort.presetName ?? "Authored tolerances";

            return (
              <Link key={cohort.id} href={`/programs/${programId}/cohorts/${cohort.id}`} className={p.card}>
                <div className={p.panelHead}>
                  <p className={p.cardTitle}>{cohort.name}</p>
                  {mean !== undefined && mean !== null && <Badge status={mean >= 70 ? "pass" : "warn"}>{mean}</Badge>}
                </div>
                <p className={p.cardBody}>
                  {cohort.learners || 0} learner{(cohort.learners || 0) === 1 ? "" : "s"}
                  {mean === undefined || mean === null ? " · no scored reports yet" : ` · ${below} below the pass mark`}
                </p>
                <p className={p.cardMeta}>
                  {cohort.owner_name ?? cohort.ownerName ?? "—"} · {dateVal ? shortDate(dateVal) : "—"}
                </p>
                <div className={p.cardFoot}>
                  <Chip tone="muted">{preset}</Chip>
                  <span className={p.cardOpen}>
                    Manage cohort
                    <ChevronRight className={p.cardChevron} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <SectionHeader title="Add a cohort" />
      <section className={p.panel} aria-label="Add a cohort">
        <div>
          <p className={p.panelTitle}>New cohort</p>
          <p className={p.panelSub}>Create a new cohort under this program.</p>
        </div>
        <NewCohort programId={programId} />
      </section>
    </>
  );
}
