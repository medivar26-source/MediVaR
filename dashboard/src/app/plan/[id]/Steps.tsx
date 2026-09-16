"use client";

import { useState } from "react";
import { MEASUREMENTS, type PlanDetail, type StepGate } from "@/lib/plan";
import {
  ChoiceList,
  MeasurementTable,
  OptionScale,
  RiskList,
  Rows,
  Slider,
} from "./Controls";
import { StepForm } from "./StepForm";
import s from "./plan.module.css";
import t from "./steps.module.css";

/**
 * The seven planning steps
 *
 * Each one owns a single branch of the plan payload, holds it in state and
 * hands it to `StepForm` as a `patch`. None of them knows whether an answer is
 * right: the verdict in `gate` came from `plan_gates`, which read `case_truth`
 * on the server and returned a sentence.
 *
 * **The radiograph wells render a labelled plate.** The imaging manifest names
 * four views and the `imaging` bucket is empty, so there is nothing to
 * draw. Measurements are typed instead of dropped on a canvas, which
 * requires regardless: *"Radiograph viewers expose measured values as text;
 * the image is never the only source of a number."* When the radiographs are
 * authored, the canvas fills the same well and writes the same six numbers.
 */

type StepProps = { plan: PlanDetail; gate: StepGate };

function Card({
  title,
  sub,
  action,
  children,
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={s.card}>
      <div className={s.cardHead}>
        <div>
          <h2 className={s.cardTitle}>{title}</h2>
          {sub && <p className={s.cardSub}>{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Plate({ title, note }: { title: string; note: string }) {
  return (
    <div className={s.plate}>
      <p className={s.plateText}>{title}</p>
      <p className={s.plateNote}>{note}</p>
    </div>
  );
}

/* ============================================================
   1 · Case history
   ============================================================ */

export function Step1({ plan, gate }: StepProps) {
  const [diagnosis, setDiagnosis] = useState(plan.payload.diagnosis ?? "");

  return (
    <StepForm
      planId={plan.id}
      step={1}
      patch={{ diagnosis }}
      gate={gate}
      backHref={`/cases/${plan.caseId}`}
      nextLabel="Proceed to imaging review"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="Patient"
            sub="Synthetic. No identifiable data is stored anywhere in the product."
          >
            <div className={s.tiles}>
              {plan.case.patient.map((field) => (
                <div className={s.tile} key={field.label}>
                  <span className={s.tileLabel}>{field.label}</span>
                  <span className={s.tileValue}>{field.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Presentation">
            <dl className={s.kv}>
              {plan.case.narrative.map((field) => (
                <div className={s.kvRow} key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Primary diagnosis"
            sub="Commit before you look at any imaging. The gate is the correct primary diagnosis, and the history alone is enough to reach it."
          >
            <ChoiceList
              name="Primary diagnosis"
              options={plan.options.diagnosis ?? []}
              value={diagnosis}
              onChange={setDiagnosis}
            />
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   2 · Imaging review
   ============================================================ */

export function Step2({ plan, gate }: StepProps) {
  const [reading, setReading] = useState({
    kl_grade: plan.payload.imaging_reading?.kl_grade ?? "",
    compartment: plan.payload.imaging_reading?.compartment ?? "",
  });

  return (
    <StepForm
      planId={plan.id}
      step={2}
      patch={{ imaging_reading: reading }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/1`}
      nextLabel="Proceed to deformity measurement"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="Imaging package"
            sub={`${plan.case.imaging.length} views authored for this case.`}
          >
            <div className={s.viewList}>
              {plan.case.imaging.map((view) => (
                <span className={s.budget} key={view.view}>
                  {view.label}
                </span>
              ))}
            </div>
            <Plate
              title="Radiographs are not authored yet"
              note="The manifest names the views above and the imaging bucket is empty, so this well stays a labelled plate rather than a stock photograph standing in for a patient's films."
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Radiographic grade"
            sub="Grade the disease you would expect from this history and examination."
          >
            <ChoiceList
              name="Radiographic grade"
              options={plan.options.kl_grade ?? []}
              value={reading.kl_grade}
              onChange={(kl_grade) => setReading((r) => ({ ...r, kl_grade }))}
            />
          </Card>

          <Card
            title="Affected compartment"
            sub="Which compartment has lost its joint space."
          >
            <ChoiceList
              name="Affected compartment"
              options={plan.options.compartment ?? []}
              value={reading.compartment}
              onChange={(compartment) =>
                setReading((r) => ({ ...r, compartment }))
              }
            />
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   3 · Deformity measurement
   ============================================================ */

export function Step3({ plan, gate }: StepProps) {
  const [values, setValues] = useState<Record<string, number | undefined>>(
    () => ({ ...plan.payload.measurements }),
  );

  return (
    <StepForm
      planId={plan.id}
      step={3}
      patch={{
        measurements: Object.fromEntries(
          Object.entries(values).filter(([, v]) => v !== undefined),
        ),
      }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/2`}
      nextLabel="Proceed to alignment planning"
    >
      <div className={`${s.body} ${s.thirds}`}>
        <div className={s.col}>
          <Card title="Full-length AP">
            <Plate
              title="Measurement canvas pending"
              note="Landmark points, axis lines and angle arcs land in this well when the long-leg films are authored. Until then the six angles are entered directly, which is required in any case: the image is never the only source of a number."
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Deformity measurement"
            sub="Every angle must land within its tolerance of the film. The normal range beside each is population knowledge — this knee is abnormal, so being outside it is expected."
          >
            <MeasurementTable
              specs={MEASUREMENTS}
              values={values}
              ranges={plan.case.referenceRanges}
              onChange={(key, value) =>
                setValues((current) => ({ ...current, [key]: value }))
              }
            />
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   4 · Alignment planning
   ============================================================ */

export function Step4({ plan, gate }: StepProps) {
  const measured = plan.payload.measurements ?? {};
  const [targetHka, setTargetHka] = useState(
    plan.payload.alignment_plan?.target_hka_deg ?? 180,
  );
  const [resections, setResections] = useState({
    proximal_tibia_medial_mm:
      plan.payload.resections?.proximal_tibia_medial_mm ?? 2,
    posterior_tibial_slope_deg:
      plan.payload.resections?.posterior_tibial_slope_deg ?? 3,
    distal_femur_mm: plan.payload.resections?.distal_femur_mm ?? 9,
    distal_femur_valgus_deg:
      plan.payload.resections?.distal_femur_valgus_deg ?? 5,
  });

  const measuredHka = measured.hka_deg;
  const correction =
    measuredHka === undefined
      ? undefined
      : Math.round((targetHka - measuredHka) * 10) / 10;

  return (
    <StepForm
      planId={plan.id}
      step={4}
      /* `resection_strategy` used to be written here, from `measured.hka_deg`
         — a release decision the learner had not made yet, guessed from the
         deformity, and defaulting to `lateral_release` on an unmeasured knee
         because `undefined ?? 180 < 180` is false. Step 6 is where the release
         is actually chosen and graded, so the strategy is now *derived* from
         that answer wherever it is read (`releaseStrategy`), not stored twice.
         The same reasoning as `plan_gates`: a derivation cannot go stale, and a
         stored copy of an answer that can still change will. */
      patch={{
        alignment_plan: {
          target_hka_deg: targetHka,
          planned_correction_deg: correction,
        },
        resections,
      }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/3`}
      nextLabel="Proceed to implant selection"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="What you measured"
            sub="Carried forward from step 3. Change it there, not here."
          >
            <div className={s.tiles}>
              {MEASUREMENTS.map((spec) => (
                <div className={s.tile} key={spec.key}>
                  <span className={s.tileLabel}>{spec.short}</span>
                  <span className={s.tileValue}>
                    {measured[spec.key] !== undefined
                      ? `${measured[spec.key]}${spec.unit}`
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Projected outcome">
            <Rows
              rows={[
                { label: "Target mechanical axis", value: `${targetHka.toFixed(1)}°` },
                {
                  label: "Correction from measured",
                  value:
                    correction === undefined
                      ? "—"
                      : `${correction > 0 ? "+" : ""}${correction.toFixed(1)}°`,
                },
                {
                  label: "Deviation from neutral",
                  value: `${Math.abs(targetHka - 180).toFixed(1)}°`,
                },
              ]}
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Target alignment"
            sub="This is the contract. Every measurement the headset takes is scored against it, not against a generic ideal."
          >
            <div className={t.sliders}>
              <Slider
                label="Post-operative mechanical axis"
                value={targetHka}
                min={174}
                max={186}
                step={0.5}
                unit="°"
                format={(v) =>
                  v === 180
                    ? "Neutral"
                    : `${Math.abs(v - 180).toFixed(1)}° ${v < 180 ? "varus" : "valgus"}`
                }
                hint="The gate is within 1° of neutral."
                onChange={setTargetHka}
              />
            </div>
          </Card>

          <Card title="Planned resections">
            <div className={t.sliders}>
              <Slider
                label="Proximal tibia — medial"
                value={resections.proximal_tibia_medial_mm}
                min={0}
                max={12}
                step={1}
                unit=" mm"
                onChange={(v) =>
                  setResections((r) => ({ ...r, proximal_tibia_medial_mm: v }))
                }
              />
              <Slider
                label="Posterior tibial slope"
                value={resections.posterior_tibial_slope_deg}
                min={0}
                max={10}
                step={0.5}
                unit="°"
                hint="Acceptable 0°–7°. Beyond that the insert is unstable in flexion."
                onChange={(v) =>
                  setResections((r) => ({ ...r, posterior_tibial_slope_deg: v }))
                }
              />
              <Slider
                label="Distal femur"
                value={resections.distal_femur_mm}
                min={6}
                max={14}
                step={0.5}
                unit=" mm"
                onChange={(v) =>
                  setResections((r) => ({ ...r, distal_femur_mm: v }))
                }
              />
              <Slider
                label="Distal femoral valgus cut"
                value={resections.distal_femur_valgus_deg}
                min={3}
                max={9}
                step={0.5}
                unit="°"
                onChange={(v) =>
                  setResections((r) => ({ ...r, distal_femur_valgus_deg: v }))
                }
              />
            </div>
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   5 · Implant selection
   ============================================================ */

/**
 * Nothing on this step is authored here any more.
 *
 * The two designs and the three size ladders were arrays in this file, which
 *
 * stylistic: `case_truth` grades against `acceptable_femoral_sizes`, so a
 * catalogue in a component and a catalogue in the database are two lists that
 * can disagree about which sizes exist. They now come from
 * `plan_step_options`, scoped to this case's procedure, and the screen
 * can only offer what the validator will accept.
 *
 * The sizes also start **unchosen**. They used to default to 4 · 4 · 10 mm,
 * which is an answer nobody gave sitting in a graded field — and until the schema a
 * plan could be sealed on those defaults without the gate noticing.
 */
export function Step5({ plan, gate }: StepProps) {
  const [implants, setImplants] = useState<{
    design: string;
    femoral_size?: number;
    tibial_tray_size?: number;
    pe_insert_mm?: number;
  }>({
    design:
      plan.payload.implants?.design ??
      plan.payload.session_config?.implant_design ??
      "",
    femoral_size: plan.payload.implants?.femoral_size,
    tibial_tray_size: plan.payload.implants?.tibial_tray_size,
    pe_insert_mm: plan.payload.implants?.pe_insert_mm,
  });

  return (
    <StepForm
      planId={plan.id}
      step={5}
      patch={{ implants }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/4`}
      nextLabel="Proceed to risk & strategy"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="Design"
            sub="The variant changes which parts run in the headset, so it is decided here and read back on the confirmation card."
          >
            <ChoiceList
              name="Implant design"
              options={plan.options.design ?? []}
              value={implants.design}
              onChange={(design) => setImplants((i) => ({ ...i, design }))}
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Component sizing"
            sub="Size from cortical coverage and the measured AP dimension. The fit check fails on overhang beyond 2 mm and on any undercut."
          >
            <div className={t.sliders}>
              <OptionScale
                label="Femoral size"
                options={plan.options.femoral_size ?? []}
                value={implants.femoral_size}
                format={(option) => option.value}
                onChange={(femoral_size) =>
                  setImplants((i) => ({ ...i, femoral_size }))
                }
              />
              <OptionScale
                label="Tibial tray size"
                options={plan.options.tibial_tray_size ?? []}
                value={implants.tibial_tray_size}
                format={(option) => option.value}
                onChange={(tibial_tray_size) =>
                  setImplants((i) => ({ ...i, tibial_tray_size }))
                }
              />
              <OptionScale
                label="Insert thickness"
                options={plan.options.pe_insert_mm ?? []}
                value={implants.pe_insert_mm}
                hint="The thinnest insert that fills the balanced gap."
                onChange={(pe_insert_mm) =>
                  setImplants((i) => ({ ...i, pe_insert_mm }))
                }
              />
            </div>
          </Card>

          <Card title="Bone–implant fit">
            <Plate
              title="Fit visual pending"
              note="The overhang overlay renders here once the component geometry ships with the case assets. The fit check itself runs server-side against the case's acceptable sizes, and its verdict is below."
            />
          </Card>
        </div>
      </div>
    </StepForm>
  );
}

/* ============================================================
   6 · Risk & strategy
   ============================================================ */

export function Step6({ plan, gate }: StepProps) {
  const [acknowledged, setAcknowledged] = useState<string[]>(
    plan.payload.risks?.acknowledged ?? [],
  );
  const [tightSide, setTightSide] = useState(
    plan.payload.risks?.tight_side ?? "",
  );

  const toggle = (id: string) =>
    setAcknowledged((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id],
    );

  return (
    <StepForm
      planId={plan.id}
      step={6}
      patch={{ risks: { acknowledged, tight_side: tightSide } }}
      gate={gate}
      backHref={`/plan/${plan.id}/step/5`}
      nextLabel="Proceed to plan summary"
    >
      <div className={`${s.body} ${s.split}`}>
        <div className={s.col}>
          <Card
            title="Risk assessment"
            sub={`${acknowledged.length} of ${plan.risks.length} acknowledged. Each one is derived from this patient's own record, not from a generic checklist.`}
          >
            <RiskList
              risks={plan.risks}
              acknowledged={acknowledged}
              onToggle={toggle}
            />
          </Card>
        </div>

        <div className={s.col}>
          <Card
            title="Which side is tight"
            sub="The release you commit to here is the one the headset expects at 2.3 and 3.2. Getting it wrong costs marks in both."
          >
            <ChoiceList
              name="Tight side"
              options={plan.options.tight_side ?? []}
              value={tightSide}
              onChange={setTightSide}
            />
          </Card>

          {/* Authored per procedure, in `plan_step_options`. Every one
              of these names a structure or a scene number that belongs to TKR,
              so they are content and not chrome —
              procedure with none authored renders no card rather than an empty
              one. */}
          {plan.guidance.length > 0 && (
            <Card title="Key intra-operative points">
              <ul className={s.kv}>
                {plan.guidance.map((point) => (
                  <li className={s.kvRow} key={point}>
                    <dt aria-hidden="true">·</dt>
                    <dd>{point}</dd>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </StepForm>
  );
}
