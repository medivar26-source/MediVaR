"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PLANS, PLAN_BY_ID, type PlanRecord } from "@/lib/data/plans";
import {
  apiCreateCase,
  apiUpdateCase,
  ContentApiError,
  type ApiDifficulty,
} from "@/lib/data/content-api";
import { getSessionToken } from "@/lib/session";


/**
 * The write surface.
 *
 * Every form on the product posts to one of these. They validate what they are
 * given and report back through the same state shapes the forms already
 * render — a control that looks live but silently discards what you typed is
 * worse than one that tells you.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/* ---------------------------------- auth --------------------------------- */

export type SignInState = { error?: string };

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const loginType = String(formData.get("loginType") ?? "instructor");
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!identifier || !password) {
    const label = loginType === "learner" ? "Learner ID" : "email address";
    return { error: `Enter your ${label} and password.` };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        login_type: loginType,
        identifier,
        password,
      }),
    });
  } catch {
    return {
      error:
        "Cannot reach the server. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    let detail = "Invalid credentials. Check both and try again.";
    try {
      const body = await response.json();
      if (body?.detail && typeof body.detail === "string") {
        detail = body.detail;
      }
    } catch {
      // Ignore parse failures — use the default message
    }
    return { error: detail };
  }

  const data = await response.json();
  const token: string = data?.access_token;
  if (!token) {
    return { error: "Unexpected response from authentication service." };
  }

  // Store the token in a secure httpOnly cookie.
  // The cookie is read by middleware for route protection and by
  // lib/session.ts for user profile resolution.
  const cookieStore = await cookies();
  cookieStore.set("mediver-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Supabase default token lifetime is 1 hour; set cookie to match.
    maxAge: 60 * 60,
  });

  redirect(next.startsWith("/") ? next : "/");
}

export async function signOut() {
  // Revoke the token on the backend (best-effort; clear cookie regardless)
  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  if (token) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore — the cookie will be cleared either way
    }
    cookieStore.delete("mediver-token");
  }

  redirect("/login");
}

/* --------------------------------- account -------------------------------- */

export type AccountState = { error?: string; savedAt?: string };

/** What every one of them says, in one place, so it is worded once. */
const NOT_PERSISTED =
  "Saving is not connected yet, so this change will not survive a reload.";

export async function saveAccount(
  _prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (displayName.length < 2) {
    return { error: "A display name needs at least two characters." };
  }

  return { error: NOT_PERSISTED };
}

import { validatePasswordChange } from "@/lib/auth-validation";

export type ChangePasswordState = {
  error?: string;
  success?: boolean;
};

