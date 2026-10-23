import Link from "next/link";
import { ClipboardList, Play } from "lucide-react";
import { SessionActions } from "@/components/sessions/SessionActions";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Chip,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { StartPlanning } from "@/app/cases/[id]/StartPlanning";
import { NOT_RECORDED, casePlanBlocker, sideText } from "@/lib/case-meta";
import type { PlanRow } from "@/lib/data/plans";
import { isSampleSession } from "@/lib/data/session-links";
import { clock, shortDate, titleCase } from "@/lib/format";
import { PLAN_STATES } from "@/lib/plan";
import type { SessionSummary } from "@/lib/types";
import s from "./plans.module.css";

/** One case in the planning list: what the rail shows and what the panel needs to describe it. */
export type PlanningCase = {
  id: string;
  title: string;
  summary?: string;
  pathologyLabel?: string;
  side?: string;
  difficulty: string;
  procedureId?: string;
  procedureName?: string;
  /** The learner's own case, which lives under My Cases rather than the Case Library. */
  personal: boolean;
};

/**
 * The selected case, compactly: what it is, the learner's plans on it, and its sessions and
 * reports. Everything shown is read from the same lists the Case Library, Sessions and Reports
 * use, so the numbers here cannot differ from theirs.
 */
export function CasePlansPanel({
  kase,
  plans,
  sessions,
}: {
  kase: PlanningCase;
  plans: PlanRow[];
  sessions: SessionSummary[];
}) {
  const draft = plans.find((plan) => plan.state === "draft");
  const caseHref = kase.personal ? `/personal-cases/${kase.id}` : `/cases/${kase.id}`;
  const attempts = sessions.filter(
    (session) => session.status === "completed" || session.status === "live" || session.status === "aborted",
  ).length;

  return (
    <div className={s.detail}>
      <div className={s.caseHead}>
        <div>
          <h2 className={s.caseTitle}>{kase.title}</h2>
          {kase.summary && <p className={s.caseSummary}>{kase.summary}</p>}
        </div>
        <div className={s.caseActions}>
          <Button variant="ghost" href={caseHref}>
            Open case
          </Button>
          <StartPlanning
            caseId={kase.id}
            config={{}}
            plan={draft ? { id: draft.id, state: draft.state } : undefined}
            hasPlans={plans.length > 0}
            blocker={casePlanBlocker(kase, { personal: kase.personal })}
          />
        </div>
      </div>

      <dl className={s.meta}>
        <div>
          <dt>Pathology</dt>
          <dd>{kase.pathologyLabel?.trim() || NOT_RECORDED}</dd>
        </div>
        <div>
          <dt>Side</dt>
          <dd>{sideText({ side: kase.side })}</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>{titleCase(kase.difficulty)}</dd>
        </div>
        <div>
          <dt>Plans</dt>
          <dd>{plans.length}</dd>
        </div>
        <div>
          <dt>Attempts</dt>
          <dd>{attempts}</dd>
        </div>
      </dl>

      <Card padding="none">
        <CardHeader
          flush
          title="Plans"
          subtitle={
            plans.length === 0
              ? "You can plan this case more than once and compare your attempts."
              : `${plans.length} plan${plans.length === 1 ? "" : "s"} on this case`
          }
        />
        {plans.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No plans yet">
            Start planning to measure the radiographs and choose your implants.
          </EmptyState>
        ) : (
          <Table label={`Plans for ${kase.title}`}>
            <THead>
              <Tr>
                <Th>Started</Th>
                <Th>Updated</Th>
                <Th>Progress</Th>
                <Th>State</Th>
                <Th>
                  <span className="srOnly">Open</span>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {plans.map((plan) => (
                <Tr key={plan.id}>
                  <Td head>{shortDate(plan.createdAt)}</Td>
                  <Td>{shortDate(plan.updatedAt)}</Td>
                  <Td>
                    {plan.stepsAnswered} of {plan.stepsTotal} steps
                  </Td>
                  <Td>
                    <Badge status={plan.state === "draft" ? "neutral" : plan.state === "performed" ? "pass" : "active"}>
                      {PLAN_STATES.find((st) => st.value === plan.state)?.label ?? titleCase(plan.state)}
                    </Badge>
                  </Td>
                  <Td>
                    <Link prefetch={false}
                      href={
                        plan.state === "draft"
                          ? `/plan/${plan.id}/assessment`
                          : plan.state === "performed" && plan.sessionId
                            ? `/sessions/${plan.sessionId}`
                            : `/plan/${plan.id}/review`
                      }
                    >
                      {plan.state === "draft" ? "Continue" : plan.state === "performed" ? "Session" : "View"}
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Card padding="none">
        <CardHeader
          flush
          title="Sessions & reports"
          subtitle={
            sessions.length === 0
              ? undefined
              : `${sessions.length} session${sessions.length === 1 ? "" : "s"} · ${attempts} attempt${attempts === 1 ? "" : "s"}`
          }
          action={
            sessions.length > 0 ? (
              <Button variant="ghost" size="sm" href={`/sessions?case=${encodeURIComponent(kase.id)}`}>
                All sessions
              </Button>
            ) : undefined
          }
        />
        {sessions.length === 0 ? (
          <EmptyState icon={Play} title="No sessions on this case yet">
            Plan it on the desktop, then perform it in the headset. The report compares the two.
          </EmptyState>
        ) : (
          <Table label={`Sessions on ${kase.title}`}>
            <THead>
              <Tr>
                <Th>Date</Th>
                <Th>Mode</Th>
                <Th numeric>Duration</Th>
                <Th numeric>Score</Th>
                <Th>Status</Th>
                <Th>
                  <span className="srOnly">Open</span>
                </Th>
              </Tr>
            </THead>
            <TBody>
              {sessions.map((session) => (
                <Tr key={session.id}>
                  <Td head>
                    {shortDate(session.scheduledAt ?? session.endedAt ?? session.startedAt)}
                    {isSampleSession(session.id) && (
                      <>
                        {" "}
                        <Chip tone="muted">Sample</Chip>
                      </>
                    )}
                  </Td>
                  <Td>{titleCase(session.mode)}</Td>
                  <Td numeric>
                    {session.durationS ? clock(session.durationS) : session.duration ? `${session.duration}m` : "—"}
                  </Td>
                  <Td numeric>{session.totalScore ?? "—"}</Td>
                  <Td>
                    {session.status === "scheduled" ? (
                      <Badge status="warn">Upcoming</Badge>
                    ) : session.status === "live" ? (
                      <Badge status="active">In progress</Badge>
                    ) : session.status === "cancelled" ? (
                      <Chip tone="muted">Cancelled</Chip>
                    ) : session.status === "aborted" ? (
                      <Chip tone="muted">Interrupted</Chip>
                    ) : session.totalScore === undefined ? (
                      <Chip tone="muted">No report</Chip>
                    ) : (
                      <Badge status="pass">Scored</Badge>
                    )}
                  </Td>
                  <Td>
                    <SessionActions session={{ ...session, caseId: undefined }} />
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

