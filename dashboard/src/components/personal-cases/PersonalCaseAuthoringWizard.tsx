"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  TriangleAlert,
  Save,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import type { Difficulty, Side } from "@/lib/types";
import {
  createPersonalCaseAction,
  updatePersonalCaseAction,
  uploadPersonalRadiographAction,
} from "@/app/actions/personal-cases";
import { uploadAssetAction } from "@/app/actions/cases"; // Reusing asset uploader for the file itself
import dicomParser from "dicom-parser";
import dynamic from "next/dynamic";
const DicomViewer = dynamic(() => import("@/components/cases/DicomViewer"), { ssr: false });
import {
  Badge,
  Banner,
  Button,
  Card,
  CardHeader,
  Input,
  Segmented,
  Select,
  Stepper,
  Textarea,
} from "@/components/ui";
import s from "@/components/cases/wizard.module.css";

export type PersonalWizardProps = {
  initialCase?: any;
};

export function PersonalCaseAuthoringWizard({
  initialCase,
}: PersonalWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Case Information State
  const [title, setTitle] = useState<string>(initialCase?.title || "");
  const [side, setSide] = useState<Side>(
    ((initialCase?.side || "right").toLowerCase() as Side)
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (initialCase?.difficulty || "intermediate").toLowerCase() as Difficulty
  );
  const [pathology, setPathology] = useState<string>(
    initialCase?.pathology || "osteoarthritis"
  );
  const [pathologyLabel, setPathologyLabel] = useState<string>(
    initialCase?.pathology_label || "Tricompartmental Osteoarthritis with Severe Varus Deformity"
  );
  const [description, setDescription] = useState<string>(
    initialCase?.description || ""
  );

  const [objectives, setObjectives] = useState<string[]>(
    initialCase?.objectives?.length
      ? initialCase.objectives
      : [
          "Accurately calculate Mechanical Axis Deviation (MAD) and mHKA from full-leg radiograph.",
        ]
  );
  const [newObjective, setNewObjective] = useState<string>("");

  // Step 2: Patient & Clinical Scenario State
  const patient = initialCase?.patient || {};
  const [patientId, setPatientId] = useState<string>(patient.patient_id || "PT-10293");
  const [patientAge, setPatientAge] = useState<number>(patient.age || 68);
  const [patientGender, setPatientGender] = useState<string>(patient.gender || "Male");
  const [patientBmi, setPatientBmi] = useState<number>(patient.bmi || 29.4);
  const [occupation, setOccupation] = useState<string>(patient.occupation || "Retired Teacher");
  const [activityLevel, setActivityLevel] = useState<string>(patient.activity_level || "Sedentary");
  const [walkingDistance, setWalkingDistance] = useState<number>(patient.walking_distance_m || 500);
  const [fixedFlexion, setFixedFlexion] = useState<number>(patient.fixed_flexion_deg || 5);
  const [rangeOfMotion, setRangeOfMotion] = useState<string>(patient.range_of_motion || "5-100");
  const [deformity, setDeformity] = useState<string>(patient.deformity || "15 varus");
  const [clinicalNotes, setClinicalNotes] = useState<string>(
    patient.clinical_notes || "Severe medial compartment pain, fixed flexion contracture 5°."
  );
  const [patientHistory, setPatientHistory] = useState<string>(
    patient.history || "Progressive right knee pain over 6 years. Failed conservative therapy."
  );

  // Step 3: Imaging & Calibration State
  const [images, setImages] = useState<any[]>(
    initialCase?.imaging?.length ? initialCase.imaging : [
      {
        id: crypto.randomUUID(),
        view_type: "FLAP",
        label: "Full Leg Anteroposterior (FLAP)",
        storage_path: "",
        is_required: true,
        calibration: {
          is_required: true,
          detected_marker_pixel_diameter: 0,
          physical_marker_diameter_mm: 25.0
        }
      },
      {
        id: crypto.randomUUID(),
        view_type: "KLAT",
        label: "Knee Lateral (KLAT)",
        storage_path: "",
        is_required: true,
        calibration: {
          is_required: true,
          detected_marker_pixel_diameter: 0,
          physical_marker_diameter_mm: 25.0
        }
      }
    ]
  );

  const calibratedImages = useMemo(() => {
    return images.filter(img => img.calibration?.is_required).map(img => {
      const pix = img.calibration?.detected_marker_pixel_diameter || 0;
      const scale = pix > 0 ? Number((25.0 / pix).toFixed(4)) : 0;
      const valid = scale >= 0.05 && scale <= 1.5;
      return { ...img, scale, valid };
    });
  }, [images]);

  const allCalibrationsValid = calibratedImages.length > 0 ? calibratedImages.every(img => img.valid) : true;

  // Pre-flight Checklist Items
  const checklist = useMemo(() => {
    return [
      {
        id: "metadata",
        label: "Case Information & Scenario Complete",
        ok: title.trim().length > 0 && !!side && !!pathology,
        detail: title
          ? `${title} (${side.toUpperCase()}, ${difficulty})`
          : "Case title is required",
      },
      {
        id: "imaging",
        label: "Image Assets Attached",
        ok: images.some(i => i.storage_path?.trim()),
        detail: `${images.filter(i => i.storage_path?.trim()).length} image(s) configured`,
      },
      {
        id: "calibration",
        label: "Radio-Opaque Marker Calibration Verified",
        ok: allCalibrationsValid,
        detail: calibratedImages.length > 0 ? `${calibratedImages.filter(i=>i.valid).length} of ${calibratedImages.length} calibrations valid` : 'No calibrations required',
      },
    ];
  }, [
    title,
    side,
    difficulty,
    pathology,
    images,
    calibratedImages,
    allCalibrationsValid,
  ]);

  const isPublishable = checklist.every((c) => c.ok);

  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploadingImageId(images[index].id);

      let detectedPixelDiameter = 0;
      if (file.name.toLowerCase().endsWith(".dcim") || file.name.toLowerCase().endsWith(".dcm")) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const byteArray = new Uint8Array(arrayBuffer);
          const dataSet = dicomParser.parseDicom(byteArray);
          
          const pixelSpacingStr = dataSet.string('x00280030') || dataSet.string('x00280100');
          if (pixelSpacingStr) {
            const spacing = parseFloat(pixelSpacingStr.split('\\')[0]);
            if (spacing > 0) {
              detectedPixelDiameter = Number((25.0 / spacing).toFixed(1));
            }
          }
        } catch (parseErr) {
          console.warn("Failed to parse DICOM metadata", parseErr);
        }
      }

      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadAssetAction(formData);
      if (res.success && res.data?.storage_path) {
        const newImgs = [...images];
        newImgs[index].storage_path = res.data.storage_path;
        if (detectedPixelDiameter > 0) {
          if (!newImgs[index].calibration) {
            newImgs[index].calibration = { is_required: true, physical_marker_diameter_mm: 25.0, detected_marker_pixel_diameter: 0 };
          }
          newImgs[index].calibration.detected_marker_pixel_diameter = detectedPixelDiameter;
          newImgs[index].calibration.is_required = true;
        }
        setImages(newImgs);
      } else {
        alert("Failed to upload image: " + (res.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
    } finally {
      setUploadingImageId(null);
    }
  };

  const handleAddObjective = () => {
    if (!newObjective.trim()) return;
    setObjectives((prev) => [...prev, newObjective.trim()]);
    setNewObjective("");
  };

  const handleRemoveObjective = (index: number) => {
    setObjectives((prev) => prev.filter((_, i) => i !== index));
  };

  const buildPayload = () => {
    return {
      title,
      difficulty,
      description,
      side,
      pathology,
      pathology_label: pathologyLabel,
      patient: {
        patient_id: patientId,
        age: Number(patientAge),
        gender: patientGender,
        bmi: Number(patientBmi),
        occupation,
        activity_level: activityLevel,
        walking_distance_m: Number(walkingDistance),
        fixed_flexion_deg: Number(fixedFlexion),
        range_of_motion: rangeOfMotion,
        deformity,
        clinical_notes: clinicalNotes,
        history: patientHistory,
      },
      objectives,
      imaging: images.map(img => {
        let calcScale = 0;
        let isValid = false;
        if (img.calibration?.is_required) {
          const pix = img.calibration.detected_marker_pixel_diameter || 0;
          calcScale = pix > 0 ? Number((25.0 / pix).toFixed(4)) : 0;
          isValid = calcScale >= 0.05 && calcScale <= 1.5;
        }
        return {
          ...img,
          laterality: side,
          calibration: img.calibration?.is_required ? {
            ...img.calibration,
            marker_type: "sphere_25mm",
            calculated_scale_mm_per_px: calcScale,
            unit: "mm/px",
            is_valid: isValid,
          } : undefined
        };
      }),
    };
  };

  const handleSave = async () => {
    if (!isPublishable) {
      setErrorMessage(
        "Please complete all checklist items before saving."
      );
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const payload = buildPayload();
      let res;
      if (initialCase?.id) {
        res = await updatePersonalCaseAction(initialCase.id, payload);
      } else {
        res = await createPersonalCaseAction(payload);
      }
      if (res.success && res.data) {
        router.push(`/personal-cases/${res.data.id}`);
      } else {
        setErrorMessage(res.error || "Save failed.");
      }
    } catch (e: any) {
      setErrorMessage(e.message || "Failed to save personal case.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={s.wizardContainer}>
      <div className={s.stepperCard}>
        <Stepper
          orientation="horizontal"
          label="Personal case steps"
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
              label: "4. Review & Save",
              state:
                currentStep === 4
                  ? "current"
                  : currentStep > 4
                    ? "done"
                    : "upcoming",
            },
          ]}
        />
      </div>

      {currentStep < 4 && (
        <details
          style={{
            border: "var(--bw) solid var(--border)",
            borderRadius: "var(--r-md)",
            background: "var(--surface)",
            padding: "var(--s-3) var(--s-4)",
          }}
        >
          <summary style={{ cursor: "pointer", fontWeight: "var(--fw-semibold)", color: "var(--ink)" }}>
            Ready to save: {checklist.filter((c) => c.ok).length} of {checklist.length} checks
            {isPublishable ? " (all done)" : ""}
          </summary>
          <ul style={{ listStyle: "none", margin: "var(--s-3) 0 0", padding: 0, display: "grid", gap: "var(--s-2)" }}>
            {checklist.map((c) => (
              <li key={c.id} style={{ fontSize: "var(--t-label)", color: "var(--text)" }}>
                <strong style={{ color: c.ok ? "var(--pass)" : "var(--warn)" }}>
                  {c.ok ? "Done" : "Pending"}
                </strong>
                {" · "}
                {c.label}
                {!c.ok && c.detail ? ` — ${c.detail}` : ""}
              </li>
            ))}
          </ul>
        </details>
      )}

      {errorMessage && (
        <Banner
          tone="fail"
          title="Action required"
          onDismiss={() => setErrorMessage(null)}
        >
          {errorMessage}
        </Banner>
      )}

      {currentStep === 1 && (
        <Card padding="lg">
          <CardHeader
            title="Step 1: Case Information"
            subtitle="Define surgical procedure context, title, pathology classification, and objectives."
          />
          <div className={s.formGrid}>
            <div className={s.fullWidth}>
              <Input
                label="Case Title"
                placeholder="e.g. Varus Gonarthrosis with Fixed Flexion Contracture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                helper="Specific, descriptive title displayed in your personal cases."
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
                <option value="expert">Expert</option>
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
              <label
                style={{
                  fontSize: "var(--t-label)",
                  fontWeight: "var(--fw-semibold)",
                  color: "var(--text-muted)",
                  marginBottom: "0.5rem",
                  display: "block",
                }}
              >
                Learning Objectives
              </label>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 1rem 0", display: "grid", gap: "0.5rem" }}>
                {objectives.map((obj, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <div style={{ flex: 1, padding: "0.75rem", background: "var(--surface-sunken)", borderRadius: "var(--r-md)", border: "var(--bw) solid var(--border)", fontSize: "0.875rem" }}>
                      {obj}
                    </div>
                    <Button variant="danger" type="button" icon={Trash2} onClick={() => handleRemoveObjective(i)}>Remove</Button>
                  </li>
                ))}
              </ul>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Input
                  label="Add Objective"
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  placeholder="e.g. Master coronal alignment restoration"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddObjective())}
                />
                <div style={{ paddingTop: "1.5rem" }}>
                  <Button variant="secondary" icon={Plus} onClick={handleAddObjective} type="button">Add</Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {currentStep === 2 && (
        <Card padding="lg">
          <CardHeader
            title="Step 2: Patient & Clinical Scenario"
            subtitle="Define patient demographics and preoperative functional status."
          />
          <div className={s.formGrid}>
            <Input label="Patient ID / Initials" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
            <Input label="Age" type="number" value={patientAge} onChange={(e) => setPatientAge(Number(e.target.value))} />
            <Select label="Gender" value={patientGender} onChange={(e) => setPatientGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </Select>
            <Input label="BMI" type="number" step="0.1" value={patientBmi} onChange={(e) => setPatientBmi(Number(e.target.value))} />
            <Input label="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            <Select label="Activity Level" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
              <option value="Sedentary">Sedentary</option>
              <option value="Light">Light</option>
              <option value="Moderate">Moderate</option>
              <option value="Active">Active</option>
            </Select>
            <Input label="Walking Distance (m)" type="number" value={walkingDistance} onChange={(e) => setWalkingDistance(Number(e.target.value))} />
            <Input label="Fixed Flexion (deg)" type="number" value={fixedFlexion} onChange={(e) => setFixedFlexion(Number(e.target.value))} />
            <Input label="Range of Motion" value={rangeOfMotion} onChange={(e) => setRangeOfMotion(e.target.value)} />
            <Input label="Deformity Description" value={deformity} onChange={(e) => setDeformity(e.target.value)} />
            <div className={s.fullWidth}>
              <Textarea label="Clinical Notes" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} rows={3} />
            </div>
            <div className={s.fullWidth}>
              <Textarea label="Patient History" value={patientHistory} onChange={(e) => setPatientHistory(e.target.value)} rows={3} />
            </div>
          </div>
        </Card>
      )}

      {currentStep === 3 && (
        <Card padding="lg">
          <CardHeader
            title="Step 3: Imaging & Calibration"
            subtitle="Upload preoperative radiographs. Radio-opaque marker calibration will be extracted from DICOM metadata if present."
          />
          <div style={{ display: "grid", gap: "2rem" }}>
            {images.map((img, i) => (
              <div key={img.id} style={{ display: "flex", gap: "1.5rem", padding: "1.5rem", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: "var(--surface-sunken)" }}>
                <div style={{ width: "200px", height: "300px", background: "var(--surface)", borderRadius: "var(--r-md)", border: "1px dashed var(--border-hover)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                  {img.storage_path ? (
                    (() => {
                      const urlWithoutQuery = img.storage_path.split('?')[0].toLowerCase();
                      const isDicom = urlWithoutQuery.endsWith('.dcm') || urlWithoutQuery.endsWith('.dcim');
                      return isDicom ? (
                      <DicomViewer src={(img as any).signed_url || img.storage_path} alt={img.label} className="absolute inset-0" />
                    ) : (
                      <img src={(img as any).signed_url || img.storage_path} alt={img.label} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    )
                    })()
                  ) : (
                    <ImageIcon size={48} color="var(--border)" strokeWidth={1} />
                  )}
                  {uploadingImageId === img.id && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>
                      Uploading...
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--ink)" }}>{img.label}</h3>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{img.view_type} View</p>
                  </div>
                  
                  <div>
                    <input type="file" id={`file-${img.id}`} accept="image/*,.dcm,.dcim" style={{ display: "none" }} onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleImageUpload(i, e.target.files[0]);
                    }} />
                    <Button 
                      variant="secondary" 
                      disabled={uploadingImageId === img.id} 
                      onClick={() => document.getElementById(`file-${img.id}`)?.click()}
                    >
                      Select Image or DICOM
                    </Button>
                  </div>

                  <div style={{ marginTop: "auto", background: "var(--surface)", padding: "1rem", borderRadius: "var(--r-md)", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                      <h4 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Calibration Status</h4>
                      {img.storage_path && img.calibration?.detected_marker_pixel_diameter > 0 ? (
                        <Badge status="success">Calibrated</Badge>
                      ) : img.storage_path ? (
                        <Badge status="warn">Manual Needed</Badge>
                      ) : (
                        <Badge status="neutral">Pending Image</Badge>
                      )}
                    </div>
                    {img.storage_path && img.calibration?.detected_marker_pixel_diameter > 0 && (
                      <p style={{ fontSize: "0.85rem", color: "var(--text)" }}>
                        Detected 25mm marker at {img.calibration.detected_marker_pixel_diameter}px. Scale: {(25.0 / img.calibration.detected_marker_pixel_diameter).toFixed(4)} mm/px
                      </p>
                    )}
                    {img.storage_path && (!img.calibration || img.calibration.detected_marker_pixel_diameter === 0) && (
                      <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                        <Input 
                          label="Marker pixel diameter" 
                          type="number" 
                          value={img.calibration?.detected_marker_pixel_diameter || ""}
                          onChange={(e) => {
                            const newImgs = [...images];
                            if (!newImgs[i].calibration) newImgs[i].calibration = { physical_marker_diameter_mm: 25.0 };
                            newImgs[i].calibration.detected_marker_pixel_diameter = Number(e.target.value);
                            newImgs[i].calibration.is_required = true;
                            setImages(newImgs);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {currentStep === 4 && (
        <Card padding="lg">
          <CardHeader
            title="Step 4: Review & Save"
            subtitle="Final review of your personal case details."
          />
          <div className={s.reviewGrid}>
            <div className={s.reviewBlock}>
              <h4>Case Info</h4>
              <dl>
                <dt>Title</dt><dd>{title}</dd>
                <dt>Difficulty</dt><dd>{difficulty}</dd>
                <dt>Laterality</dt><dd>{side}</dd>
                <dt>Pathology</dt><dd>{pathologyLabel}</dd>
              </dl>
            </div>
            <div className={s.reviewBlock}>
              <h4>Patient</h4>
              <dl>
                <dt>Patient</dt><dd>{patientId} ({patientAge}yo {patientGender})</dd>
                <dt>BMI</dt><dd>{patientBmi}</dd>
                <dt>Deformity</dt><dd>{deformity}</dd>
                <dt>Notes</dt><dd>{clinicalNotes}</dd>
              </dl>
            </div>
            <div className={s.reviewBlock}>
              <h4>Imaging</h4>
              <dl>
                <dt>Images Configured</dt><dd>{images.filter(i => i.storage_path).length}</dd>
                <dt>Valid Calibrations</dt><dd>{calibratedImages.filter(i => i.valid).length}</dd>
              </dl>
            </div>
          </div>
          
          <div className={s.reviewBlock} style={{ marginTop: "2rem", borderTop: "1px solid var(--border)", paddingTop: "2rem" }}>
             {isPublishable ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--pass)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Check size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--ink)" }}>Ready to Save</h3>
                    <p style={{ color: "var(--text)", maxWidth: "400px" }}>Your personal case meets all requirements. Click the Save button below to add it to your Personal Space.</p>
                  </div>
                </div>
             ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--warn)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TriangleAlert size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--ink)" }}>Checks Pending</h3>
                    <p style={{ color: "var(--text)", maxWidth: "400px" }}>Please complete all checklist requirements before saving this case.</p>
                  </div>
                </div>
             )}
          </div>
        </Card>
      )}

      {/* Floating Action Bar */}
      <div className={s.floatingActions}>
        <div className={s.floatingLeft}>
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1 || isSubmitting}
            icon={ChevronLeft}
          >
            Back
          </Button>
        </div>
        <div className={s.floatingRight}>
          {currentStep === 4 ? (
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!isPublishable || isSubmitting}
              icon={Save}
            >
              {isSubmitting ? "Saving..." : "Save Personal Case"}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => setCurrentStep((s) => Math.min(4, s + 1))}
              trailingIcon={ChevronRight}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
