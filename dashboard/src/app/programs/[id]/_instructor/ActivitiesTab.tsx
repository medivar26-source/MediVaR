import Link from "next/link";
import { Calendar, FolderOpen } from "lucide-react";
import { SectionHeader } from "@/components/shell";
import { Badge, Button, Card, Chip, EmptyState, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { getCohortSessions, type SessionSummary } from "@/lib/data/cohorts";
import type { CaseCard } from "@/lib/data/cases";
import { titleCase } from "@/lib/format";
import p from "@/app/panels.module.css";

type Cohort = { id: string; name: string };

const STANDARDS = [
  { name: "Standard pass mark", detail: "A minimum overall score of 70 on intermediate-difficulty simulations.", chip: "70" },
  { name: "Coronal alignment", detail: "Mechanical axis (mHKA) within ±3° of neutral for full competency marks.", chip: "±3.0°" },
  { name: "Resection depth", detail: "Distal femoral and proximal tibial cuts graded within ±2 mm of the plan.", chip: "±2.0 mm" },
  { name: "Critical safety violations", detail: "Three or more critical errors cap a session's score and mark it not passed.", chip: "Max 2" },
];

/**
 * What learners do in this program: the cases they work through and the sessions that have been
 * scheduled for them across every cohort. Scheduling itself happens in a cohort's workspace.
 */
export async function ActivitiesTab({
  programId,
  cohorts,
  cases,
}: {
  programId: string;
  cohorts: Cohort[];
  cases: CaseCard[];
}) {
  const perCohort = await Promise.all(cohorts.map((c) => getCohortSessions(c.id)));
  const cohortName = new Map(cohorts.map((c) => [c.id, c.name]));
  const sessions: SessionSummary[] = perCohort.flat().sort((a, b) => b.scheduledAt.localeCompare(a.scheduledAt));

  return (
    <>
      <SectionHeader
        title="Sessions"
        action={
          cohorts.length > 0 ? (
            <Button variant="secondary" size="sm" href={`/programs/${programId}/cohorts/${cohorts[0].id}?tab=sessions`} icon={Calendar}>
              Schedule a session
            </Button>
          ) : undefined
        }
      />
      {sessions.length === 0 ? (
        <EmptyState icon={Calendar} title="Nothing scheduled yet">
          {cohorts.length === 0
            ? "Create a cohort first, then schedule sessions for it."
            : "Open a cohort and schedule a training or assessment session from one of its assigned cases."}
        </EmptyState>
      ) : (
        <Table label="Sessions across this program">
          <THead>
            <Tr>
              <Th>Session</Th>
              <Th>Cohort</Th>
              <Th>Case</Th>
              <Th>Mode</Th>
              <Th>Scheduled</Th>
              <Th>Status</Th>
              <Th>Roster</Th>
              <Th>
                <span className="srOnly">Open</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {sessions.map((s) => (
              <Tr key={s.id}>
                <Td head>{s.name}</Td>
                <Td>{cohortName.get(s.cohortId) ?? "—"}</Td>
                <Td>{s.caseName ?? "—"}</Td>
                <Td>
                  <Chip tone="muted">{titleCase(s.mode)}</Chip>
                </Td>
                <Td>{new Date(s.scheduledAt).toLocaleString()}</Td>
                <Td>
                  <Badge
                    status={
                      s.status === "completed"
                        ? "pass"
                        : s.status === "cancelled" || s.status === "aborted"
                          ? "fail"
                          : s.status === "in_progress" || s.status === "live"
                            ? "active"
                            : "warn"
                    }
                  >
                    {titleCase(s.status.replace("_", " "))}
                  </Badge>
                </Td>
                <Td>
                  {s.completedCount} / {s.residentCount}
                </Td>
                <Td>
                  <Link href={`/programs/${programId}?tab=learners&cohort=${s.cohortId}&session=${s.id}`}>Performance</Link>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <SectionHeader
        title="Cases"
        action={
          <Button variant="secondary" size="sm" href="/cases">
            Case Library
          </Button>
        }
      />
      {cases.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No cases yet">
          Browse the Case Library to author or publish surgical cases for this program.
        </EmptyState>
      ) : (
        <div className={p.cards}>
          {cases.map((item) => (
            <Card key={item.id} padding="none" className={p.card}>
              <Link
                href={`/cases/${item.id}`}
                style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%", padding: "var(--s-4)" }}
              >
                <div className={p.panelHead}>
                  <p className={p.cardTitle}>{item.title}</p>
                  <Chip tone="muted">v{item.version ?? 1}</Chip>
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
                  <span style={{ fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>{item.status ?? "Published"}</span>
                  <span className={p.cardOpen}>Inspect case →</span>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}

      <SectionHeader title="Assessment standards" />
      <section className={p.panel} aria-label="Assessment standards">
        <div className={p.rows}>
          {STANDARDS.map((s) => (
            <div key={s.name} className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>{s.name}</p>
                <p className={p.rowDetail}>{s.detail}</p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">{s.chip}</Chip>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
