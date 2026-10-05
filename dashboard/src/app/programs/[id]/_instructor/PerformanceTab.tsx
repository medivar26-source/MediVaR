import Link from "next/link";
import { BarChart3, Users } from "lucide-react";
import { SectionHeader } from "@/components/shell";
import { Badge, Button, EmptyState, ProgressBar, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { RankedList, StatCard, StatRow } from "@/components/viz";
import { getCohort, getCohortSessions } from "@/lib/data/cohorts";
import { getReportsList } from "@/lib/data/performance";
import { shortDate, titleCase } from "@/lib/format";
import type { Profile } from "@/lib/types";
import p from "@/app/panels.module.css";
import { CohortChips } from "./CohortChips";

/**
 * How the cohort as a whole is doing: headline numbers, what it is weak at, where in the
 * operation it goes wrong, and how each session went overall. Individual learners live in the
 * Learners & Performance tab.
 */
export async function PerformanceTab({
  user,
  programId,
  cohorts,
  cohortId,
}: {
  user: Profile;
  programId: string;
  cohorts: { id: string; name: string }[];
  cohortId: string | undefined;
}) {
  if (cohorts.length === 0 || !cohortId) {
    return (
      <EmptyState icon={BarChart3} title="No cohorts yet">
        Create a cohort in the Cohorts tab. Its combined performance appears here once its learners have run sessions.
      </EmptyState>
    );
  }

  const [detail, sessions, reports] = await Promise.all([
    getCohort(cohortId),
    getCohortSessions(cohortId),
    getReportsList(user).catch(() => []),
  ]);

  if (!detail) {
    return (
      <EmptyState icon={BarChart3} title="This cohort could not be loaded">
        It may have been removed, or you may not supervise it.
      </EmptyState>
    );
  }

  const { cohort, learners, categories, hotspots } = detail;
  const scored = learners.filter((l) => l.meanScore !== undefined);
  const memberIds = new Set(learners.map((l) => l.id));
  const cohortReports = reports.filter((r) => memberIds.has(r.userId ?? ""));

  const ordered = [...sessions].sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  return (
    <>
      <CohortChips programId={programId} tab="performance" cohorts={cohorts} selectedId={cohortId} />

      <StatRow>
        <StatCard
          label="Mean score"
          value={cohort.meanScore !== undefined ? String(cohort.meanScore) : "—"}
          variant="accent"
          sub={
            cohort.meanScore === undefined
              ? "no scored reports yet"
              : `across ${scored.length} learner${scored.length === 1 ? "" : "s"}`
          }
        />
        <StatCard label="Below pass" value={String(cohort.belowPass)} variant="accent" sub="against the intermediate mark" />
        <StatCard
          label="Critical errors"
          value={String(learners.reduce((sum, l) => sum + l.criticalErrors, 0))}
          variant="accent"
          sub="across every session"
        />
        <StatCard
          label="Not started"
          value={String(learners.filter((l) => l.sessions === 0).length)}
          variant="accent"
          sub="have not performed once"
        />
      </StatRow>

      <div className={p.even}>
        <section className={p.panel} aria-label="Cohort weakness profile">
          <div>
            <p className={p.panelTitle}>Weakness profile</p>
            <p className={p.panelSub}>
              What this cohort is weak <em>at</em>: every scored report from a member, averaged across the assessment categories.
            </p>
          </div>
          {categories.length === 0 ? (
            <p className={p.panelSub}>No scored reports yet, so there is nothing to average.</p>
          ) : (
            <div className={p.rows}>
              {categories.map((category) => (
                <div key={category.key} className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>{category.label}</p>
                    <ProgressBar value={category.pct} threshold={70} tone={category.pct >= 70 ? "pass" : "warn"} />
                  </div>
                  <div className={p.rowAside}>
                    <Badge status={category.pct >= 70 ? "pass" : "warn"}>{category.pct}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={p.panel} aria-label="Scene hotspots">
          <div>
            <p className={p.panelTitle}>Scene hotspots</p>
            <p className={p.panelSub}>
              <em>Where</em> in the operation it goes wrong: the scenes that most often ended in a failed or borderline verdict.
            </p>
          </div>
          {hotspots.length === 0 ? (
            <p className={p.panelSub}>No scene has cost this cohort marks yet.</p>
          ) : (
            <RankedList
              items={hotspots.map((hotspot) => ({
                tag: hotspot.scene,
                label: hotspot.label,
                value: `${hotspot.affected}`,
                pct: hotspot.learners ? Math.round((hotspot.affected / hotspot.learners) * 100) : 0,
              }))}
            />
          )}
        </section>
      </div>

      <SectionHeader
        title="Session by session"
        action={
          <Button variant="secondary" size="sm" href={`/programs/${programId}?tab=learners&cohort=${cohortId}`} icon={Users}>
            See each learner
          </Button>
        }
      />
      {ordered.length === 0 ? (
        <EmptyState icon={BarChart3} title="No sessions yet">
          Schedule a session for this cohort from the cohort workspace.
        </EmptyState>
      ) : (
        <Table label={`Sessions for ${cohort.name}`}>
          <THead>
            <Tr>
              <Th>Session</Th>
              <Th>Date</Th>
              <Th>Case</Th>
              <Th>Status</Th>
              <Th>Completion</Th>
              <Th numeric>Mean score</Th>
              <Th>
                <span className="srOnly">Open</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {ordered.map((s) => {
              const scores = cohortReports
                .filter((r) => r.id === s.id && r.totalScore !== undefined)
                .map((r) => r.totalScore as number);
              const mean = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : undefined;
              const completionPct = s.residentCount ? Math.round((s.completedCount / s.residentCount) * 100) : 0;
              return (
                <Tr key={s.id}>
                  <Td head>{s.name}</Td>
                  <Td>{shortDate(s.scheduledAt)}</Td>
                  <Td>{s.caseName ?? "—"}</Td>
                  <Td>
                    <Badge status={s.status === "completed" ? "pass" : s.status === "cancelled" ? "fail" : "neutral"}>
                      {titleCase(s.status.replace("_", " "))}
                    </Badge>
                  </Td>
                  <Td>
                    <div style={{ display: "grid", gap: 2, minWidth: 120 }}>
                      <ProgressBar value={completionPct} size="sm" tone={completionPct >= 70 ? "pass" : "warn"} />
                      <span style={{ fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
                        {s.completedCount} of {s.residentCount}
                      </span>
                    </div>
                  </Td>
                  <Td numeric>{mean ?? "—"}</Td>
                  <Td>
                    <Link href={`/programs/${programId}?tab=learners&cohort=${cohortId}&session=${s.id}`}>Learners</Link>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </>
  );
}
