import type { CSSProperties } from "react";
import { ListChecks } from "lucide-react";
import { Banner, Card, CardHeader, Checkbox, EmptyState, Table, TBody, Td, Th, THead, Tr } from "@/components/ui";
import { getAssessmentSettings, listAssessmentCriteria } from "@/lib/data/content";
import p from "../panels.module.css";
import s from "./content.module.css";

/**
 * There is no `assessment_criteria` row in the seed data yet — what exists
 * is the report-category weighting and which scenes are flagged critical.
 * This section shows exactly that, under the documented schema's column
 * names, rather than inventing a tolerance or target value nothing in the
 * codebase has computed. Editing a weight or an auto-fail rule here is
 * content configuration; the assessment engine remains the one place a
 * score gets computed.
 */
export async function AssessmentCriteriaSection() {
  const [criteria, settings] = await Promise.all([
    listAssessmentCriteria(),
    getAssessmentSettings(),
  ]);

  return (
    <>
      <Banner tone="info" title="Configuration, not scoring">
        This page manages which skills a case is assessed against and how
        much each is worth. The assessment engine — not this screen —
        computes the score.
      </Banner>

      {criteria.length === 0 ? (
        <EmptyState icon={ListChecks} title="No assessment criteria authored yet" />
      ) : (
        <Table label="Assessment criteria by skill">
          <THead>
            <Tr>
              <Th>Skill</Th>
              <Th>Procedure</Th>
              <Th numeric>Weight</Th>
              <Th numeric>Critical scenes</Th>
            </Tr>
          </THead>
          <TBody>
            {criteria.map((row) => (
              <Tr key={row.key}>
                <Td head>{row.skillLabel}</Td>
                <Td>{row.procedureName}</Td>
                <Td numeric>
                  <span className={s.criteriaWeight}>
                    <span className={s.weightTrack} aria-hidden="true">
                      <span
                        className={s.weightFill}
                        style={{ "--w": `${row.weight}%` } as CSSProperties}
                      />
                    </span>
                    {row.weight}%
                  </span>
                </Td>
                <Td numeric>{row.criticalSceneCount}</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <Card padding="lg">
        <CardHeader
          title="Assessment settings"
          subtitle="Program-wide rules. Editing these is not yet connected to a store — see the note below."
        />
        <dl className={p.kv}>
          <dt>Passing score</dt>
          <dd>{settings.passingScore}</dd>
          <dt>Critical error</dt>
          <dd>{settings.criticalAutoFail ? "Automatic failure: ON" : "Automatic failure: OFF"}</dd>
          <dt>Incomplete procedure</dt>
          <dd>{settings.incompleteAutoFail ? "Automatic failure: ON" : "Automatic failure: OFF"}</dd>
          <dt>Guidance during assessment</dt>
          <dd>{settings.guidanceEnabled ? "ON" : "OFF"}</dd>
        </dl>
        <Checkbox
          label="Enable guidance during assessment"
          checked={settings.guidanceEnabled}
          disabled
        />
      </Card>
    </>
  );
}
