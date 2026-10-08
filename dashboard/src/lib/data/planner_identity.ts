/**
 * The patient identity the planner shows in its persistent header and writes to the VR payload.
 *
 * V1 (PDF p.1-2) says the identity comes from DICOM metadata and is "hard-coded for V1": it is read-only
 * and supplied by the case, never typed into the planner. This module only READS what the case holds.
 * It never invents an age or a sex, and never picks an identity from a case's name.
 */

export type PatientField = { label: string; value: string };

/**
 * The two synthetic demo cases carry the identities used as examples in the V1 PDF. They are fixtures:
 * the header and the payload show them as such.
 */
const SYNTHETIC_FIXTURE_IDS: Record<string, string> = {
  "SYNTH-VARUS-001": "P-0247",
  "SYNTH-VALGUS-001": "P-0891",
};

export type PatientIdentity = {
  patientId: string;
  /** Where the id came from, so the UI can be honest about it. */
  patientIdSource: "case record" | "synthetic fixture" | "case id";
  age?: string;
  sex?: string;
};

const find = (fields: PatientField[], ...labels: string[]) =>
  fields.find((f) => labels.includes(f.label.trim().toLowerCase()))?.value?.trim() || undefined;

export function resolvePatientIdentity(caseId: string, patient: PatientField[] | undefined): PatientIdentity {
  const fields = patient ?? [];
  const recorded = find(fields, "patient id", "patient_id");
  const age = find(fields, "age");
  const sex = find(fields, "sex", "gender");

  if (recorded) return { patientId: recorded, patientIdSource: "case record", age, sex };
  const fixture = SYNTHETIC_FIXTURE_IDS[caseId];
  if (fixture) return { patientId: fixture, patientIdSource: "synthetic fixture", age, sex };
  return { patientId: caseId, patientIdSource: "case id", age, sex };
}
