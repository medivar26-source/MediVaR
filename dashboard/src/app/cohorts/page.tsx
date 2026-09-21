import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, GraduationCap } from "lucide-react";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Chip, EmptyState } from "@/components/ui";
import { StatCard, StatRow } from "@/components/viz";
import { getPrograms } from "@/lib/data/programs";
import { NewProgram } from "./NewProgram";
import { shortDate } from "@/lib/format";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Programs & Cohorts" };

export default async function CohortsPage() {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const programs = await getPrograms();

  return (
    <AppShell user={user} searchHint='Try searching "programs"'>
      <PageHeader
        title="Training Programs"
        lede="Manage your training programs and the cohorts within them."
      />

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
                href={`/cohorts/program/${prog.id}`}
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
                    View Cohorts
                    <ChevronRight className={p.cardChevron} strokeWidth={2} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      <SectionHeader title="Add a program" />
      <section className={p.panel} aria-label="Add a program">
        <div>
          <p className={p.panelTitle}>New Program</p>
          <p className={p.panelSub}>
            A program acts as the top-level container for your cohorts (e.g. "Orthopaedics Residency").
          </p>
        </div>
        <NewProgram />
      </section>
    </AppShell>
  );
}
