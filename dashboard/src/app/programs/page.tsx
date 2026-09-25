import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, GraduationCap } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Chip, EmptyState } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getPrograms } from "@/lib/data/programs";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Your Programs" };

/**
 * Learner-facing Program Listing.
 *
 * Programs are the primary navigation unit for learners.
 * The learner's enrolled programs are rendered with associated cohort name
 * presented strictly as secondary contextual metadata (never as a selector or switcher).
 */
export default async function LearnerProgramsPage() {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  // Instructors use the administrative programs & cohorts management route
  if (persona === "instructor" || persona === "admin") {
    redirect("/cohorts");
  }

  const programs = await getPrograms();

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
