import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, ChevronLeft } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import {
  Badge,
  Button,
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
import { RankedList, StatCard, StatRow } from "@/components/viz";
import { AssignPreset } from "../AssignPreset";
import { ManageLearnersPanel } from "../ManageLearnersPanel";
import { getCohort } from "@/lib/data/cohorts";
import { relativeTime, shortDate } from "@/lib/format";
import { personaFor, ROLE_LABEL } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import p from "../../panels.module.css";

export const metadata: Metadata = { title: "Cohort" };

export default async function CohortPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const detail = await getCohort(id);

  // Not found and not yours are the same answer. `cohorts_read` already decided;
  // distinguishing them here would confirm that a cohort exists to somebody who
  // may not read it.
  if (!detail) redirect("/cohorts");

  const { cohort, learners, categories, hotspots, presets } = detail;
  const now = new Date().toISOString();
  const scored = learners.filter((l) => l.meanScore !== undefined);

  // Only presets this viewer could actually assign appear in the picker.
  const assignable = presets.filter(
    (preset) => preset.ownerId === user.id || persona === "admin",
  );

  return (
    <AppShell user={user} searchHint='Try searching "cohorts"'>
      <div style={{ marginBottom: "1rem" }}>
        <Link href={`/cohorts/program/${cohort.program_id}`} className={p.clear} style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <ChevronLeft size={16} /> Back to Cohorts
        </Link>
      </div>

      <PageHeader
        eyebrow="Cohort"
        title={cohort.name}
        lede={`${cohort.learners} learner${cohort.learners === 1 ? "" : "s"} · owned by ${cohort.ownerName ?? "—"} · created ${shortDate(cohort.createdAt)}`}
        actions={
          <Button href="/cohorts" variant="secondary">
            All cohorts
          </Button>
        }
      />

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
        <StatCard
          label="Below pass"
          value={String(cohort.belowPass)}
          variant="accent"
        />
        <StatCard
          label="Critical errors"
          value={String(
            learners.reduce((sum, l) => sum + l.criticalErrors, 0),
          )}
          variant="accent"
          sub="across every session"
        />
        {/* Counted on sessions, not on `last_active_at`. That column is stamped
            by signing in, so a cohort where everybody has logged in and nobody
            has operated read "Never active 0" — true, and the opposite of what
            an instructor takes from it. The Last active column below already
            answers the sign-in question, so the tile was spending a quarter of
            the row repeating it. */}
        <StatCard
          label="No sessions yet"
          value={String(learners.filter((l) => l.sessions === 0).length)}
          variant="accent"
          sub="have not performed once"
        />
      </StatRow>

      <SectionHeader title="Learners" />
      {learners.length === 0 ? (
        <EmptyState icon={Users} title="Nobody has joined yet">
          Create new learner accounts or enroll existing learners from the Enrollment panel below.
        </EmptyState>
      ) : (
        <Table label={`Learners in ${cohort.name}`}>
          <THead>
            <Tr>
              <Th>Learner</Th>
              <Th>Role</Th>
              <Th numeric>Sessions</Th>
              <Th numeric>Assessments</Th>
              <Th numeric>Mean</Th>
              <Th>Weakest</Th>
              <Th numeric>Critical</Th>
              <Th>Last active</Th>
            </Tr>
          </THead>
          <TBody>
            {learners.map((learner) => (
              <Tr key={learner.id}>
                <Td head>{learner.displayName}</Td>
                <Td>{ROLE_LABEL[learner.role]}</Td>
                <Td numeric>{learner.sessions}</Td>
                <Td numeric>{learner.assessments}</Td>
                <Td numeric>{learner.meanScore ?? "—"}</Td>
                <Td>
                  {learner.weakestCategory ? (
                    <Chip tone="muted">{learner.weakestCategory}</Chip>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td numeric>{learner.criticalErrors}</Td>
                <Td>
                  {learner.lastActiveAt
                    ? relativeTime(learner.lastActiveAt, now)
                    : "Never"}
                </Td>
              </Tr>
            ))}
            </TBody>
        </Table>
      )}

      <div className={p.even}>
        <section className={p.panel} aria-label="Cohort weakness profile">
          <div>
            <p className={p.panelTitle}>Weakness profile</p>
            <p className={p.panelSub}>
              What this cohort is weak <em>at</em>. Every scored report from a
              member, averaged across the seven categories a score is made of.
              The lowest bar is the thing to teach next.
            </p>
          </div>
          {categories.length === 0 ? (
            <p className={p.panelSub}>
              No scored reports yet, so there is nothing to average.
            </p>
          ) : (
            <div className={p.rows}>
              {categories.map((category) => (
                <div key={category.key} className={p.row}>
                  <div className={p.rowBody}>
                    <p className={p.rowTitle}>{category.label}</p>
                    <ProgressBar
                      value={category.pct}
                      threshold={70}
                      tone={category.pct >= 70 ? "pass" : "warn"}
                    />
                  </div>
                  <div className={p.rowAside}>
                    <Badge status={category.pct >= 70 ? "pass" : "warn"}>
                      {category.pct}%
                    </Badge>
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
              <em>Where</em> in the operation it goes wrong. The scenes that
              most often ended in a failed or borderline verdict, and how many
              learners each one caught.
            </p>
          </div>
          {hotspots.length === 0 ? (
            <p className={p.panelSub}>
              No scene has cost this cohort marks yet.
            </p>
          ) : (
            <RankedList
              items={hotspots.map((hotspot) => ({
                tag: hotspot.scene,
                label: hotspot.label,
                value: `${hotspot.affected}`,
                pct: hotspot.learners
                  ? Math.round((hotspot.affected / hotspot.learners) * 100)
                  : 0,
              }))}
            />
          )}
        </section>
      </div>

      <SectionHeader title="Enrolment" />
      <section className={p.panel} aria-label="Manage Learners">
        <div>
          <p className={p.panelTitle}>Manage Learners</p>
          <p className={p.panelSub}>
            Directly provision new learner accounts or add existing learners using their Learner ID.
          </p>
        </div>

        <ManageLearnersPanel cohortId={cohort.id} />
      </section>

      <SectionHeader title="Configuration" />
      <section className={p.panel} aria-label="Configuration preset">
        <div>
          <p className={p.panelTitle}>Preset</p>
          <p className={p.panelSub}>
            {cohort.presetName
              ? `New plans from this cohort are stamped with ${cohort.presetName}, and every session run from one names it on its report.`
              : "New plans from this cohort run against the authored tolerances."}
          </p>
        </div>

        {assignable.length === 0 ? (
          <p className={p.panelSub}>
            You have no presets to assign. A preset is created from the
            Configure panel on a case, and it records what to change about the
            rule set — tolerance scaling, guides, per-scene settings.
          </p>
        ) : (
          <AssignPreset
            cohortId={cohort.id}
            currentPresetId={cohort.presetId}
            presets={assignable.map((preset) => ({
              id: preset.id,
              name: preset.name,
            }))}
          />
        )}

        <p className={p.note}>
          Assigning a preset changes what future plans carry. A plan freezes its
          rule set when it is created, so work already planned keeps the
          configuration it was planned under — the same reason a session holds a
          snapshot of its plan rather than a reference to it.
        </p>
      </section>
    </AppShell>
  );
}
