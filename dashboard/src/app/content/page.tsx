import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Button } from "@/components/ui";
import { cx } from "@/lib/cx";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { AssessmentCriteriaSection } from "./AssessmentCriteriaSection";
import { CasesSection } from "./CasesSection";
import { ProceduresSection } from "./ProceduresSection";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Content / Case Library" };

const TABS = [
  { id: "cases", label: "Cases" },
  { id: "procedures", label: "Procedures" },
  { id: "criteria", label: "Assessment criteria" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * The instructor authoring surface for what learners train against — not
 * the learner-facing catalogue at `/cases`, and not the TKR pre-operative
 * planner at `/plan/[id]`. This page manages content; those two consume it.
 *
 * Gated the same way `/cohorts/program/[id]` is: nav already hides the
 * entry point from a learner persona, and this redirect is the actual
 * boundary — a hidden link is convenience, not security.
 */
export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    difficulty?: string;
    procedureId?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const persona = personaFor(user.role);

  if (persona === "learner") redirect("/");

  const tab: TabId = TABS.some((t) => t.id === params.tab)
    ? (params.tab as TabId)
    : "cases";

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        title="Content / Case Library"
        lede="Author and manage the cases, procedures and assessment criteria your residents train against."
        actions={
          tab === "cases" ? (
            <Button variant="primary" icon={FolderPlus} href="/content#new-case">
              Create case
            </Button>
          ) : undefined
        }
      />

      <nav className={p.tabs} aria-label="Content sections">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={t.id === "cases" ? "/content" : `/content?tab=${t.id}`}
            className={cx(p.tab, tab === t.id && p.tabOn)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "cases" && <CasesSection searchParams={params} />}
      {tab === "procedures" && <ProceduresSection />}
      {tab === "criteria" && <AssessmentCriteriaSection />}
    </AppShell>
  );
}
