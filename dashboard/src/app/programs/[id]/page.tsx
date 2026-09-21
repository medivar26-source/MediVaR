import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, FolderOpen, Play } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Badge, Button, Card, Chip, EmptyState, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getProgramDetail } from "@/lib/data/programs";
import { listCases } from "@/lib/data/cases";
import { getSessionList } from "@/lib/data/sessions";
import { clock, shortDate, titleCase } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import p from "../../panels.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const program = await getProgramDetail(id).catch(() => null);
  return { title: program ? `${program.name} · Program` : "Program Details" };
}

/**
 * Learner-facing Program Detail View.
 *
 * Displays the learner's own curriculum, assigned cases, progress, and sessions
 * within the program. The associated cohort name is presented contextually in the header.
 * Instructor-only analytics and cohort administration are strictly excluded.
 */
export default async function LearnerProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  // Instructors view programs via the administrative cohort structure
  if (persona === "instructor" || persona === "admin") {
    redirect(`/cohorts/program/${id}`);
  }

  const program = await getProgramDetail(id).catch(() => null);
  if (!program) notFound();

  // Fetch the learner's cases and sessions
  const [{ cases }, { sessions, stats }] = await Promise.all([
    listCases(user.id, { attempted: "all" }),
    getSessionList({}),
  ]);

  const scoredSessions = sessions.filter((s) => s.totalScore !== undefined);
  const bestScore =
    scoredSessions.length > 0
      ? Math.max(...scoredSessions.map((s) => s.totalScore as number))
      : undefined;

  const userPassMark = PASS_MARK[user.defaultDifficulty];

  return (
    <AppShell user={user} searchHint='Try searching "cases"'>
      <div style={{ marginBottom: "var(--s-4)" }}>
        <Link
          href="/programs"
          className={p.clear}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <ChevronLeft size={16} /> Back to Programs
        </Link>
      </div>

      <PageHeader
        eyebrow="Training Program"
        title={program.name}
        lede={program.description || "Comprehensive clinical surgical simulation and procedural curriculum."}
        actions={
          <Button variant="primary" icon={Play} href="/setup">
            Start simulation
          </Button>
        }
      />

      {/* Contextual Cohort Metadata — Secondary, read-only */}
      {program.cohort_name && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "var(--s-2) var(--s-3)",
            background: "var(--surface-sunken)",
            border: "var(--bw) solid var(--border)",
            borderRadius: "var(--r-md)",
            marginBottom: "var(--s-5)",
          }}
        >
          <span
            style={{
              fontSize: "var(--t-caption)",
              color: "var(--text-muted)",
              fontWeight: "var(--fw-medium)",
            }}
          >
            Cohort:
          </span>
          <Chip tone="muted">{program.cohort_name}</Chip>
        </div>
      )}

      {/* Learner's own readiness in this program */}
      <StatRow>
        <StatCard
          label="Sessions completed"
          value={String(stats.sessions)}
          variant="dark"
        />
        <StatCard
          label="Best score"
          value={bestScore !== undefined ? String(bestScore) : "—"}
          variant="accent"
          sub={`Pass mark: ${userPassMark}`}
        />
        <StatCard
          label="Average score"
          value={stats.meanScore !== undefined ? String(stats.meanScore) : "—"}
          sub={stats.reported > 0 ? `Across ${stats.reported} attempts` : "No scored attempts"}
        />
        <StatCard
          label="Assigned cases"
          value={String(cases.length)}
          sub="Interactive simulations"
        />
      </StatRow>


      {/* Assigned Cases */}
      <SectionHeader title="Curriculum Cases" />
      {cases.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No cases assigned yet">
          There are no cases published in this program yet.
        </EmptyState>
      ) : (
        <div className={p.cards}>
          {cases.map((item) => {
            const passMark = PASS_MARK[item.difficulty];
            return (
              <Card key={item.id} padding="none" className={p.card}>
                <Link
                  href={`/cases/${item.id}`}
                  style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%", padding: "var(--s-4)" }}
                >
                  <div className={p.panelHead}>
                    <p className={p.cardTitle}>{item.title}</p>
                    {item.bestScore !== undefined ? (
                      <Badge status={item.bestScore >= passMark ? "pass" : "warn"}>
                        {item.bestScore}
                      </Badge>
                    ) : (
                      <Badge status="neutral">Not attempted</Badge>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "var(--s-2)", margin: "var(--s-2) 0", flexWrap: "wrap" }}>
                    <Chip tone="muted">{item.pathologyLabel}</Chip>
                    <Chip tone="muted">{titleCase(item.side)} knee</Chip>
                    <Chip tone="muted">{titleCase(item.difficulty)}</Chip>
                  </div>

                  {item.summary && (
                    <p className={p.cardBody} style={{ flex: 1 }}>
                      {item.summary}
                    </p>
                  )}

                  <div className={p.cardFoot} style={{ marginTop: "var(--s-3)" }}>
                    <span style={{ fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
                      {item.attempts > 0 ? `${item.attempts} attempt${item.attempts === 1 ? "" : "s"}` : "Unattempted"}
                    </span>
                    <span className={p.cardOpen}>
                      Plan case →
                    </span>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      {/* Learner's Program Session History */}
      <SectionHeader title="Your Recent Activity" />
      {sessions.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No sessions recorded yet">
          Complete a planning session and headset attempt to view your assessment records here.
        </EmptyState>
      ) : (
        <Table label="Program sessions">
          <THead>
            <Tr>
              <Th>Date</Th>
              <Th>Case</Th>
              <Th>Mode</Th>
              <Th>Difficulty</Th>
              <Th numeric>Duration</Th>
              <Th numeric>Score</Th>
              <Th>Status</Th>
              <Th>
                <span className="srOnly">Open</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {sessions.slice(0, 5).map((s) => (
              <Tr key={s.id}>
                <Td head>{shortDate(s.endedAt ?? s.startedAt)}</Td>
                <Td>{s.caseTitle}</Td>
                <Td>{titleCase(s.mode)}</Td>
                <Td>{titleCase(s.difficulty)}</Td>
                <Td numeric>{clock(s.durationS)}</Td>
                <Td numeric>{s.totalScore !== undefined ? s.totalScore : "—"}</Td>
                <Td>
                  <Badge status={s.status === "completed" ? "pass" : "warn"}>
                    {titleCase(s.status)}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    variant="ghost"
                    size="sm"
                    href={s.status === "completed" ? `/sessions/${s.id}/report` : `/sessions/${s.id}`}
                  >
                    {s.status === "completed" ? "Report" : "View"}
                  </Button>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}
