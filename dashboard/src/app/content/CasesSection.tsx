import Link from "next/link";
import { Suspense } from "react";
import { FolderOpen } from "lucide-react";
import { SectionHeader } from "@/components/shell";
import {
  Badge,
  Banner,
  Button,
  Chip,
  EmptyState,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { listCasesForAuthoring, listProcedureOptions } from "@/lib/data/content";
import { ContentApiError } from "@/lib/data/content-api";
import { titleCase } from "@/lib/format";
import { ContentCaseFilters } from "./ContentCaseFilters";
import { NewCaseForm } from "./NewCaseForm";
import s from "./content.module.css";

export async function CasesSection({
  searchParams,
}: {
  searchParams: {
    q?: string;
    difficulty?: string;
    procedureId?: string;
    status?: string;
  };
}) {
  let browse: Awaited<ReturnType<typeof listCasesForAuthoring>>;
  let procedures: Awaited<ReturnType<typeof listProcedureOptions>>;
  try {
    [browse, procedures] = await Promise.all([
      listCasesForAuthoring({
        q: searchParams.q,
        difficulty: searchParams.difficulty,
        procedureId: searchParams.procedureId,
        status: searchParams.status,
      }),
      listProcedureOptions(),
    ]);
  } catch (err) {
    if (err instanceof ContentApiError) {
      return (
        <Banner tone="fail" title="The case library couldn't be loaded">
          {err.message}
        </Banner>
      );
    }
    throw err;
  }

  const { cases, facets, total } = browse;

  return (
    <>
      <Suspense fallback={<Skeleton height="180px" block />}>
        <ContentCaseFilters facets={facets} matched={cases.length} total={total} />
      </Suspense>

      {total === 0 ? (
        <EmptyState icon={FolderOpen} title="No cases have been authored yet">
          Create the first one below. Residents only see a case once it is
          active.
        </EmptyState>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No cases match these filters"
          action={
            <Button variant="secondary" href="/content">
              Clear filters
            </Button>
          }
        >
          {total} case{total === 1 ? "" : "s"} authored. Widen a filter, or
          clear them all to see the whole catalogue.
        </EmptyState>
      ) : (
        <Table label="Case catalogue">
          <THead>
            <Tr>
              <Th>Case</Th>
              <Th>Procedure</Th>
              <Th>Difficulty</Th>
              <Th>Learning objective</Th>
              <Th>Status</Th>
              <Th numeric>Version</Th>
              <Th>Used by</Th>
              <Th>
                <span className="srOnly">Actions</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {cases.map((item) => (
              <Tr key={item.id}>
                <Td head>
                  <span className={s.title}>
                    <Link href={`/content/${item.id}`}>{item.title}</Link>
                    {item.isSynthetic && (
                      <span className={s.titleId}>
                        <span className={s.demoBadge}>
                          <Badge status="neutral" hideIcon>
                            DEMO / SYNTHETIC
                          </Badge>
                        </span>
                      </span>
                    )}
                  </span>
                </Td>
                <Td>{item.procedureName}</Td>
                <Td>
                  <Chip tone="muted">{titleCase(item.difficulty)}</Chip>
                </Td>
                <Td>
                  <span className={s.objective}>
                    {item.learningObjective ?? "—"}
                  </span>
                </Td>
                <Td>
                  <Badge status={item.status === "active" ? "pass" : "neutral"}>
                    {item.status === "active" ? "Active" : "Inactive"}
                  </Badge>
                </Td>
                <Td numeric>v{item.version}</Td>
                <Td>
                  {item.usedBySessions === undefined ? (
                    <span className={s.usageSub}>Not tracked yet</span>
                  ) : item.usedBySessions === 0 ? (
                    <span className={s.usageSub}>Not yet used</span>
                  ) : (
                    <span className={s.usage}>
                      <span className={s.usageMain}>
                        {item.usedByLearners} learner
                        {item.usedByLearners === 1 ? "" : "s"}
                      </span>
                      <span className={s.usageSub}>
                        {item.usedBySessions} session
                        {item.usedBySessions === 1 ? "" : "s"}
                      </span>
                    </span>
                  )}
                </Td>
                <Td>
                  <span className={s.actionsCell}>
                    <Button variant="ghost" size="sm" href={`/content/${item.id}`}>
                      Open
                    </Button>
                  </span>
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <SectionHeader title="Create a case" />
      <section id="new-case" aria-label="Create a case">
        <NewCaseForm procedures={procedures} />
      </section>
    </>
  );
}
