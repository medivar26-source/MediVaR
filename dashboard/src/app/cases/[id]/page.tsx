import { ScanPreview } from "@/components/cases/ScanPreview";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClipboardList, ImageOff, ListChecks, Play } from "lucide-react";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
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
import { StatCard, StatRow } from "@/components/viz";
import { getCase, getCaseTitle, getInstructorConfigs } from "@/lib/data/cases";
import { getPrograms } from "@/lib/data/programs";
import { clock, longDuration, shortDate, titleCase } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import { PLAN_STATES } from "@/lib/plan";
import { CASE_TABS, InstructorCaseView, type CaseTab } from "./_instructor/InstructorCaseView";
import { getPlans } from "@/lib/data/plans";
import { StartPlanning } from "./StartPlanning";
import s from "./case.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = await getCaseTitle(id);
  return { title: title ?? id.replace(/_/g, " ") };
}

/**
 * The case page answers one question: *should I take this case, and what do I
 * need to know before I plan it?*
 *
 * So it opens with the four figures that decide it — best score, pass mark,
 * attempts, time — in the same stat row the dashboards use, then splits into
 * the patient the surgeon is about to operate on (wide) and the material the
 * case ships with (narrow). The case ID is in the eyebrow because that is how
 * people refer to a case to each other, and it is what the search box matches.
 */
