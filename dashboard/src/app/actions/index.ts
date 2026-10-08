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
import { getCurrentUser, getSessionToken } from "@/lib/session";
import { checkPlanUpdate, checkSealable } from "@/lib/data/plan_lock";
import { resolvePatientIdentity } from "@/lib/data/planner_identity";
import { buildV1VrPayload } from "@/lib/data/vr_payload";


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

  // Only same-site relative paths: "//host" and "/\host" are protocol-relative and would leave the site.
  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/";
  redirect(safeNext);
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

/* ----------------------------- password reset ----------------------------- */

export type ResetState = { error?: string; message?: string };

export async function requestPasswordReset(email: string): Promise<ResetState> {
  const trimmed = email.trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { error: "Enter the email address for your instructor account." };
  }
  try {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed }),
    });
    if (!res.ok) return { error: "Could not send the reset link. Try again in a moment." };
    const data = await res.json();
    return { message: data?.message };
  } catch {
    return { error: "Cannot reach the server. Check your connection and try again." };
  }
}

export async function completePasswordReset(
  accessToken: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ResetState> {
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters long." };
  if (newPassword !== confirmPassword) return { error: "New password and confirmation do not match." };
  if (!accessToken) return { error: "This reset link is invalid or has expired. Request a new one." };
  try {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken, new_password: newPassword }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: typeof data?.detail === "string" ? data.detail : "Could not reset the password." };
    }
    return { message: data?.message };
  } catch {
    return { error: "Cannot reach the server. Check your connection and try again." };
  }
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
  const level = String(formData.get("level") ?? "").trim();
  const defaultDifficulty = String(formData.get("defaultDifficulty") ?? "");

  if (displayName.length < 2) {
    return { error: "A display name needs at least two characters." };
  }
  if (!["beginner", "intermediate", "expert"].includes(defaultDifficulty)) {
    return { error: "Choose a default difficulty." };
  }

  const token = await getSessionToken();
  if (!token) return { error: "Your session has expired. Sign in again." };

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        display_name: displayName,
        level: level || null,
        default_difficulty: defaultDifficulty,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { error: typeof data?.detail === "string" ? data.detail : "Could not save your details." };
    }
  } catch {
    return { error: "Cannot reach the server. Check your connection and try again." };
  }

  revalidatePath("/", "layout");
  return { savedAt: new Date().toISOString() };
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

  const user = await getCurrentUser();
  const userId = user.id;

  // A learner can keep several plans for one case. "Start" resumes the most recent plan that is
  // still a draft; once none is left, or when they ask for a fresh one, it creates a new plan.
  const startFresh = formData.get("new") === "1";
  let existing = startFresh
    ? undefined
    : PLANS.filter((plan: PlanRecord) => plan.caseId === caseId && plan.userId === userId && !plan.isReadyForVr)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];

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
  // Resolve the caller first (redirects to /login when signed out) — Server Actions are
  // reachable without a page load, so the route proxy alone is not enough.
  const user = await getCurrentUser();
  try {
    const plan = PLAN_BY_ID.get(planId);
    if (plan && plan.userId !== user.id) {
      return { success: false, error: "You can only change your own plans." };
    }
    if (plan) {
      const allowed = checkPlanUpdate(plan, updates);
      if (!allowed.ok) return { success: false, error: allowed.error };
      plan.payload = { ...plan.payload, ...updates };
      plan.updatedAt = new Date().toISOString();
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

  const user = await getCurrentUser();

  const { PLAN_BY_ID } = await import("@/lib/data/plans");
  const plan = PLAN_BY_ID.get(planId);

  if (!plan) return { error: "Plan not found." };
  if (plan.userId !== user.id) return { error: "You can only lock your own plans." };

  const { getPlan } = await import("@/lib/data/plan");
  const detail = await getPlan(planId);
  if (!detail) return { error: "Plan not found." };

  // Only what was actually measured and confirmed goes to the headset. Nothing is filled in.
  const sealable = checkSealable(plan);
  if (!sealable.ok) return { error: sealable.error };
  const v1Assessment = plan.payload.v1_assessment!;
  const v1Tibial = plan.payload.v1_tibial!;
  const v1Femoral = plan.payload.v1_femoral!;

  // A plan goes to the headset only on scan scales somebody verified.
  const { resolvePlanScales, SCAN_VIEW_NAME } = await import("@/lib/data/scan_scale");
  const scales = resolvePlanScales(detail);
  const unverified = (["FLAP", "KLAT"] as const).filter((v) => !scales[v].calibrated);
  if (unverified.length > 0) {
    return {
      error: `The ${unverified.map((v) => SCAN_VIEW_NAME[v]).join(" and ")} scan scale is not verified. Verify it on the Assessment page (Page 1) with the radio-opaque marker.`,
    };
  }

  // The knee comes from the case itself, not from guessing at its name.
  const kneeSide: "RIGHT" | "LEFT" = (detail.case.side || "right").toUpperCase() === "LEFT" ? "LEFT" : "RIGHT";

  const vrPayload = buildV1VrPayload({
    patientId: resolvePatientIdentity(plan.caseId, detail.case.patient).patientId,
    kneeSide,
    assessment: v1Assessment,
    tibial: v1Tibial,
    femoral: v1Femoral,
  });

  plan.payload.v1_vr_payload = vrPayload;
  plan.isReadyForVr = true;
  plan.lockedVersion = {
    versionId: crypto.randomUUID(),
    sealedBy: user.id,
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

  revalidatePath("/programs", "layout");
  redirect("/programs");
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
    const res = await fetch(`${API_BASE}/cohorts/`, {
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

  revalidatePath("/programs", "layout");
  redirect(`/programs/${program_id}?tab=cohorts`);
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

  revalidatePath("/programs", "layout");
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
  const caseId = String(formData.get("caseId") ?? "").trim();
  const mode = String(formData.get("mode") ?? "training").trim();

  if (!cohortId) return { error: "Cohort ID is missing." };
  if (name.length < 2) return { error: "Session name must be at least 2 characters." };
  if (!scheduledAt) return { error: "Scheduled date & time is required." };
  if (duration <= 0) return { error: "Duration must be greater than 0 minutes." };
  if (!caseId) return { error: "Choose a case for this session." };

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
        case_id: caseId,
        mode,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { error: data.detail || "Failed to create session." };
    }
  } catch {
    return { error: "Failed to connect to the server." };
  }

  revalidatePath("/programs", "layout");
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

  revalidatePath("/programs", "layout");
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

  revalidatePath("/programs", "layout");
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
  revalidatePath("/cases");
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
  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
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
  revalidatePath("/cases");
  revalidatePath(`/cases/${caseId}`);
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

  revalidatePath(`/learners/${residentId}`);
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

  revalidatePath(`/learners/${residentId}`);
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
  revalidatePath(`/learners/${residentId}`);
  return { saved: true };
}