export async function changePassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const validation = validatePasswordChange(currentPassword, newPassword, confirmPassword);
  if (!validation.isValid) {
    return { error: validation.error };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;
  if (!token) {
    redirect("/login");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
  } catch {
    return {
      error: "Cannot reach the server. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    let message = "Failed to change password. Please try again.";
    try {
      const data = await response.json();
      if (data?.detail && typeof data.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Ignore JSON parse failure
    }
    return { error: message };
  }

  return { success: true };
}

/* ---------------------------------- plans --------------------------------- */

export async function startPlan(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  if (!caseId) throw new Error("No case was supplied.");

  const { getCurrentUser } = await import("@/lib/session");
  const { CURRENT_USER } = await import("@/lib/seed");
  const user = await getCurrentUser();
  const userId = user?.id || CURRENT_USER.id;

  let existing = PLANS.find((plan: PlanRecord) => plan.caseId === caseId && plan.userId === userId);
  
  if (!existing) {
    existing = {
      id: crypto.randomUUID(),
      userId: userId,
      caseId: caseId,
      payload: { 
        workflow: "tkr",
        case_id: caseId,
        session_config: {
          mode: (formData.get("mode") as any) || "training",
          difficulty: (formData.get("difficulty") as any) || "intermediate",
        },
      },
      stepTimings: {},
      isReadyForVr: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    PLANS.push(existing);
    PLAN_BY_ID.set(existing.id, existing);
  }
  
  // Route directly to the new TKR Assessment Page
  redirect(`/plan/${existing.id}/assessment`);
}

export async function updatePlanPayload(
  planId: string,
  updates: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  try {
    const plan = PLAN_BY_ID.get(planId);
    if (plan) {
      plan.payload = { ...plan.payload, ...updates };
      return { success: true };
    }
    return { success: false, error: "Plan not found." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to update plan payload." };
  }
}

export type SaveState = {
  error?: string;
  savedAt?: string;
  /** The patch this call actually wrote, echoed back verbatim. */
  saved?: string;
};

export async function savePlanStep(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return { error: "This form is missing its plan." };

  return { error: NOT_PERSISTED };
}

export type SealState = { error?: string; isReadyForVr?: boolean };

export async function sealPlan(
  _prev: SealState,
  formData: FormData,
): Promise<SealState> {
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return { error: "This form is missing its plan." };

  return {
    error:
      "Sealing a plan hands it to the headset, and that pipeline is not built yet.",
  };
}

export async function sealTkrPlan(
  _prev: SealState,
  formData: FormData,
): Promise<SealState & { vrPayload?: import("@/lib/plan").V1VrPayload }> {
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return { error: "This form is missing its plan." };

  const { PLAN_BY_ID } = await import("@/lib/data/plans");
  const { CURRENT_USER } = await import("@/lib/seed");
  const plan = PLAN_BY_ID.get(planId);

  if (!plan) return { error: "Plan not found." };
  
  const v1Assessment = plan.payload.v1_assessment || {
    MAD_mm: 12.0,
    AMA_deg: 6.0,
    mHKA_deg: 7.0,
    MPTA_deg: 89.0,
    LDFA_deg: 88.0,
    PTS_deg: 7.0,
  };

  const v1Tibial = plan.payload.v1_tibial || {
    implant_size: 3,
    position_2d: { x_offset_mm: 1.2, y_offset_mm: -0.4, rotation_deg: 0.5 },
  };

  const v1Femoral = plan.payload.v1_femoral || {
    implant_size: 4,
    position_2d: { x_offset_mm: 0.5, y_offset_mm: 0.0, rotation_deg: 0.0 },
  };

  // Determine knee side
  const kneeSide: "RIGHT" | "LEFT" =
    plan.caseId.includes("VALGUS") || plan.caseId === "P-0891" ? "LEFT" : "RIGHT";

  const vrPayload: import("@/lib/plan").V1VrPayload = {
    patient_id: plan.caseId === "SYNTH-VARUS-001" ? "P-0247" : plan.caseId === "SYNTH-VALGUS-001" ? "P-0891" : plan.caseId,
    knee_side: kneeSide,
    assessment: {
      MAD_mm: v1Assessment.MAD_mm,
      AMA_deg: v1Assessment.AMA_deg,
      mHKA_deg: v1Assessment.mHKA_deg,
      MPTA_deg: v1Assessment.MPTA_deg,
      LDFA_deg: v1Assessment.LDFA_deg,
      PTS_deg: v1Assessment.PTS_deg,
    },
    tibial_component: {
      implant_size: v1Tibial.implant_size,
      position_2d: {
        x_offset_mm: v1Tibial.position_2d.x_offset_mm,
        y_offset_mm: v1Tibial.position_2d.y_offset_mm,
        rotation_deg: v1Tibial.position_2d.rotation_deg,
      },
    },
    femoral_component: {
      implant_size: v1Femoral.implant_size,
      position_2d: {
        x_offset_mm: v1Femoral.position_2d.x_offset_mm,
        y_offset_mm: v1Femoral.position_2d.y_offset_mm,
        rotation_deg: v1Femoral.position_2d.rotation_deg,
      },
    },
  };

  plan.payload.v1_vr_payload = vrPayload;
  plan.isReadyForVr = true;
  plan.lockedVersion = {
    versionId: crypto.randomUUID(),
    sealedBy: CURRENT_USER.id,
    sealedAt: new Date().toISOString(),
    payload: JSON.parse(JSON.stringify(plan.payload)),
  };

  return { isReadyForVr: true, vrPayload };
}

export type PinState = { pin?: string; expiresAt?: string; error?: string };

export async function mintPin(
  _prev: PinState,
  formData: FormData,
): Promise<PinState> {
  const planId = String(formData.get("planId") ?? "");
  if (!planId) return { error: "This form is missing its plan." };

  return {
    error:
      "A pairing PIN is minted by the headset service, which is not running yet.",
  };
}

/* --------------------------------- cohorts -------------------------------- */

export type CohortState = { error?: string; saved?: string };

export async function assignPreset(
  _prev: CohortState,
  formData: FormData,
): Promise<CohortState> {
  const cohortId = String(formData.get("cohortId") ?? "");
  if (!cohortId) return { error: "This form is missing its cohort." };

  return { error: NOT_PERSISTED };
}

export type ProgramState = { error?: string; saved?: string };

export async function createProgram(
  _prev: ProgramState,
  formData: FormData,
): Promise<ProgramState> {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (name.length < 2) {
    return { error: "Give the program a name of at least two characters." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  try {
    const res = await fetch(`${API_BASE}/programs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Failed to create program." };
    }
  } catch {
    return { error: "Failed to connect to the server." };
  }

  revalidatePath("/cohorts");
  redirect("/cohorts");
}

export async function createCohort(
  _prev: CohortState,
  formData: FormData,
): Promise<CohortState> {
  const name = String(formData.get("name") ?? "").trim();
  const program_id = String(formData.get("program_id") ?? "");

  if (name.length < 2) {
    return { error: "Give the cohort a name of at least two characters." };
  }
  if (!program_id) {
    return { error: "Program ID is missing." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  try {
    const res = await fetch(`${API_BASE}/cohorts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, program_id }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Failed to create cohort." };
    }
  } catch {
    return { error: "Failed to connect to the server." };
  }

  revalidatePath(`/cohorts/program/${program_id}`);
  revalidatePath("/cohorts");
  redirect(`/cohorts/program/${program_id}`);
}

export type LearnerProvisionState = {
  error?: string;
  learnerId?: string;
  tempPassword?: string;
  success?: boolean;
};

export async function createLearner(
  _prev: LearnerProvisionState,
  formData: FormData,
): Promise<LearnerProvisionState> {
  const cohortId = String(formData.get("cohortId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!cohortId || !firstName || !lastName) {
    return { error: "All fields are required." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  try {
    const res = await fetch(`${API_BASE}/cohorts/${cohortId}/learners/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, role: "resident" }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.detail || "Failed to create learner." };
    }
    return { 
      success: true, 
      learnerId: data.learner_id, 
      tempPassword: data.temporary_password 
    };
  } catch {
    return { error: "Connection error." };
  }
}

export async function addExistingLearner(
  _prev: LearnerProvisionState,
  formData: FormData,
): Promise<LearnerProvisionState> {
  const cohortId = String(formData.get("cohortId") ?? "");
  const learnerId = String(formData.get("learnerId") ?? "").trim();

  if (!cohortId || !learnerId) {
    return { error: "Cohort ID and Learner ID are required." };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  try {
    const res = await fetch(`${API_BASE}/cohorts/${cohortId}/learners/existing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ learner_id: learnerId }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Failed to add learner." };
    }
    return { success: true };
  } catch {
    return { error: "Connection error." };
  }
}

export async function assignCases(
  _prev: CohortState,
  formData: FormData,
): Promise<CohortState> {
  const cohortId = String(formData.get("cohortId") ?? "");
  const caseIds = formData.getAll("caseIds").map(String);

  if (!cohortId) return { error: "This form is missing its cohort." };

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  try {
    const res = await fetch(`${API_BASE}/cohorts/${cohortId}/cases`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ case_ids: caseIds }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Failed to assign cases." };
    }
  } catch {
    return { error: "Failed to connect to the server." };
  }

  revalidatePath(`/cohorts/${cohortId}`);
  return { saved: `${caseIds.length} case(s) assigned` };
}

export type SessionState = { error?: string; saved?: string };

export async function createSession(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const cohortId = String(formData.get("cohortId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  const duration = Number(formData.get("duration") ?? 0);
  const description = String(formData.get("description") ?? "").trim();

  if (!cohortId) return { error: "Cohort ID is missing." };
  if (name.length < 2) return { error: "Session name must be at least 2 characters." };
  if (!scheduledAt) return { error: "Scheduled date & time is required." };
  if (duration <= 0) return { error: "Duration must be greater than 0 minutes." };

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  try {
    const res = await fetch(`${API_BASE}/cohorts/${cohortId}/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration,
        description: description || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Failed to create session." };
    }
  } catch {
    return { error: "Failed to connect to the server." };
  }

  revalidatePath(`/cohorts/${cohortId}`);
  return { saved: "Session scheduled successfully." };
}

export async function cancelSession(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const cohortId = String(formData.get("cohortId") ?? "");

  if (!sessionId) return { error: "Session ID missing." };

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  try {
    const res = await fetch(`${API_BASE}/cohorts/sessions/${sessionId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Failed to cancel session." };
    }
  } catch {
    return { error: "Failed to connect to server." };
  }

  revalidatePath(`/cohorts/${cohortId}`);
  return { saved: "Session cancelled." };
}

export async function updateSession(
  _prev: SessionState,
  formData: FormData,
): Promise<SessionState> {
  const sessionId = String(formData.get("sessionId") ?? "");
  const cohortId = String(formData.get("cohortId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const scheduledAt = String(formData.get("scheduledAt") ?? "").trim();
  const duration = Number(formData.get("duration") ?? 0);
  const description = String(formData.get("description") ?? "").trim();

  if (!sessionId) return { error: "Session ID missing." };
  if (name.length < 2) return { error: "Session name must be at least 2 characters." };
  if (!scheduledAt) return { error: "Scheduled date & time is required." };
  if (duration <= 0) return { error: "Duration must be greater than 0 minutes." };

  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;

  try {
    const res = await fetch(`${API_BASE}/cohorts/sessions/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration,
        description: description || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Failed to update session." };
    }
  } catch {
    return { error: "Failed to connect to the server." };
  }

  revalidatePath(`/cohorts/${cohortId}`);
  return { saved: "Session updated successfully." };
}
/* ---------------------------------- cases --------------------------------- */

export type ConfigState = { error?: string; saved?: string };

export async function saveInstructorConfig(
  _prev: ConfigState,
  formData: FormData,
): Promise<ConfigState> {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return { error: "Give the preset a name of at least two characters." };
  }

  return { error: NOT_PERSISTED };
}

/* ------------------------- content / case library ------------------------- */

/**
 * Cases are persisted through the backend `/cases` API (migration 004). The
 * remaining content forms — procedure steps, assessment criteria, imaging —
 * have no table or storage behind them yet, so, like `saveAccount` and
 * `saveInstructorConfig` above, they validate for real and then report
 * plainly that nothing was saved. None of them invents a local store: an
 * in-memory "save" would look live to one instructor and vanish for the next,
 * which is worse than an honest failure.
 */
const CONTENT_NOT_PERSISTED =
  "This part of the content library is not connected to storage yet, so it was validated but not saved.";

function contentErrorMessage(err: unknown): string {
  return err instanceof ContentApiError
    ? err.message
    : "Something went wrong. Try again in a moment.";
}

export type CaseFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

function readCaseForm(formData: FormData): {
  values: {
    title: string;
    procedureId: string;
    difficulty: ApiDifficulty;
    description: string;
    learningObjective: string;
  };
  fieldErrors: Record<string, string>;
} {
  const title = String(formData.get("title") ?? "").trim();
  const procedureId = String(formData.get("procedureId") ?? "").trim();
  const difficulty = String(formData.get("difficulty") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const learningObjective = String(formData.get("learningObjective") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (title.length < 3) {
    fieldErrors.title = "Give the case a name of at least three characters.";
  }
  if (!procedureId) {
    fieldErrors.procedureId = "Choose the procedure this case belongs to.";
  }
  if (!["beginner", "intermediate", "expert"].includes(difficulty)) {
    fieldErrors.difficulty = "Choose a difficulty.";
  }
  if (learningObjective.length < 10) {
    fieldErrors.learningObjective =
      "Describe what a resident should be able to do after this case, in at least 10 characters.";
  }

  return {
    values: {
      title,
      procedureId,
      difficulty: difficulty as ApiDifficulty,
      description,
      learningObjective,
    },
    fieldErrors,
  };
}

export async function createCase(
  _prev: CaseFormState,
  formData: FormData,
): Promise<CaseFormState> {
  const { values, fieldErrors } = readCaseForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Fix the highlighted fields and try again." };
  }

  const token = await getSessionToken();
  if (!token) return { error: "Your session has expired. Sign in again." };

  let id: string;
  try {
    const created = await apiCreateCase(token, {
      name: values.title,
      procedure_id: values.procedureId,
      difficulty: values.difficulty,
      learning_objective: values.learningObjective,
      ...(values.description ? { description: values.description } : {}),
    });
    id = created.id;
  } catch (err) {
    return { error: contentErrorMessage(err) };
  }

  revalidatePath("/content");
  redirect(`/content/${id}`);
}

export async function updateCase(
  _prev: CaseFormState,
  formData: FormData,
): Promise<CaseFormState> {
  const caseId = String(formData.get("caseId") ?? "");
  if (!caseId) return { error: "This form is missing its case." };

  const { values, fieldErrors } = readCaseForm(formData);

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Fix the highlighted fields and try again." };
  }

  const token = await getSessionToken();
  if (!token) return { error: "Your session has expired. Sign in again." };

  try {
    await apiUpdateCase(token, caseId, {
      name: values.title,
      procedure_id: values.procedureId,
      difficulty: values.difficulty,
      description: values.description || null,
      learning_objective: values.learningObjective,
    });
  } catch (err) {
    return { error: contentErrorMessage(err) };
  }

  revalidatePath("/content");
  revalidatePath(`/content/${caseId}`);
  return { saved: true };
}

export type CaseStatusState = { error?: string; success?: boolean };

export async function setCaseStatus(
  _prev: CaseStatusState,
  formData: FormData,
): Promise<CaseStatusState> {
  const caseId = String(formData.get("caseId") ?? "");
  const nextStatus = String(formData.get("nextStatus") ?? "");

  if (!caseId) return { error: "This form is missing its case." };
  if (nextStatus !== "active" && nextStatus !== "inactive") {
    return { error: "Choose whether the case should be active or inactive." };
  }

  const token = await getSessionToken();
  if (!token) return { error: "Your session has expired. Sign in again." };

  try {
    await apiUpdateCase(token, caseId, { status: nextStatus });
  } catch (err) {
    return { error: contentErrorMessage(err) };
  }

  revalidatePath("/content");
  revalidatePath(`/content/${caseId}`);
  return { success: true };
}

export type ProcedureStepFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveProcedureStep(
  _prev: ProcedureStepFormState,
  formData: FormData,
): Promise<ProcedureStepFormState> {
  const procedureId = String(formData.get("procedureId") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!procedureId) fieldErrors.procedureId = "This form is missing its procedure.";
  if (name.length < 3) fieldErrors.name = "Give the step a name of at least three characters.";

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Fix the highlighted fields and try again." };
  }

  return { error: CONTENT_NOT_PERSISTED };
}

export type AssessmentCriterionFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function saveAssessmentCriterion(
  _prev: AssessmentCriterionFormState,
  formData: FormData,
): Promise<AssessmentCriterionFormState> {
  const key = String(formData.get("key") ?? "");
  const weight = String(formData.get("weight") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!key) fieldErrors.key = "This form is missing its skill.";
  const weightNum = Number(weight);
  if (!weight || Number.isNaN(weightNum) || weightNum < 0 || weightNum > 100) {
    fieldErrors.weight = "Enter a weight between 0 and 100.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Fix the highlighted fields and try again." };
  }

  return { error: CONTENT_NOT_PERSISTED };
}

export type CaseImagingFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

const IMAGING_VIEWS = ["ap", "lateral", "skyline", "long_leg", "flap", "klat"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Adds a radiograph view to a case's imaging package.
 *
 * There is no image bucket wired up yet (Supabase Storage is not
 * configured — see 06_DATABASE_SCHEMA.md/14_DEPLOYMENT_AND_OPERATIONS.md),
 * so a real upload is validated here — type, size, required fields — and
 * then, like every other content write, reported as not persisted rather
 * than accepted and silently dropped.
 */
export async function saveCaseImaging(
  _prev: CaseImagingFormState,
  formData: FormData,
): Promise<CaseImagingFormState> {
  const caseId = String(formData.get("caseId") ?? "");
  const view = String(formData.get("view") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const file = formData.get("file");

  const fieldErrors: Record<string, string> = {};
  if (!caseId) return { error: "This form is missing its case." };
  if (!IMAGING_VIEWS.includes(view)) {
    fieldErrors.view = "Choose a view.";
  }
  if (label.length < 2) {
    fieldErrors.label = "Give the view a label of at least two characters.";
  }
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      fieldErrors.file = "Upload an image file.";
    } else if (file.size > MAX_IMAGE_BYTES) {
      fieldErrors.file = "Keep the image under 10 MB.";
    }
  } else {
    fieldErrors.file = "Choose an image to upload.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors, error: "Fix the highlighted fields and try again." };
  }

  return {
    error:
      "There is no image storage connected yet, so this view was validated but not uploaded or saved.",
  };
}

/* --------------------- resident detail / case review ---------------------- */

export type InstructorNoteFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function addInstructorNote(
  _prev: InstructorNoteFormState,
  formData: FormData,
): Promise<InstructorNoteFormState> {
  const residentId = String(formData.get("residentId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!residentId) return { error: "This form is missing its resident." };
  if (note.length < 2) {
    return { fieldErrors: { note: "Write at least a couple of words." } };
  }

  const { addResidentNote } = await import("@/lib/data/residents");
  const { ResidentApiError } = await import("@/lib/data/residents-api");
  try {
    await addResidentNote(residentId, note);
  } catch (err) {
    return { error: err instanceof ResidentApiError ? err.message : "Could not save the note." };
  }

  revalidatePath(`/cohorts/learners/${residentId}`);
  return {};
}

export type AssignPracticeFormState = {
  error?: string;
  saved?: boolean;
};

export async function assignPractice(
  _prev: AssignPracticeFormState,
  formData: FormData,
): Promise<AssignPracticeFormState> {
  const residentId = String(formData.get("residentId") ?? "");
  const caseId = String(formData.get("caseId") ?? "");
  const caseTitle = String(formData.get("caseTitle") ?? "");

  if (!residentId || !caseId || !caseTitle) {
    return { error: "This form is missing the case to assign." };
  }

  const { addResidentAssignment } = await import("@/lib/data/residents");
  const { ResidentApiError } = await import("@/lib/data/residents-api");
  try {
    await addResidentAssignment(residentId, caseId, caseTitle);
  } catch (err) {
    return { error: err instanceof ResidentApiError ? err.message : "Could not assign the case." };
  }

  revalidatePath(`/cohorts/learners/${residentId}`);
  return { saved: true };
}

export type InstructorFeedbackFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

export async function saveInstructorFeedback(
  _prev: InstructorFeedbackFormState,
  formData: FormData,
): Promise<InstructorFeedbackFormState> {
  const residentId = String(formData.get("residentId") ?? "");
  const attemptId = String(formData.get("attemptId") ?? "") || undefined;
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!residentId) return { error: "This form is missing its resident." };
  if (feedback.length < 2) {
    return { fieldErrors: { feedback: "Write at least a couple of words." } };
  }

  const { addResidentFeedback } = await import("@/lib/data/residents");
  const { ResidentApiError } = await import("@/lib/data/residents-api");
  try {
    await addResidentFeedback(residentId, feedback, attemptId);
  } catch (err) {
    return { error: err instanceof ResidentApiError ? err.message : "Could not save the feedback." };
  }

  if (attemptId) revalidatePath(`/sessions/${attemptId}/report`);
  revalidatePath(`/cohorts/learners/${residentId}`);
  return { saved: true };
}