export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  // `/setup` carries the session configuration here in the URL rather than
  // writing an orphaned draft. It is read back onto the plan at creation.
  const config = await searchParams;
  const user = await getCurrentUser();
  const detail = await getCase(id, user.id);

  if (!detail) notFound();

  const persona = personaFor(user.role);
  const canConfigure = persona === "instructor" || persona === "admin";
  const presets = canConfigure ? await getInstructorConfigs(detail.id) : [];

  // Instructors get the authoring view: Details, Imaging and Planning. The rest of this page is
  // the learner's: their own scores, attempts and the plans they start.
  if (canConfigure) {
    const tab: CaseTab = CASE_TABS.find((t) => t.value === config.tab)?.value ?? "details";
    return <InstructorCaseView user={user} detail={detail} presets={presets} tab={tab} />;
  }
  const programs = persona === "learner" ? await getPrograms().catch(() => []) : [];

  // A learner can keep several plans for one case. Newest first.
  const myPlans = (await getPlans(undefined, user.id)).plans
    .filter((row) => row.caseId === detail.id)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const draftPlan = myPlans.find((row) => row.state === "draft");

  const passMark = PASS_MARK[detail.difficulty];
  const attempts = detail.attempts.length;

  /**
   * Bars are scaled against the largest category, not against a total. The six
   * maxima sum to 95 while every score in the product is presented out of 100
   * — an open discrepancy, recorded but not yet settled. Until it
   * is ruled on, this panel shows what each category is worth and asserts no
   * total, because the total it would assert is the one nobody has agreed.
   */
  const largestCategory = Math.max(...detail.scoring.map((c) => c.max), 1);

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <Breadcrumbs
        items={[
          { label: "Cases", href: "/cases" },
          { label: detail.title },
        ]}
      />
      <PageHeader
        eyebrow={`${detail.procedureName} · ${detail.id}`}
        title={detail.title}
        lede={detail.summary}
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <StartPlanning
              caseId={detail.id}
              config={config}
              plan={draftPlan ? { id: draftPlan.id, state: draftPlan.state } : undefined}
              hasPlans={myPlans.length > 0}
            />
          </div>
        }
      />

      <div className={s.chips}>
        <Chip tone="muted">{detail.pathologyLabel}</Chip>
        <Chip tone="muted">{titleCase(detail.side)} knee</Chip>
        <Chip tone="muted">{titleCase(detail.difficulty)}</Chip>
        {detail.status && (
          <Chip tone={detail.status === "active" ? "muted" : "default"}>
            {detail.status === "active" ? `v${detail.version ?? 1} Published` : detail.status.toUpperCase()}
          </Chip>
        )}

        {programs.length > 0 && programs[0].cohort_name && (
          <Chip tone="muted">Cohort: {programs[0].cohort_name}</Chip>
        )}
        <span className={s.caseId}>{detail.id}</span>
      </div>



      {/* Where this viewer stands on this case. Every figure is derived from
          their own sessions, and only ever their own.

          All four carry the outlined variant. The dashboards' one-dark-one-
          accent rule is there to pick a focal tile out of a
          screen full of competing panels; here the row *is* the focal element
          and no one of the four outranks the others, so a black tile only
          bullied the other three. Recorded in */}
      <div className={s.readiness}>
        <StatRow>
          <StatCard
            label="Your best score"
            value={detail.bestScore ?? "—"}
            variant="accent"
            sub={
              detail.bestScore === undefined
                ? "Not attempted yet"
                : detail.bestScore >= passMark
                  ? "Above the pass mark"
                  : `${passMark - detail.bestScore} below the pass mark`
            }
          />
          <StatCard
            label="Pass mark"
            value={passMark}
            variant="accent"
            sub={`${titleCase(detail.difficulty)} difficulty`}
          />
          <StatCard
            label="Attempts"
            value={attempts}
            variant="accent"
            sub={attempts === 0 ? "No sessions yet" : `${detail.passed} passed`}
          />
          <StatCard
            label="Time on this case"
            value={detail.timeSpentS > 0 ? longDuration(detail.timeSpentS) : "—"}
            variant="accent"
            sub={
              attempts === 0
                ? "Your sessions"
                : `Across ${attempts} session${attempts === 1 ? "" : "s"}`
            }
          />
        </StatRow>
      </div>

      <div className={s.layout}>
        <div className={s.col}>
          <Card padding="lg">
            <CardHeader
              title="Patient snapshot"
              subtitle="Synthetic patient. No identifiable data is stored anywhere in the product."
            />

            {detail.patient.vitals.length > 0 && (
              <dl className={s.vitals}>
                {detail.patient.vitals.map((field) => (
                  <div key={field.label} className={s.vital}>
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {detail.patient.notes.length > 0 && (
              <dl className={s.notes}>
                {detail.patient.notes.map((field) => (
                  <div key={field.label} className={s.note}>
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card padding="none">
            <CardHeader
              flush
              title="Your plans"
              subtitle={
                myPlans.length === 0
                  ? "You can plan this case more than once and compare your attempts."
                  : `${myPlans.length} plan${myPlans.length === 1 ? "" : "s"} on this case`
              }
              action={
                draftPlan ? (
                  <StartPlanning caseId={detail.id} config={config} startFresh variant="secondary" />
                ) : undefined
              }
            />
            {myPlans.length === 0 ? (
              <div className={s.emptyWrap}>
                <EmptyState icon={ClipboardList} title="No plans yet">
                  Start planning to measure the radiographs and choose your implants.
                </EmptyState>
              </div>
            ) : (
              <Table label={`Your plans for ${detail.title}`}>
                <THead>
                  <Tr>
                    <Th>Started</Th>
                    <Th>Last updated</Th>
                    <Th>Progress</Th>
                    <Th>State</Th>
                    <Th>
                      <span className="srOnly">Open</span>
                    </Th>
                  </Tr>
                </THead>
                <TBody>
                  {myPlans.map((plan) => (
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
                        <Link
                          href={
                            plan.state === "draft"
                              ? `/plan/${plan.id}/assessment`
                              : plan.state === "performed" && plan.sessionId
                                ? `/sessions/${plan.sessionId}/report`
                                : `/plan/${plan.id}/review`
                          }
                        >
                          {plan.state === "draft" ? "Continue" : plan.state === "performed" ? "Report" : "View"}
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
              title="Attempt history"
              subtitle={
                attempts === 0
                  ? undefined
                  : `${attempts} session${attempts === 1 ? "" : "s"} · ${detail.passed} above the pass mark`
              }
              action={
                attempts > 0 ? (
                  <Button variant="ghost" size="sm" href="/sessions">
                    All sessions
                  </Button>
                ) : undefined
              }
            />
            {attempts === 0 ? (
              <div className={s.emptyWrap}>
                <EmptyState
                  icon={Play}
                  title="You have not attempted this case"
                  action={<StartPlanning caseId={detail.id} config={config} hasPlans={myPlans.length > 0} plan={draftPlan ? { id: draftPlan.id, state: draftPlan.state } : undefined} />}
                >
                  Plan it on the desktop, then perform it in the headset. The
                  report compares the two.
                </EmptyState>
              </div>
            ) : (
              <Table label={`Attempts at ${detail.title}`}>
                <THead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Mode</Th>
                    <Th>Variant</Th>
                    <Th numeric>Duration</Th>
                    <Th numeric>Score</Th>
                    <Th>Status</Th>
                  </Tr>
                </THead>
                <TBody>
                  {detail.attempts.map((attempt) => {
                    const mark = PASS_MARK[attempt.difficulty];
                    const score = attempt.totalScore;
                    return (
                      <Tr key={attempt.id}>
                        <Td head>
                          {shortDate(attempt.endedAt ?? attempt.startedAt)}
                        </Td>
                        <Td>{titleCase(attempt.mode)}</Td>
                        <Td>
                          {attempt.design} · {titleCase(attempt.fixation)}
                        </Td>
                        <Td numeric>{clock(attempt.durationS)}</Td>
                        <Td numeric>{score ?? "—"}</Td>
                        <Td>
                          {attempt.status === "live" ? (
                            <Badge status="active">In progress</Badge>
                          ) : attempt.status === "aborted" ? (
                            <Badge status="warn">Interrupted</Badge>
                          ) : score === undefined ? (
                            <Badge status="neutral">No report</Badge>
                          ) : score >= mark ? (
                            <Badge status="pass">Passed</Badge>
                          ) : (
                            <Badge status="fail">Below pass mark</Badge>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </TBody>
              </Table>
            )}
          </Card>
        </div>

        <div className={s.col}>
          <Card padding="lg">
            <CardHeader
              title="Imaging package"
              action={
                <span className={s.count}>
                  {`${detail.imaging.length} view${detail.imaging.length === 1 ? "" : "s"}`}
                </span>
              }
            />
            {detail.imaging.length === 0 ? (
              <EmptyState icon={ImageOff} title="No imaging authored yet">
                This case has no radiograph manifest. Planning step 2 needs at
                least an AP and a long-leg view.
              </EmptyState>
            ) : (
              <ul className={s.views}>
                {detail.imaging.map((view) => (
                  <li key={view.view} className={s.view}>
                    {view.url ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span className={s.viewLabel}>{view.label}</span>
                          <span className={s.viewNote}>
                            {view.calibration?.is_valid ? "Calibrated (25mm)" : "Pending calibration"}
                          </span>
                        </div>
                        <ScanPreview src={view.url} alt={view.label} />
                      </div>
                    ) : (
                      <>
                        <span className={s.plate} aria-hidden="true">
                          <ImageOff width={20} height={20} strokeWidth={1.5} />
                        </span>
                        <span className={s.viewLabel}>{view.label}</span>
                        <span className={s.viewNote}>Asset pending</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>


          {detail.scoring.length > 0 && (
            <Card padding="lg">
              <CardHeader
                title="How this case is scored"
                subtitle={`${detail.scoring.length} categories, weighted as below. ${passMark} passes at ${titleCase(detail.difficulty)} difficulty.`}
              />
              <ul className={s.scoring}>
                {detail.scoring.map((category) => (
                  <li key={category.key} className={s.scoreRow}>
                    <span className={s.scoreLabel}>{category.label}</span>
                    <span className={s.scoreTrack} aria-hidden="true">
                      <span
                        className={s.scoreFill}
                        style={{
                          width: `${(category.max / largestCategory) * 100}%`,
                        }}
                      />
                    </span>
                    <span className={s.scoreMax}>{category.max}</span>
                  </li>
                ))}
              </ul>
              <p className={s.foot}>
                Three or more critical errors cap a session at 59 and mark it
                Not passed, whatever the categories say.
              </p>
            </Card>
          )}

          {detail.objectives.length > 0 && (
            <Card padding="lg">
              <CardHeader title="Learning objectives" />
              <ul className={s.objectives}>
                {detail.objectives.map((objective, idx) => (
                  <li key={`${objective}-${idx}`} className={s.objective}>
                    <ListChecks
                      className={s.objectiveIcon}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {objective}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>


    </AppShell>
  );
}
