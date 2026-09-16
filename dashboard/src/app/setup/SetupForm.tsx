"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button, Card, Segmented, Select } from "@/components/ui";
import { roughDuration, titleCase } from "@/lib/format";
import type { SetupDefaults } from "@/lib/data/setup";
import type { Difficulty } from "@/lib/types";
import { PASS_MARK, TOLERANCE_BAND } from "@/lib/types";
import s from "./setup.module.css";

/**
 * Four fields, all defaulted from the account, plus a collapsed
 * advanced disclosure for the implant variant.
 *
 * Two columns: the form, and a read-back of what those choices add up to. The
 * summary is the same set of facts the headset reads aloud on its confirmation
 * card before anything is committed — showing it here means the
 * headset never says anything the desktop did not.
 *
 * Nothing is written. Continue carries the configuration to the case browser in
 * the URL; the `plans` row is created when planning step 1 is submitted in
 * Creating it now would leave an orphaned draft behind every time
 * somebody opened this page and changed their mind.
 */
export function SetupForm({
  defaults,
  initialMode,
}: {
  defaults: SetupDefaults;
  initialMode?: "training" | "assessment";
}) {
  const router = useRouter();

  const [procedure, setProcedure] = useState(defaults.procedure?.id ?? "");
  const [mode, setMode] = useState<"training" | "assessment">(
    initialMode ?? defaults.mode,
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(defaults.difficulty);
  const [design, setDesign] = useState(defaults.design);
  const [fixation, setFixation] = useState(defaults.fixation);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const chosen =
    defaults.procedures.find((p) => p.id === procedure) ?? defaults.procedure;

  const band = TOLERANCE_BAND[difficulty];

  function onContinue() {
    const params = new URLSearchParams({
      procedure,
      mode,
      difficulty,
      design,
      fixation,
    });
    router.push(`/cases?${params.toString()}`);
  }

  return (
    <div className={s.layout}>
      <Card padding="lg" className={s.card}>
        <div className={s.fields}>
          <div className={s.pair}>
            <Select
              label="Procedure"
              name="procedure"
              value={procedure}
              onChange={(event) => setProcedure(event.target.value)}
              helper="Other procedures are not yet published."
            >
              {defaults.procedures.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>

            <div className={s.field}>
              <span className={s.label}>Difficulty</span>
              <Segmented
                label="Difficulty"
                value={difficulty}
                onChange={setDifficulty}
                options={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "expert", label: "Expert" },
                ]}
              />
              <span className={s.hint}>
                Scales every tolerance band to ×{band.toFixed(1)} of the authored
                value. Pass mark {PASS_MARK[difficulty]}.
              </span>
            </div>
          </div>

          <div className={s.field}>
            <span className={s.label}>Mode</span>
            <div className={s.modes}>
              <ModeCard
                title="Training"
                selected={mode === "training"}
                onSelect={() => setMode("training")}
              >
                Ghost guides, directional arrows, safe corridors, live numeric
                readouts. Retry without penalty; hints appear after inactivity.
              </ModeCard>
              <ModeCard
                title="Assessment"
                selected={mode === "assessment"}
                onSelect={() => setMode("assessment")}
              >
                No guides, no readouts, no hints. Errors are logged, not
                announced. One attempt per step unless the scene allows a redo.
              </ModeCard>
            </div>
          </div>

          <div className={s.advanced}>
            <button
              type="button"
              className={s.advancedToggle}
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              <span>
                <span className={s.advancedTitle}>
                  Advanced — implant variant
                </span>
                <span className={s.advancedSummary}>
                  {design} ·{" "}
                  {fixation === "cemented" ? "Cemented" : "Cementless"} · patella
                  decided intra-operatively
                </span>
              </span>
              {advancedOpen ? (
                <ChevronUp width={18} height={18} aria-hidden="true" />
              ) : (
                <ChevronDown width={18} height={18} aria-hidden="true" />
              )}
            </button>

            {advancedOpen && (
              <div className={s.pair}>
                <div className={s.field}>
                  <span className={s.label}>Implant design</span>
                  <Segmented
                    label="Implant design"
                    value={design}
                    onChange={setDesign}
                    options={[
                      { value: "CR", label: "CR" },
                      { value: "PS", label: "PS" },
                    ]}
                  />
                  <span className={s.hint}>
                    PS resects the PCL at 5.1b and adds Part 8, the box cut.
                  </span>
                </div>

                <div className={s.field}>
                  <span className={s.label}>Fixation</span>
                  <Segmented
                    label="Fixation"
                    value={fixation}
                    onChange={setFixation}
                    options={[
                      { value: "cemented", label: "Cemented" },
                      { value: "cementless", label: "Cementless" },
                    ]}
                  />
                  <span className={s.hint}>
                    Cementless replaces 7.2 with the 7.2b broach and skips Part
                    10.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={s.foot}>
          <Button variant="secondary" href="/">
            Cancel
          </Button>
          {!chosen && (
            <span className={s.footNote}>
              No procedure is published, so there is nothing to configure.
            </span>
          )}
          <Button
            variant="primary"
            size="lg"
            className={s.footPrimary}
            onClick={onContinue}
            disabled={!chosen}
          >
            Continue to case selection
          </Button>
        </div>
      </Card>

      <aside className={s.summary} aria-label="Session summary">
        <p className={s.summaryTitle}>This session</p>
        <p className={s.summaryLede}>
          Read back on the headset confirmation card before anything is
          committed.
        </p>

        <dl className={s.summaryList}>
          <SummaryRow label="Procedure" value={chosen?.name ?? "—"} />
          <SummaryRow label="Mode" value={titleCase(mode)} />
          <SummaryRow label="Difficulty" value={titleCase(difficulty)} />
          <SummaryRow label="Pass mark" value={String(PASS_MARK[difficulty])} />
          <SummaryRow label="Tolerance" value={`×${band.toFixed(1)} authored`} />
          <SummaryRow label="Implant design" value={design} />
          <SummaryRow label="Fixation" value={titleCase(fixation)} />
          <SummaryRow label="Patella" value="Decided in 9.1" />
        </dl>

        {chosen && (
          <div className={s.summaryFigures}>
            <Figure value={String(chosen.parts)} label="Parts" />
            <Figure value={String(chosen.scenes)} label="Scenes" />
            <Figure
              value={roughDuration(chosen.typicalDurationS)}
              label="Typical"
            />
          </div>
        )}
      </aside>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={s.summaryRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className={s.figure}>
      <span className={s.figureValue}>{value}</span>
      <span className={s.figureLabel}>{label}</span>
    </div>
  );
}

function ModeCard({
  title,
  selected,
  onSelect,
  children,
}: {
  title: string;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={selected ? `${s.mode} ${s.modeOn}` : s.mode}
      aria-pressed={selected}
      onClick={onSelect}
    >
      <span className={s.modeHead}>
        <span className={s.modeTitle}>{title}</span>
        {selected && <span className={s.modeTick}>Selected</span>}
      </span>
      <span className={s.modeText}>{children}</span>
    </button>
  );
}
