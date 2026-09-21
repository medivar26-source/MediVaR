import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { AppShell, PageHeader } from "@/components/shell";
import {
  Badge,
  Button,
  EmptyState,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import { getReportsList } from "@/lib/data/performance";
import { clock, shortDate, titleCase } from "@/lib/format";
import { getCurrentUser } from "@/lib/session";
import { PASS_MARK } from "@/lib/types";

import { personaFor } from "@/lib/roles";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const user = await getCurrentUser();
  const persona = personaFor(user.role);
  const reports = await getReportsList(user);

  // The scope decides whose reports are in the list; a name column only earns its
  // width when the viewer is an instructor/admin looking at multiple residents.
  const showLearner = persona !== "learner" && reports.some((r) => r.userId !== user.id);

  return (
    <AppShell user={user} searchHint='Try searching "reports"'>
      <PageHeader
        title={persona === "learner" ? "Your Assessment Reports" : "Reports"}
        lede={
          persona === "learner"
            ? "Every generated surgical case evaluation report for your completed simulation sessions. Review detailed scores, errors, and surgical accuracy."
            : "Every generated surgical case report you may read. A report exists once its session completes and the database scores it."
        }
      />

      {reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet">
          {persona === "learner"
            ? "An assessment report is generated the moment you complete a simulation session in the headset. Finish an attempt to review your evaluation here."
            : "A report is generated the moment a session completes. Finish a session and its report appears here."}
        </EmptyState>
      ) : (
        <Table label="Generated reports">
          <THead>
            <Tr>
              <Th>Date</Th>
              {showLearner && <Th>Learner</Th>}
              <Th>Case</Th>
              <Th>Mode</Th>
              <Th>Difficulty</Th>
              <Th numeric>Duration</Th>
              <Th numeric>Score</Th>
              <Th>Outcome</Th>
              <Th>
                <span className="srOnly">Open</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {reports.map((report) => {
              const passMark = PASS_MARK[report.difficulty];
              const scored = report.totalScore !== undefined;
              return (
                <Tr key={report.id}>
                  <Td head>{shortDate(report.endedAt ?? report.startedAt)}</Td>
                  {showLearner && <Td>{report.learnerName ?? "—"}</Td>}
                  <Td>{report.caseTitle}</Td>
                  <Td>{titleCase(report.mode)}</Td>
                  <Td>{titleCase(report.difficulty)}</Td>
                  <Td numeric>{clock(report.durationS)}</Td>
                  <Td numeric>{scored ? report.totalScore : "—"}</Td>
                  <Td>
                    {scored && (
                      <Badge
                        status={
                          (report.totalScore as number) >= passMark &&
                          report.criticalErrors < 3
                            ? "pass"
                            : "fail"
                        }
                      >
                        {(report.totalScore as number) >= passMark &&
                        report.criticalErrors < 3
                          ? "Passed"
                          : "Not passed"}
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <Button
                      variant="ghost"
                      size="sm"
                      href={`/sessions/${report.id}/report`}
                    >
                      Report
                    </Button>
                  </Td>
                </Tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </AppShell>
  );
}
