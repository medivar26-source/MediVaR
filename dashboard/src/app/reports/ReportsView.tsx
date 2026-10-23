import { FileText } from "lucide-react";
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
import type { ReportRow } from "@/lib/data/performance";
import { clock, shortDate, titleCase } from "@/lib/format";
import { PASS_MARK } from "@/lib/types";

/** The generated reports a viewer may open. The learner column appears only for staff looking across learners. */
export function ReportsView({
  reports,
  learner,
  showLearner,
}: {
  reports: ReportRow[];
  learner: boolean;
  showLearner: boolean;
}) {
  return (
    <>
      {reports.length === 0 ? (
        <EmptyState icon={FileText} title="No reports yet"
            action={learner ? <Button variant="primary" href="/cases">Start a case</Button> : undefined}>
          {learner
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
                          (report.criticalErrors ?? 0) < 3
                            ? "pass"
                            : "fail"
                        }
                      >
                        {(report.totalScore as number) >= passMark &&
                        (report.criticalErrors ?? 0) < 3
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
    </>
  );
}
