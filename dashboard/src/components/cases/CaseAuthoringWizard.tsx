"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  TriangleAlert,
  X,
  Eye,
  Save,
  Send,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import type { Difficulty, Side } from "@/lib/types";
import {
  TIBIAL_TEMPLATES,
  FEMORAL_TEMPLATES,
  evaluateTibialFit,
  evaluateFemoralFit,
} from "@/lib/data/tkr_templates";
import {
  createCaseAction,
  updateCaseAction,
  publishCaseAction,
} from "@/app/actions/cases";
import {
  Badge,
  Banner,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Chip,
  Input,
  Segmented,
  Select,
  Stepper,
  Table,
  TBody,
  Td,
  Textarea,
  Th,
  THead,
  Tr,
} from "@/components/ui";
import s from "./wizard.module.css";

export type WizardProps = {
  initialCase?: any;
  availablePrograms: { id: string; name: string }[];
  availableSkills: { id: string; name: string; weight?: number }[];
};

export function CaseAuthoringWizard({
  initialCase,
  availablePrograms,
  availableSkills,
}: WizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLearnerPreview, setShowLearnerPreview] = useState<boolean>(false);

  const activeVersion = initialCase?.active_version || {};

  // Step 1: Case Information State
  const [name, setName] = useState<string>(
    initialCase?.name || activeVersion.title || ""
  );
  const [side, setSide] = useState<Side>(
    ((activeVersion.side || "right").toLowerCase() as Side)
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (initialCase?.difficulty ||
      activeVersion.difficulty ||
      "intermediate").toLowerCase() as Difficulty
  );
  const [pathology, setPathology] = useState<string>(
    activeVersion.pathology || "osteoarthritis"
  );
  const [pathologyLabel, setPathologyLabel] = useState<string>(
    activeVersion.pathology_label ||
      "Tricompartmental Osteoarthritis with Severe Varus Deformity"
  );
  const [description, setDescription] = useState<string>(
    initialCase?.description || activeVersion.description || ""
  );
  const [learningObjective, setLearningObjective] = useState<string>(
    initialCase?.learning_objective || ""
  );
  const [programIds, setProgramIds] = useState<string[]>(
    initialCase?.program_ids ||
      (availablePrograms[0] ? [availablePrograms[0].id] : [])
  );

  // Step 2: Patient & Clinical Scenario State
  const [patientAge, setPatientAge] = useState<number>(
    activeVersion.patient?.age || 68
  );
  const [patientGender, setPatientGender] = useState<string>(
    activeVersion.patient?.gender || "Male"
  );
  const [patientBmi, setPatientBmi] = useState<number>(
    activeVersion.patient?.bmi || 29.4
  );
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    activeVersion.patient?.clinical_notes ||
      "Severe medial compartment pain, fixed flexion contracture 5°."
  );
  const [patientHistory, setPatientHistory] = useState<string>(
    activeVersion.patient?.history ||
      "Progressive right knee pain over 6 years. Failed conservative therapy."
  );

  const [objectives, setObjectives] = useState<string[]>(
    activeVersion.objectives?.length
      ? activeVersion.objectives
      : [
          "Accurately calculate Mechanical Axis Deviation (MAD) and mHKA from full-leg radiograph.",
          "Select optimal tibial baseplate avoiding medial/lateral overhang > 1.0 mm.",
          "Select optimal femoral component ensuring flush anterior resection without anterior cortical notching.",
        ]
  );
  const [newObjective, setNewObjective] = useState<string>("");

  // Step 3: Imaging & Calibration State
  const initialImaging = initialCase?.imaging || [];
  const flapImg =
    initialImaging.find((img: any) => img.view_type === "FLAP") || {};
  const klatImg =
    initialImaging.find((img: any) => img.view_type === "KLAT") || {};

  const [flapStoragePath, setFlapStoragePath] = useState<string>(
    flapImg.storage_path || "cases/synth/flap.jpg"
  );
  const [flapPixelDia, setFlapPixelDia] = useState<number>(
    flapImg.calibration?.detected_marker_pixel_diameter || 94.7
  );

  const [klatStoragePath, setKlatStoragePath] = useState<string>(
    klatImg.storage_path || "cases/synth/klat.jpg"
  );
  const [klatPixelDia, setKlatPixelDia] = useState<number>(
    klatImg.calibration?.detected_marker_pixel_diameter || 94.7
  );

  // Step 4: Reference Plan & Assessment Key State
  const refAssessment = initialCase?.reference_plan?.assessment || {};
  const [madMm, setMadMm] = useState<number>(refAssessment.MAD_mm ?? 12.0);
  const [amaDeg, setAmaDeg] = useState<number>(refAssessment.AMA_deg ?? 5.8);
  const [mhkaDeg, setMhkaDeg] = useState<number>(refAssessment.mHKA_deg ?? 174.0);
  const [mptaDeg, setMptaDeg] = useState<number>(refAssessment.MPTA_deg ?? 85.5);
  const [ldfaDeg, setLdfaDeg] = useState<number>(refAssessment.LDFA_deg ?? 87.0);
  const [ptsDeg, setPtsDeg] = useState<number>(refAssessment.PTS_deg ?? 7.0);
  const [alignmentType, setAlignmentType] = useState<string>(
    refAssessment.alignment_type || (side === "right" && madMm > 0 ? "VARUS" : "VALGUS")
  );

  const refTibial = initialCase?.reference_plan?.tibial_component || {};
  const [tibialSize, setTibialSize] = useState<number>(
    refTibial.implant_size || 3
  );
  const [tibialX, setTibialX] = useState<number>(
    refTibial.position_2d?.x_offset_mm ?? 1.2
  );
  const [tibialY, setTibialY] = useState<number>(
    refTibial.position_2d?.y_offset_mm ?? -0.4
  );
  const [tibialRot, setTibialRot] = useState<number>(
    refTibial.position_2d?.rotation_deg ?? 0.5
  );

  const refFemoral = initialCase?.reference_plan?.femoral_component || {};
  const [femoralSize, setFemoralSize] = useState<number>(
    refFemoral.implant_size || 4
  );
  const [femoralX, setFemoralX] = useState<number>(
    refFemoral.position_2d?.x_offset_mm ?? 0.0
  );
  const [femoralY, setFemoralY] = useState<number>(
    refFemoral.position_2d?.y_offset_mm ?? 0.0
  );
  const [femoralRot, setFemoralRot] = useState<number>(
    refFemoral.position_2d?.rotation_deg ?? 3.0
  );

  const [instructorNotes, setInstructorNotes] = useState<string>(
    initialCase?.reference_plan?.instructor_notes ||
      "Target neutral mechanical axis 180° ± 2°. Resect proximal tibia perpendicular to mechanical axis."
  );

  // Derived Calculations
  const tibialFit = useMemo(() => {
    return evaluateTibialFit(tibialSize, tibialX, tibialY);
  }, [tibialSize, tibialX, tibialY]);

  const femoralFit = useMemo(() => {
    return evaluateFemoralFit(femoralSize, femoralX, femoralY);
  }, [femoralSize, femoralX, femoralY]);

  const flapScale = useMemo(() => {
    if (flapPixelDia <= 0) return 0;
    return Number((25.0 / flapPixelDia).toFixed(4));
  }, [flapPixelDia]);

  const klatScale = useMemo(() => {
    if (klatPixelDia <= 0) return 0;
    return Number((25.0 / klatPixelDia).toFixed(4));
  }, [klatPixelDia]);

  const isFlapValid = flapScale >= 0.05 && flapScale <= 1.5;
  const isKlatValid = klatScale >= 0.05 && klatScale <= 1.5;

  // Pre-flight Checklist Items
  const checklist = useMemo(() => {
    return [
      {
        id: "metadata",
        label: "Case Information & Scenario Complete",
        ok: name.trim().length > 0 && !!side && !!pathology,
        detail: name
          ? `${name} (${side.toUpperCase()}, ${difficulty})`
          : "Case title is required",
      },
      {
        id: "imaging",
        label: "FLAP & KLAT Radiograph Packages Attached",
        ok: Boolean(flapStoragePath) && Boolean(klatStoragePath),
        detail: "Full-length AP and lateral views specified",
      },
      {
        id: "calibration",
        label: "Radio-Opaque Marker Calibration Verified (Dynamic mm/px)",
        ok: isFlapValid && isKlatValid,
        detail: `FLAP: ${flapScale} mm/px · KLAT: ${klatScale} mm/px (Target range 0.05–1.5 mm/px)`,
      },
      {
        id: "measurements",
        label: "6 Canonical Reference Measurements Recorded",
        ok: [madMm, amaDeg, mhkaDeg, mptaDeg, ldfaDeg, ptsDeg].every(
          (v) => typeof v === "number" && !isNaN(v)
        ),
        detail: `MAD ${madMm}mm · mHKA ${mhkaDeg}° · MPTA ${mptaDeg}° · LDFA ${ldfaDeg}°`,
      },
      {
        id: "sizing",
        label: "Tibial & Femoral Implant Sizing Within Targets",
        ok:
          tibialFit.fitStatus !== "POOR FIT" &&
          femoralFit.fitStatus !== "POOR FIT",
        detail: `Tibial Size ${tibialSize} (${tibialFit.fitStatus}) · Femoral Size ${femoralSize} (${femoralFit.fitStatus})`,
      },
      {
        id: "curriculum",
        label: "Curriculum Program Enrollment Configured",
        ok: programIds.length > 0,
        detail: `${programIds.length} program(s) associated`,
      },
    ];
  }, [
    name,
    side,
    difficulty,
    pathology,
    flapStoragePath,
    klatStoragePath,
    isFlapValid,
    isKlatValid,
    flapScale,
    klatScale,
    madMm,
    amaDeg,
    mhkaDeg,
    mptaDeg,
    ldfaDeg,
    ptsDeg,
    tibialFit,
    femoralFit,
    tibialSize,
    femoralSize,
    programIds,
  ]);

  const isPublishable = checklist.every((c) => c.ok);

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    setObjectives((prev) => [...prev, newObjective.trim()]);
    setNewObjective("");
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleProgram = (progId: string) => {
    setProgramIds((prev) =>
      prev.includes(progId)
        ? prev.filter((id) => id !== progId)
        : [...prev, progId]
    );
  };

  // Build Payload
  const buildPayload = () => {
    const defaultSkillId =
      availableSkills[0]?.id || "116c30d7-817e-417d-afd7-a76c296af9ec";
    return {
      name,
      difficulty,
      description,
      learning_objective: learningObjective,
      side,
      pathology,
      pathology_label: pathologyLabel,
      program_ids: programIds,
      patient: {
        age: Number(patientAge),
        gender: patientGender,
        bmi: Number(patientBmi),
        clinical_notes: clinicalNotes,
        history: patientHistory,
      },
      objectives,
      imaging: [
        {
          view_type: "FLAP",
          label: "Full Leg Anteroposterior (FLAP)",
          storage_path: flapStoragePath,
          laterality: side,
          calibration: {
            marker_type: "sphere_25mm",
            physical_marker_diameter_mm: 25.0,
            detected_marker_pixel_diameter: Number(flapPixelDia),
            calculated_scale_mm_per_px: flapScale,
            unit: "mm/px",
            is_valid: isFlapValid,
          },
        },
        {
          view_type: "KLAT",
          label: "Knee Lateral (KLAT)",
          storage_path: klatStoragePath,
          laterality: side,
          calibration: {
            marker_type: "sphere_25mm",
            physical_marker_diameter_mm: 25.0,
            detected_marker_pixel_diameter: Number(klatPixelDia),
            calculated_scale_mm_per_px: klatScale,
            unit: "mm/px",
            is_valid: isKlatValid,
          },
        },
      ],
      reference_plan: {
        assessment: {
          MAD_mm: Number(madMm),
          AMA_deg: Number(amaDeg),
          mHKA_deg: Number(mhkaDeg),
          MPTA_deg: Number(mptaDeg),
          LDFA_deg: Number(ldfaDeg),
          PTS_deg: Number(ptsDeg),
          alignment_type: alignmentType,
        },
        tibial_component: {
          implant_size: Number(tibialSize),
          position_2d: {
            x_offset_mm: Number(tibialX),
            y_offset_mm: Number(tibialY),
            rotation_deg: Number(tibialRot),
          },
          fit_metrics: {
            coverage_percentage: tibialFit.coveragePct,
            overhang_mm: Math.max(tibialFit.medialOverhangMm, tibialFit.lateralOverhangMm),
            fit_status: tibialFit.fitStatus,
          },
        },
        femoral_component: {
          implant_size: Number(femoralSize),
          position_2d: {
            x_offset_mm: Number(femoralX),
            y_offset_mm: Number(femoralY),
            rotation_deg: Number(femoralRot),
          },
          fit_metrics: {
            anterior_condylar_offset_mm: femoralFit.notchingRiskMm,
            notch_risk: femoralFit.notchingRiskMm > 0.5,
            fit_status: femoralFit.fitStatus,
          },
        },
        instructor_notes: instructorNotes,
      },
      assessment_rubric: [
        {
          skill_id: defaultSkillId,
          name: "Mechanical Axis Deviation (MAD)",
          parameter: "MAD_mm",
          target_value: Number(madMm),
          tolerance_min: 2.0,
          tolerance_max: 2.0,
          unit: "mm",
          severity_rule: { minor: 2.0, major: 4.0, critical: 6.0 },
        },
        {
          skill_id: defaultSkillId,
          name: "Mechanical Hip-Knee-Ankle Angle",
          parameter: "mHKA_deg",
          target_value: Number(mhkaDeg),
          tolerance_min: 1.5,
          tolerance_max: 1.5,
          unit: "°",
          severity_rule: { minor: 1.5, major: 3.0, critical: 5.0 },
        },
        {
          skill_id: defaultSkillId,
          name: "Medial Proximal Tibial Angle",
          parameter: "MPTA_deg",
          target_value: Number(mptaDeg),
          tolerance_min: 2.0,
          tolerance_max: 2.0,
          unit: "°",
          severity_rule: { minor: 2.0, major: 3.5, critical: 5.0 },
        },
        {
          skill_id: defaultSkillId,
          name: "Lateral Distal Femoral Angle",
          parameter: "LDFA_deg",
          target_value: Number(ldfaDeg),
          tolerance_min: 2.0,
          tolerance_max: 2.0,
          unit: "°",
          severity_rule: { minor: 2.0, major: 3.5, critical: 5.0 },
        },
      ],
    };
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = buildPayload();
      let res;
      if (initialCase?.id) {
        res = await updateCaseAction(initialCase.id, payload);
      } else {
        res = await createCaseAction(payload);
      }
      if (res.success && res.data) {
        router.push(`/cases/${res.data.id}`);
      } else {
        setErrorMessage(res.error || "Save draft failed.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to save draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!isPublishable) {
      setErrorMessage(
        "Please complete all pre-flight checklist items before publishing."
      );
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = buildPayload();
      let targetId = initialCase?.id;
      if (!targetId) {
        const createRes = await createCaseAction(payload);
        if (!createRes.success) throw new Error(createRes.error);
        targetId = createRes.data.id;
      } else {
        const updateRes = await updateCaseAction(targetId, payload);
        if (!updateRes.success) throw new Error(updateRes.error);
      }

      const pubRes = await publishCaseAction(targetId);
      if (pubRes.success) {
        router.push(`/cases/${targetId}`);
      } else {
        setErrorMessage(pubRes.error || "Publishing failed.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to publish case.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={s.wizardContainer}>
      {/* Stepper Navigation: Horizontal, using existing Stepper component as-is */}
      <div className={s.stepperCard}>
        <Stepper
          orientation="horizontal"
          label="Case authoring steps"
          steps={[
            {
              label: "1. Case Info",
              state:
                currentStep === 1
                  ? "current"
                  : currentStep > 1
                    ? "done"
                    : "upcoming",
            },
            {
              label: "2. Patient & Scenario",
              state:
                currentStep === 2
                  ? "current"
                  : currentStep > 2
                    ? "done"
                    : "upcoming",
            },
            {
              label: "3. Imaging & Calibration",
              state:
                currentStep === 3
                  ? "current"
                  : currentStep > 3
                    ? "done"
                    : "upcoming",
            },
            {
              label: "4. Reference Plan",
              state:
                currentStep === 4
                  ? "current"
                  : currentStep > 4
                    ? "done"
                    : "upcoming",
            },
            {
              label: "5. Review & Publish",
              state:
                currentStep === 5
                  ? "current"
                  : currentStep > 5
                    ? "done"
                    : "upcoming",
            },
          ]}
        />
      </div>

      {errorMessage && (
        <Banner
          tone="fail"
          title="Action required"
          onDismiss={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Banner>
      )}

      {/* STEP 1: Case Information */}
      {currentStep === 1 && (
        <Card padding="lg">
          <CardHeader
            title="Step 1: Case Information"
            subtitle="Define surgical procedure context, title, pathology classification, and curriculum program associations."
          />
          <div className={s.formGrid}>
            <div className={s.fullWidth}>
              <Input
                label="Case Title"
                placeholder="e.g. Varus Gonarthrosis with Fixed Flexion Contracture"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                helper="Specific, descriptive title displayed in the case library and surgical plan."
              />
            </div>

            <div className={s.stackSm}>
              <label
                style={{
                  fontSize: "var(--t-label)",
                  fontWeight: "var(--fw-semibold)",
                  color: "var(--text-muted)",
                }}
              >
                Knee Laterality
              </label>
              <Segmented<Side>
                label="Knee side"
                value={side}
                onChange={(val) => setSide(val)}
                options={[
                  { value: "right", label: "Right knee" },
                  { value: "left", label: "Left knee" },
                ]}
              />
            </div>

            <div>
              <Select
                label="Difficulty Level"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </Select>
            </div>

            <div>
              <Select
                label="Pathology Type"
                value={pathology}
                onChange={(e) => setPathology(e.target.value)}
                required
              >
                <option value="osteoarthritis">Osteoarthritis (OA)</option>
                <option value="rheumatoid">Rheumatoid Arthritis</option>
                <option value="post_traumatic">Post-Traumatic Deformity</option>
                <option value="revision">Revision TKA</option>
              </Select>
            </div>

            <div className={s.fullWidth}>
              <Input
                label="Pathology Diagnosis Label"
                value={pathologyLabel}
                onChange={(e) => setPathologyLabel(e.target.value)}
                placeholder="e.g. Tricompartmental Osteoarthritis with Severe Varus Deformity"
                required
              />
            </div>

            <div className={s.fullWidth}>
              <Textarea
                label="Clinical Summary / Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive description of the patient history, functional limitations, and surgical indications..."
                optional
              />
            </div>

            <div className={s.fullWidth}>
              <Input
                label="Primary Learning Objective"
                value={learningObjective}
                onChange={(e) => setLearningObjective(e.target.value)}
                placeholder="e.g. Master coronal alignment restoration and proximal tibial bone preservation"
                optional
              />
            </div>

            {availablePrograms.length > 0 && (
              <div className={s.fullWidth}>
                <div className={s.stackSm}>
                  <label
                    style={{
                      fontSize: "var(--t-label)",
                      fontWeight: "var(--fw-semibold)",
                      color: "var(--text-muted)",
                    }}
                  >
                    Curriculum Programs
                  </label>
                  <p
                    style={{
                      fontSize: "var(--t-caption)",
                      color: "var(--text-muted)",
                      marginTop: "-2px",
                      marginBottom: "var(--s-2)",
                    }}
                  >
                    Select which training cohorts or residency programs have
                    access to this case.
                  </p>
                  <div className={s.grid2}>
                    {availablePrograms.map((prog) => (
                      <Checkbox
                        key={prog.id}
                        label={prog.name}
                        checked={programIds.includes(prog.id)}
                        onChange={() => toggleProgram(prog.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* STEP 2: Patient & Clinical Scenario */}
      {currentStep === 2 && (
        <Card padding="lg">
          <CardHeader
            title="Step 2: Patient & Clinical Scenario"
            subtitle="Configure synthetic patient demographics, baseline physiological data, and modular learning objectives."
          />
          <div className={s.stackLg}>
            <div className={s.grid3}>
              <Input
                label="Patient Age"
                type="number"
                value={patientAge}
                onChange={(e) => setPatientAge(Number(e.target.value))}
                trailing="yrs"
                required
              />
              <Select
                label="Gender"
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
              <Input
                label="Body Mass Index (BMI)"
                type="number"
                step="0.1"
                value={patientBmi}
                onChange={(e) => setPatientBmi(Number(e.target.value))}
                trailing="kg/m²"
                required
              />
            </div>

            <div className={s.grid2}>
              <Textarea
                label="Medical History & Conservative Therapy"
                value={patientHistory}
                onChange={(e) => setPatientHistory(e.target.value)}
                helper="Previous treatments, comorbidities, surgical history, or physical therapy timeline."
              />
              <Textarea
                label="Clinical Examination Notes"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                helper="Range of motion, deformity correctability, ligamentous stability, and neurovascular exam."
              />
            </div>

            <div className={s.stackSm}>
              <label
                style={{
                  fontSize: "var(--t-label)",
                  fontWeight: "var(--fw-semibold)",
                  color: "var(--text-muted)",
                }}
              >
                Case-Specific Learning Objectives
              </label>
              <p
                style={{
                  fontSize: "var(--t-caption)",
                  color: "var(--text-muted)",
                  marginTop: "-2px",
                }}
              >
                Explicit competency targets presented to the learner during
                pre-operative planning.
              </p>

              <div className={s.objectivesList}>
                {objectives.map((obj, i) => (
                  <div key={i} className={s.objectiveItem}>
                    <span className={s.objectiveText}>{obj}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Trash2}
                      aria-label="Remove objective"
                      onClick={() => handleRemoveObjective(i)}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: "var(--s-3)" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Add objective"
                    placeholder="e.g. Identify posterior femoral condylar offset and match posterior slope"
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddObjective();
                      }
                    }}
                  />
                </div>
                <div style={{ alignSelf: "flex-end", paddingBottom: "2px" }}>
                  <Button
                    variant="secondary"
                    icon={Plus}
                    onClick={handleAddObjective}
                    disabled={!newObjective.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* STEP 3: Imaging & Calibration */}
      {currentStep === 3 && (
        <Card padding="lg">
          <CardHeader
            title="Step 3: Imaging & Calibration"
            subtitle="Full-length standing AP (FLAP) and Knee Lateral (KLAT) radiograph manifests with 25.0 mm spherical radio-opaque marker calibration."
          />
          <div className={s.imagingGrid}>
            {/* FLAP Radiograph */}
            <Card tone="sunken" padding="md">
              <CardHeader
                title="FLAP"
                subtitle="Full-Length Standing AP Radiograph"
                action={
                  <Badge status={isFlapValid ? "pass" : "warn"}>
                    {isFlapValid ? "Calibrated" : "Calibration invalid"}
                  </Badge>
                }
              />
              <div className={s.stack}>
                <div className={s.previewFrame}>
                  {flapStoragePath ? (
                    <img
                      src={`/cases/synth/${side === "right" ? "synth_varus_flap.jpg" : "synth_valgus_flap.jpg"}`}
                      alt="FLAP preview"
                      className={s.previewImg}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageIcon
                      width={36}
                      height={36}
                      color="var(--text-disabled)"
                    />
                  )}
                </div>

                <Input
                  label="Storage Path / Asset Reference"
                  value={flapStoragePath}
                  onChange={(e) => setFlapStoragePath(e.target.value)}
                  helper="Relative path in Supabase Storage 'imaging' bucket."
                  required
                />

                <div className={s.calibrationMeta}>
                  <Input
                    label="Detected 25mm Marker Diameter"
                    type="number"
                    step="0.1"
                    value={flapPixelDia}
                    onChange={(e) => setFlapPixelDia(Number(e.target.value))}
                    trailing="px"
                    required
                  />

                  <div className={s.calibrationBadgeRow}>
                    <span style={{ color: "var(--text-muted)" }}>
                      Derived Scale (25mm / {flapPixelDia}px):
                    </span>
                    <Badge status={isFlapValid ? "pass" : "warn"}>
                      {flapScale} mm/px
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* KLAT Radiograph */}
            <Card tone="sunken" padding="md">
              <CardHeader
                title="KLAT"
                subtitle="Knee Lateral Radiograph"
                action={
                  <Badge status={isKlatValid ? "pass" : "warn"}>
                    {isKlatValid ? "Calibrated" : "Calibration invalid"}
                  </Badge>
                }
              />
              <div className={s.stack}>
                <div className={s.previewFrame}>
                  {klatStoragePath ? (
                    <img
                      src={`/cases/synth/${side === "right" ? "synth_varus_klat.jpg" : "synth_valgus_klat.jpg"}`}
                      alt="KLAT preview"
                      className={s.previewImg}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageIcon
                      width={36}
                      height={36}
                      color="var(--text-disabled)"
                    />
                  )}
                </div>

                <Input
                  label="Storage Path / Asset Reference"
                  value={klatStoragePath}
                  onChange={(e) => setKlatStoragePath(e.target.value)}
                  helper="Relative path in Supabase Storage 'imaging' bucket."
                  required
                />

                <div className={s.calibrationMeta}>
                  <Input
                    label="Detected 25mm Marker Diameter"
                    type="number"
                    step="0.1"
                    value={klatPixelDia}
                    onChange={(e) => setKlatPixelDia(Number(e.target.value))}
                    trailing="px"
                    required
                  />

                  <div className={s.calibrationBadgeRow}>
                    <span style={{ color: "var(--text-muted)" }}>
                      Derived Scale (25mm / {klatPixelDia}px):
                    </span>
                    <Badge status={isKlatValid ? "pass" : "warn"}>
                      {klatScale} mm/px
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Card>
      )}

      {/* STEP 4: Reference Plan / Assessment Key (Instructor-Only) */}
      {currentStep === 4 && (
        <Card padding="lg">
          <CardHeader
            title="Step 4: Clinical Reference Plan / Assessment Key"
            subtitle="Protected Instructor Configuration — Establish authoritative ground truth angles, CAD implant templates, and scoring rubrics."
          />
          <div className={s.stackLg}>
            <Banner tone="info" title="Protected Faculty Reference Configuration">
              Reference targets, component positioning, and tolerance limits are
              faculty ground truth. Learners plan on unannotated radiographs and
              are assessed objectively against these canonical values.
            </Banner>

            {/* 6 Canonical Measurements */}
            <Card tone="sunken" padding="md">
              <CardHeader
                title="6 Canonical Reference Measurements"
                subtitle="Authoritative mechanical and anatomical targets for coronal and sagittal alignment."
                action={
                  <Badge status="pass">
                    Alignment: {alignmentType}
                  </Badge>
                }
              />
              <div className={s.grid3}>
                <Input
                  label="MAD (Mechanical Axis Deviation)"
                  type="number"
                  step="0.5"
                  value={madMm}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMadMm(val);
                    setAlignmentType(
                      side === "right" && val > 0 ? "VARUS" : "VALGUS"
                    );
                  }}
                  trailing="mm"
                  required
                />
                <Input
                  label="AMA (Anatomical-Mechanical Angle)"
                  type="number"
                  step="0.1"
                  value={amaDeg}
                  onChange={(e) => setAmaDeg(Number(e.target.value))}
                  trailing="°"
                  required
                />
                <Input
                  label="mHKA (Mechanical Hip-Knee-Ankle)"
                  type="number"
                  step="0.5"
                  value={mhkaDeg}
                  onChange={(e) => setMhkaDeg(Number(e.target.value))}
                  trailing="°"
                  required
                />
                <Input
                  label="MPTA (Medial Proximal Tibial Angle)"
                  type="number"
                  step="0.5"
                  value={mptaDeg}
                  onChange={(e) => setMptaDeg(Number(e.target.value))}
                  trailing="°"
                  required
                />
                <Input
                  label="LDFA (Lateral Distal Femoral Angle)"
                  type="number"
                  step="0.5"
                  value={ldfaDeg}
                  onChange={(e) => setLdfaDeg(Number(e.target.value))}
                  trailing="°"
                  required
                />
                <Input
                  label="PTS (Posterior Tibial Slope)"
                  type="number"
                  step="0.5"
                  value={ptsDeg}
                  onChange={(e) => setPtsDeg(Number(e.target.value))}
                  trailing="°"
                  required
                />
              </div>
            </Card>

            {/* CAD Implant Sizing & Real-time Fit */}
            <div className={s.grid2}>
              {/* Tibial Component */}
              <Card tone="sunken" padding="md">
                <CardHeader
                  title="Tibial Baseplate Template"
                  subtitle="Implant size and 2D coronal positioning."
                  action={
                    <Badge
                      status={
                        tibialFit.fitStatus === "ACCEPTABLE FIT"
                          ? "pass"
                          : tibialFit.fitStatus === "CAUTION: Overhang > 1.5mm"
                            ? "warn"
                            : "fail"
                      }
                    >
                      {tibialFit.fitStatus}
                    </Badge>
                  }
                />
                <div className={s.stack}>
                  <Select
                    label="Tibial Size"
                    value={tibialSize}
                    onChange={(e) => setTibialSize(Number(e.target.value))}
                  >
                    {TIBIAL_TEMPLATES.map((t) => (
                      <option key={t.size} value={t.size}>
                        {t.label}
                      </option>
                    ))}
                  </Select>

                  <div className={s.grid3}>
                    <Input
                      label="X Offset"
                      type="number"
                      step="0.1"
                      value={tibialX}
                      onChange={(e) => setTibialX(Number(e.target.value))}
                      trailing="mm"
                    />
                    <Input
                      label="Y Offset"
                      type="number"
                      step="0.1"
                      value={tibialY}
                      onChange={(e) => setTibialY(Number(e.target.value))}
                      trailing="mm"
                    />
                    <Input
                      label="Rotation"
                      type="number"
                      step="0.5"
                      value={tibialRot}
                      onChange={(e) => setTibialRot(Number(e.target.value))}
                      trailing="°"
                    />
                  </div>

                  <div className={s.fitStats}>
                    <div className={s.fitStatItem}>
                      <span className={s.fitStatLabel}>Resection Coverage</span>
                      <span className={s.fitStatValue}>
                        {tibialFit.coveragePct.toFixed(1)}% (Target ≥ 90%)
                      </span>
                    </div>
                    <div className={s.fitStatItem}>
                      <span className={s.fitStatLabel}>Cortical Overhang</span>
                      <span className={s.fitStatValue}>
                        Medial {tibialFit.medialOverhangMm}mm / Lat {tibialFit.lateralOverhangMm}mm
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Femoral Component */}
              <Card tone="sunken" padding="md">
                <CardHeader
                  title="Femoral Component Template"
                  subtitle="Implant size and 2D sagittal positioning."
                  action={
                    <Badge
                      status={
                        femoralFit.fitStatus === "ACCEPTABLE FIT"
                          ? "pass"
                          : femoralFit.fitStatus === "CAUTION: Anterior Notch Risk"
                            ? "warn"
                            : "fail"
                      }
                    >
                      {femoralFit.fitStatus}
                    </Badge>
                  }
                />
                <div className={s.stack}>
                  <Select
                    label="Femoral Size"
                    value={femoralSize}
                    onChange={(e) => setFemoralSize(Number(e.target.value))}
                  >
                    {FEMORAL_TEMPLATES.map((f) => (
                      <option key={f.size} value={f.size}>
                        {f.label}
                      </option>
                    ))}
                  </Select>

                  <div className={s.grid3}>
                    <Input
                      label="X Offset"
                      type="number"
                      step="0.1"
                      value={femoralX}
                      onChange={(e) => setFemoralX(Number(e.target.value))}
                      trailing="mm"
                    />
                    <Input
                      label="Y Offset"
                      type="number"
                      step="0.1"
                      value={femoralY}
                      onChange={(e) => setFemoralY(Number(e.target.value))}
                      trailing="mm"
                    />
                    <Input
                      label="Flexion"
                      type="number"
                      step="0.5"
                      value={femoralRot}
                      onChange={(e) => setFemoralRot(Number(e.target.value))}
                      trailing="°"
                    />
                  </div>

                  <div className={s.fitStats}>
                    <div className={s.fitStatItem}>
                      <span className={s.fitStatLabel}>AP / ML Coverage</span>
                      <span className={s.fitStatValue}>
                        AP {femoralFit.apCoveragePct}% · ML {femoralFit.mlCoveragePct}%
                      </span>
                    </div>
                    <div className={s.fitStatItem}>
                      <span className={s.fitStatLabel}>Cortical Notching</span>
                      <span className={s.fitStatValue}>
                        {femoralFit.notchingRiskMm > 0 ? `${femoralFit.notchingRiskMm} mm Notch Risk` : "Zero Notching"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Assessment Rubric Table */}
            <div>
              <p
                style={{
                  fontSize: "var(--t-label)",
                  fontWeight: "var(--fw-semibold)",
                  color: "var(--ink)",
                  marginBottom: "var(--s-2)",
                }}
              >
                Canonical Assessment Rubric &amp; Tolerances
              </p>
              <Table label="Assessment Rubric Tolerances">
                <THead>
                  <Tr>
                    <Th>Parameter</Th>
                    <Th>Target Value</Th>
                    <Th>Acceptable Tolerance</Th>
                    <Th>Minor Error</Th>
                    <Th>Major Error</Th>
                    <Th>Critical Violation</Th>
                  </Tr>
                </THead>
                <TBody>
                  <Tr>
                    <Td head>Mechanical Axis Deviation (MAD)</Td>
                    <Td>{madMm} mm</Td>
                    <Td>± 2.0 mm</Td>
                    <Td>&gt; 2.0 mm</Td>
                    <Td>&gt; 4.0 mm</Td>
                    <Td>&gt; 6.0 mm</Td>
                  </Tr>
                  <Tr>
                    <Td head>Mechanical HKA Angle (mHKA)</Td>
                    <Td>{mhkaDeg}°</Td>
                    <Td>± 1.5°</Td>
                    <Td>&gt; 1.5°</Td>
                    <Td>&gt; 3.0°</Td>
                    <Td>&gt; 5.0°</Td>
                  </Tr>
                  <Tr>
                    <Td head>Medial Proximal Tibial Angle (MPTA)</Td>
                    <Td>{mptaDeg}°</Td>
                    <Td>± 2.0°</Td>
                    <Td>&gt; 2.0°</Td>
                    <Td>&gt; 3.5°</Td>
                    <Td>&gt; 5.0°</Td>
                  </Tr>
                  <Tr>
                    <Td head>Lateral Distal Femoral Angle (LDFA)</Td>
                    <Td>{ldfaDeg}°</Td>
                    <Td>± 2.0°</Td>
                    <Td>&gt; 2.0°</Td>
                    <Td>&gt; 3.5°</Td>
                    <Td>&gt; 5.0°</Td>
                  </Tr>
                </TBody>
              </Table>
            </div>

            <Textarea
              label="Instructor Surgical & Assessment Notes"
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              helper="Guidance shown to faculty during review of student operative plans and simulation sessions."
            />
          </div>
        </Card>
      )}

      {/* STEP 5: Review, Validate & Publish */}
      {currentStep === 5 && (
        <Card padding="lg">
          <CardHeader
            title="Step 5: Review, Validate &amp; Publish"
            subtitle="Run canonical pre-flight validation checks across clinical metadata, imaging calibrations, reference plans, and curriculum scoping."
          />
          <div className={s.stackLg}>
            <div className={s.checklist}>
              {checklist.map((item) => (
                <div key={item.id} className={s.checklistItem}>
                  <div className={s.checklistLeft}>
                    {item.ok ? (
                      <Check
                        className={s.checklistIconPass}
                        width={20}
                        height={20}
                        strokeWidth={2.5}
                      />
                    ) : (
                      <TriangleAlert
                        className={s.checklistIconWarn}
                        width={20}
                        height={20}
                        strokeWidth={2}
                      />
                    )}
                    <div>
                      <div className={s.checklistTitle}>{item.label}</div>
                      <div className={s.checklistDetail}>{item.detail}</div>
                    </div>
                  </div>
                  <Badge status={item.ok ? "pass" : "warn"}>
                    {item.ok ? "Verified" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>

            {isPublishable ? (
              <Banner tone="pass" title="Case Ready for Publication">
                All six mandatory clinical pre-flight checks are satisfied.
                Publishing this version creates an immutable clinical record
                accessible to enrolled cohorts.
              </Banner>
            ) : (
              <Banner tone="warn" title="Pre-flight Action Required">
                Resolve pending checklist items in previous steps before
                publishing this case version. You can still save a draft.
              </Banner>
            )}
          </div>
        </Card>
      )}

      {/* Wizard Footer Controls: Standard MediVeR Button Hierarchy */}
      <div className={s.actionFooter}>
        <Button
          variant="secondary"
          icon={ChevronLeft}
          disabled={currentStep === 1 || isSubmitting}
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
        >
          Back
        </Button>

        <div className={s.actionGroup}>
          <Button
            variant="secondary"
            icon={Save}
            loading={isSubmitting}
            onClick={handleSaveDraft}
          >
            Save Draft
          </Button>

          <Button
            variant="secondary"
            icon={Eye}
            onClick={() => setShowLearnerPreview(true)}
          >
            Preview as Learner
          </Button>

          {currentStep < 5 ? (
            <Button
              variant="primary"
              trailingIcon={ChevronRight}
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              icon={Send}
              loading={isSubmitting}
              disabled={!isPublishable}
              onClick={handlePublish}
            >
              Publish Case Version
            </Button>
          )}
        </div>
      </div>

      {/* Learner Preview Modal: Light Clinical SaaS Surface */}
      {showLearnerPreview && (
        <div
          className={s.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-label="Learner View Preview"
        >
          <div className={s.modalContent}>
            <div className={s.modalHeader}>
              <div>
                <h3 className={s.modalTitle}>{name || "Untitled Case"}</h3>
                <p
                  style={{
                    fontSize: "var(--t-caption)",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                  }}
                >
                  Learner Preview · {side.toUpperCase()} Knee ·{" "}
                  {difficulty.toUpperCase()} · Reference data is protected
                </p>
              </div>
              <button
                type="button"
                className={s.modalClose}
                aria-label="Close Preview"
                onClick={() => setShowLearnerPreview(false)}
              >
                <X width={18} height={18} strokeWidth={2} />
              </button>
            </div>

            <div className={s.stack}>
              <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
                <Chip tone="muted">{pathologyLabel}</Chip>
                <Chip tone="muted">{side.toUpperCase()} Knee</Chip>
                <Chip tone="muted">{difficulty.toUpperCase()}</Chip>
                <Chip tone="muted">Synthetic Patient</Chip>
              </div>

              <Card tone="sunken" padding="sm">
                <CardHeader title="Patient Profile" />
                <div className={s.grid3}>
                  <div>
                    <span style={{ fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
                      Age
                    </span>
                    <div style={{ fontWeight: "var(--fw-semibold)" }}>{patientAge} years</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
                      Gender
                    </span>
                    <div style={{ fontWeight: "var(--fw-semibold)" }}>{patientGender}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: "var(--t-caption)", color: "var(--text-muted)" }}>
                      BMI
                    </span>
                    <div style={{ fontWeight: "var(--fw-semibold)" }}>{patientBmi} kg/m²</div>
                  </div>
                </div>
              </Card>

              {objectives.length > 0 && (
                <div>
                  <h4
                    style={{
                      fontSize: "var(--t-label)",
                      fontWeight: "var(--fw-semibold)",
                      color: "var(--ink)",
                      marginBottom: "var(--s-2)",
                    }}
                  >
                    Learning Objectives
                  </h4>
                  <ul
                    style={{
                      listStyleType: "disc",
                      paddingLeft: "var(--s-5)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "var(--s-1)",
                      fontSize: "var(--t-body)",
                      color: "var(--text)",
                    }}
                  >
                    {objectives.map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={s.imagingGrid}>
                <Card tone="sunken" padding="sm">
                  <CardHeader title="FLAP Radiograph" subtitle="Unannotated full-leg view" />
                  <div className={s.previewFrame}>
                    <img
                      src={`/cases/synth/${side === "right" ? "synth_varus_flap.jpg" : "synth_valgus_flap.jpg"}`}
                      alt="FLAP Learner Preview"
                      className={s.previewImg}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </Card>

                <Card tone="sunken" padding="sm">
                  <CardHeader title="KLAT Radiograph" subtitle="Unannotated lateral view" />
                  <div className={s.previewFrame}>
                    <img
                      src={`/cases/synth/${side === "right" ? "synth_varus_klat.jpg" : "synth_valgus_klat.jpg"}`}
                      alt="KLAT Learner Preview"
                      className={s.previewImg}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </Card>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--s-4)" }}>
                <Button variant="secondary" onClick={() => setShowLearnerPreview(false)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
