import Link from "next/link";
import { Suspense } from "react";
import { FolderOpen } from "lucide-react";
import { SectionHeader } from "@/components/shell";
import {
  Badge,
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
import { listCasesForAuthoring, listProceduresForAuthoring } from "@/lib/data/content";
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
  const [{ cases, facets, total }, procedures] = await Promise.all([
    listCasesForAuthoring({
      q: searchParams.q,
      difficulty: searchParams.difficulty,
      procedureId: searchParams.procedureId,
      status: searchParams.status,
    }),
    listProceduresForAuthoring(),
  ]);

  return (
    <>
      <Suspense fallback={<Skeleton height="180px" block />}>
        <ContentCaseFilters facets={facets} matched={cases.length} total={total} />
      </Suspense>

      {cases.length === 0 ? (
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
                    <span className={s.titleId}>
                      {item.id}
                      {item.isSynthetic && (
                        <>
                          {" · "}
                          <span className={s.demoBadge}>
                            <Badge status="neutral" hideIcon>
                              DEMO / SYNTHETIC
                            </Badge>
                          </span>
                        </>
                      )}
                    </span>
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
                  {item.usedBySessions === 0 ? (
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
