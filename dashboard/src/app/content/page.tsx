import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { Button } from "@/components/ui";
import { cx } from "@/lib/cx";
import { personaFor } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { ProceduresSection } from "./ProceduresSection";
import p from "../panels.module.css";

export const metadata: Metadata = { title: "Content / Procedures" };

const TABS = [
  { id: "cases", label: "Cases" },
  { id: "procedures", label: "Procedures" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Procedures: the step sequences cases are built on. Read-only here, for instructors and
 * learners alike.
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

  // Procedures are readable by learners too (the Content Library is shared); only the case
  // status and imaging management at /content/[id] is instructor-only.
  // Cases are managed in one place — the Case Library at `/cases`.
  if (!params.tab || params.tab === "cases") redirect("/cases");

  const tab: TabId = TABS.some((t) => t.id === params.tab)
    ? (params.tab as TabId)
    : "procedures";

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <Breadcrumbs
        items={[
          { label: "Content Library", href: "/cases" },
          { label: "Procedures" },
        ]}
      />

      <PageHeader
        title="Procedures"
        lede="The procedures your cases are built on, and the step sequence each one follows. Open a procedure to see its steps, then go to its cases."
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
            href={t.id === "cases" ? "/cases" : `/content?tab=${t.id}`}
            className={cx(p.tab, tab === t.id && p.tabOn)}
            aria-current={tab === t.id ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "procedures" && <ProceduresSection />}
    </AppShell>
  );
}
