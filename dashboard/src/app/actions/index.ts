"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { PLANS, PLAN_BY_ID, type PlanRecord } from "@/lib/data/plans";

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
