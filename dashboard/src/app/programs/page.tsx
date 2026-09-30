import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, GraduationCap, Users } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Button, Chip, EmptyState } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getCohorts } from "@/lib/data/cohorts";
import { getPrograms } from "@/lib/data/programs";
import { cx } from "@/lib/cx";
import { shortDate } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { NewProgram } from "@/app/cohorts/NewProgram";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Programs" };

/**
 * Unified Programs Listing.
 *
 * For Learners:
 *   Displays enrolled training programs with associated cohort name
 *   presented strictly as secondary contextual metadata (never as a selector or switcher).
 *
 * For Instructors:
 *   Serves as the main academic/training structure for institutional programs,
 *   enabling workspace access and program creation.
 */
export default async function ProgramsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: rawTab } = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);
  const isInstructor = persona === "instructor" || persona === "admin";

  const programs = await getPrograms();

  if (isInstructor) {
    const tab = rawTab === "cohorts" ? "cohorts" : "programs";
    const cohorts = tab === "cohorts" ? await getCohorts() : [];
    const programName = new Map(programs.map((prog) => [prog.id, prog.name]));

    return (
      <AppShell user={user} searchHint='Try searching "programs"'>
        <PageHeader
          title="Programs"
          lede="Manage your academic training programs and the cohorts within them."
        />

        <nav className={p.tabs} aria-label="Programs sections">
          <Link
            href="/programs"
            className={cx(p.tab, tab === "programs" && p.tabOn)}
            aria-current={tab === "programs" ? "page" : undefined}
          >
            Programs
          </Link>
          <Link
            href="/programs?tab=cohorts"
            className={cx(p.tab, tab === "cohorts" && p.tabOn)}
            aria-current={tab === "cohorts" ? "page" : undefined}
          >
            All cohorts
          </Link>
        </nav>

        {tab === "cohorts" ? (
          cohorts.length === 0 ? (
            <EmptyState icon={Users} title="No cohorts yet"
            action={<Button variant="secondary" href="/programs">Open a program</Button>}>
              Open a program and create a cohort under it, then add learners.
            </EmptyState>
          ) : (
            <div className={p.cards}>
              {cohorts.map((c) => (
                <Link
                  key={c.id}
                  href={`/programs/${c.program_id}/cohorts/${c.id}`}
                  className={p.card}
                >
                  <div className={p.panelHead}>
                    <p className={p.cardTitle}>{c.name}</p>
                  </div>
                  <p className={p.cardBody}>
                    {programName.get(c.program_id) ?? "Program"}
                  </p>
                  <p className={p.cardMeta}>
                    {c.learners} learner{c.learners === 1 ? "" : "s"}
                    {c.meanScore !== undefined ? ` · mean ${c.meanScore}` : ""}
                    {c.belowPass > 0 ? ` · ${c.belowPass} below pass` : ""}
                  </p>
                  <div className={p.cardFoot}>
                    <span className={p.cardOpen}>
                      Open Cohort
                      <ChevronRight className={p.cardChevron} strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          <>

        {programs.length === 0 ? (
          <EmptyState icon={GraduationCap} title="No programs yet">
            Create a program first, then you can create cohorts under it and add learners.
          </EmptyState>
        ) : (
          <>
            <StatRow>
              <StatCard
                label="Programs"
                value={String(programs.length)}
                variant="dark"
              />
            </StatRow>

            <div className={p.cards}>
              {programs.map((prog) => (
                <Link
                  key={prog.id}
                  href={`/programs/${prog.id}`}
                  className={p.card}
                >
                  <div className={p.panelHead}>
                    <p className={p.cardTitle}>{prog.name}</p>
                  </div>
                  <p className={p.cardBody}>
                    {prog.description || "No description provided."}
                  </p>
                  <p className={p.cardMeta}>
                    Created {shortDate(prog.created_at)}
                  </p>
                  <div className={p.cardFoot}>
                    <Chip tone="muted">
                      {prog.status === "active" ? "Active" : "Archived"}
                    </Chip>
                    <span className={p.cardOpen}>
                      Open Program
                      <ChevronRight className={p.cardChevron} strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
          </>
        )}

        {tab === "programs" && (
          <>
        <SectionHeader title="Add a program" />
        <section className={p.panel} aria-label="Add a program">
          <div>
            <p className={p.panelTitle}>New Program</p>
            <p className={p.panelSub}>
              A program acts as the top-level container for your cohorts (e.g. &ldquo;Orthopaedics Residency&rdquo;).
            </p>
          </div>
          <NewProgram />
        </section>
          </>
        )}
      </AppShell>
    );
  }

  // Learner view
  return (
    <AppShell user={user} searchHint='Try searching "programs"'>
      <PageHeader
        eyebrow="Curriculum & Pathways"
        title="Your Programs"
        lede="Training programs you are actively enrolled in. Track your curriculum, practice cases, and clinical progress."
      />

      {programs.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No programs enrolled yet">
          You are not currently enrolled in any training programs. An instructor or administrator will assign you to a program cohort.
        </EmptyState>
      ) : (
        <>
          <StatRow>
            <StatCard
              label="Enrolled programs"
              value={String(programs.length)}
              variant="dark"
            />
          </StatRow>

          <div className={p.cards}>
            {programs.map((prog) => (
              <Link
                key={prog.id}
                href={`/programs/${prog.id}`}
                className={p.card}
              >
                <div className={p.panelHead}>
                  <p className={p.cardTitle}>{prog.name}</p>
                </div>

                <p className={p.cardBody}>
                  {prog.description || "Primary TKA training and simulation pathway."}
                </p>

                {prog.cohort_name && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginTop: "var(--s-1)",
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
                    <Chip tone="muted">{prog.cohort_name}</Chip>
                  </div>
                )}

                <div className={p.cardFoot}>
                  <Chip tone="muted">
                    {prog.status === "active" ? "Active" : "Archived"}
                  </Chip>
                  <span className={p.cardOpen}>
                    Open program
                    <ChevronRight className={p.cardChevron} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </AppShell>
  );
}
