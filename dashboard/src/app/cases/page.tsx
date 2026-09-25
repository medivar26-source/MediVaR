import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { FolderOpen, Play } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import { Badge, Button, Card, Chip, EmptyState, Skeleton } from "@/components/ui";
import { listCases, type AttemptedFilter } from "@/lib/data/cases";
import { titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";
import { CaseFilters } from "./CaseFilters";
import s from "./cases.module.css";

export const metadata: Metadata = { title: "Cases" };

const ATTEMPTED: AttemptedFilter[] = ["all", "attempted", "unattempted"];

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    pathology?: string;
    side?: string;
    difficulty?: string;
    attempted?: string;
  }>;
}) {
  const filters = await searchParams;
  const user = await getCurrentUser();

  const attempted = ATTEMPTED.includes(filters.attempted as AttemptedFilter)
    ? (filters.attempted as AttemptedFilter)
    : "all";

  const { cases, facets, total } = await listCases(user.id, {
    q: filters.q,
    pathology: filters.pathology,
    side: filters.side,
    difficulty: filters.difficulty,
    attempted,
  });

  return (
    <AppShell user={user} searchHint='Try searching "varus"'>
      <PageHeader
        title="Cases"
        lede="Every case is synthetic. No patient data is stored anywhere in the product."
        actions={
          <Button variant="primary" icon={Play} href="/setup">
            Start simulation
          </Button>
        }
      />

      <Suspense fallback={<Skeleton height="180px" block />}>
        <CaseFilters facets={facets} matched={cases.length} total={total} />
      </Suspense>

      {cases.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No cases match these filters"
          action={
            <Button variant="secondary" href="/cases">
              Clear filters
            </Button>
          }
        >
          {total} cases are published. Widen a filter, or clear them all to see
          the whole catalogue.
        </EmptyState>
      ) : (
        <ul className={s.grid}>
          {cases.map((item) => {
            const passMark = PASS_MARK[item.difficulty];
            return (
              <li key={item.id}>
                <Card padding="none" className={s.card}>
                  <Link href={`/cases/${item.id}`} className={s.cardLink}>
                    {/* Radiographs are not authored yet. A neutral plate is
                        honest; a stock photograph standing in for a patient's
                        imaging is not. */}
                    <span className={s.thumb} aria-hidden="true">
                      <FolderOpen width={22} height={22} strokeWidth={1.5} />
                    </span>

                    <span className={s.cardBody}>
                      <span className={s.cardHead}>
                        <span className={s.cardTitle}>{item.title}</span>
                        {item.bestScore !== undefined ? (
                          <Badge
                            status={item.bestScore >= passMark ? "pass" : "warn"}
                          >
                            {item.bestScore}
                          </Badge>
                        ) : (
                          <Badge status="neutral">Not attempted</Badge>
                        )}
                      </span>

                      <span className={s.cardChips}>
                        <Chip tone="muted">{item.pathologyLabel}</Chip>
                        <Chip tone="muted">{titleCase(item.side)}</Chip>
                        <Chip tone="muted">{titleCase(item.difficulty)}</Chip>
                      </span>

                      {item.summary && (
                        <span className={s.cardSummary}>{item.summary}</span>
                      )}

                      <span className={s.cardFoot}>
                        {item.attempts > 0
                          ? `${item.attempts} attempt${item.attempts === 1 ? "" : "s"} · best ${item.bestScore ?? "—"}`
                          : "Not yet attempted"}
                        <span className={s.cardCta}>Start planning →</span>
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
