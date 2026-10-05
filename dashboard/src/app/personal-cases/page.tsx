import type { Metadata } from "next";
import Link from "next/link";
import { FolderOpen, Plus } from "lucide-react";
import { AppShell, Breadcrumbs, PageHeader } from "@/components/shell";
import { Button, Card, Chip, EmptyState } from "@/components/ui";
import { listPersonalCases } from "@/lib/data/personal-cases";
import { titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import s from "../cases/cases.module.css";

export const metadata: Metadata = { title: "My Cases" };

export default async function PersonalCasesPage() {
  const user = await getCurrentUser();
  const cases = await listPersonalCases();

  return (
    <AppShell user={user}>
      <Breadcrumbs
        items={[
          { label: "Content Library", href: "/content?tab=procedures" },
          { label: "My Cases" },
        ]}
      />

      <PageHeader
        title="My Cases"
        lede="Your private collection of cases. Only you can see these cases. They will not appear in the institution's Case Library."
        actions={
          <Button variant="primary" icon={Plus} href="/personal-cases/new">
            Add Case
          </Button>
        }
      />

      {cases.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="You haven't created any cases yet"
          action={
            <Button variant="secondary" href="/personal-cases/new">
              Add your first case
            </Button>
          }
        >
          Create private cases to practice planning on your own imaging.
        </EmptyState>
      ) : (
        <ul className={s.grid}>
          {cases.map((item) => {
            return (
              <li key={item.id}>
                <Card padding="none" className={s.card}>
                  <Link href={`/personal-cases/${item.id}`} className={s.cardLink}>
                    <span className={s.thumb} aria-hidden="true">
                      <FolderOpen width={22} height={22} strokeWidth={1.5} />
                    </span>

                    <span className={s.cardBody}>
                      <span className={s.cardHead}>
                        <span className={s.cardTitle}>{item.title}</span>
                      </span>

                      <span className={s.cardChips}>
                        {item.pathology_label && <Chip tone="muted">{item.pathology_label}</Chip>}
                        {item.side && <Chip tone="muted">{titleCase(item.side)}</Chip>}
                        <Chip tone="muted">{titleCase(item.difficulty)}</Chip>
                      </span>

                      {item.description && (
                        <span className={s.cardSummary}>{item.description}</span>
                      )}

                      <span className={s.cardFoot}>
                        <span className={s.cardCta}>
                          Prepare & Start →
                        </span>
                      </span>
                    </span>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
