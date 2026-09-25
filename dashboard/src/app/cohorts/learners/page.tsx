import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getSupervisedLearners } from "@/lib/data/cohorts";
import { relativeTime } from "@/lib/format";
import { personaFor, ROLE_LABEL } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import p from "../../panels.module.css";

export const metadata: Metadata = { title: "Learners" };

/**
 * Every learner the viewer supervises, flattened across their cohorts.
 *
 * Not a redirect to `/cohorts`: an instructor with two cohorts wants one
 * attention list, not two, and the ordering — below the pass mark first, then
 * never-active — is the whole point of the screen. With one cohort it is the
 * same rows in a different order, which is still a different question.
 */
export default async function LearnersPage() {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const learners = await getSupervisedLearners();
  const now = new Date().toISOString();
  const scored = learners.filter((l) => l.meanScore !== undefined);

  return (
    <AppShell user={user} searchHint='Try searching "learners"'>
      <PageHeader
        title="Learners"
        lede="Everybody in the cohorts you teach, ordered by who needs you: below the pass mark first, then anybody who has never started a session."
        actions={
          <Button href="/cohorts" variant="secondary">
            By cohort
          </Button>
        }
      />

      {learners.length === 0 ? (
        <EmptyState icon={Users} title="No learners">
          Your cohorts have no members yet. An administrator assigns a learner to
          a cohort from the account management screen.
        </EmptyState>
      ) : (
        <>
          <StatRow>
            <StatCard label="Learners" value={String(learners.length)} variant="dark" />
            <StatCard
              label="Below pass"
              value={String(
                scored.filter((l) => (l.meanScore as number) < 70).length,
              )}
              variant="accent"
            />
            <StatCard
              label="Never started"
              value={String(learners.filter((l) => l.sessions === 0).length)}
            />
            <StatCard
              label="Scored"
              value={`${scored.length} of ${learners.length}`}
              sub="have a completed report"
            />
          </StatRow>

          <Table label="Supervised learners">
            <THead>
              <Tr>
                <Th>Learner</Th>
                <Th>Program / cohort</Th>
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
                  <Td head>
                    <Link href={`/cohorts/learners/${learner.id}`}>{learner.displayName}</Link>
                  </Td>
                  <Td>
                    {learner.cohorts.map((c) => (
                      <div key={c.id}>
                        {c.programName ? `${c.programName} — ${c.name}` : c.name}
                      </div>
                    ))}
                  </Td>
                  <Td>{ROLE_LABEL[learner.role]}</Td>
                  <Td numeric>{learner.sessions}</Td>
                  <Td numeric>{learner.assessments}</Td>
                  <Td numeric>
                    {learner.meanScore !== undefined ? (
                      <Badge status={learner.meanScore >= 70 ? "pass" : "fail"}>
                        {learner.meanScore}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Td>
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

          <p className={p.note}>
            The mean is compared against 70 — the intermediate pass mark —
            because a single figure per learner covers sessions at several
            difficulties. A learner&rsquo;s own reports state the mark that
            applied to each one.
          </p>
        </>
      )}
    </AppShell>
  );
}
