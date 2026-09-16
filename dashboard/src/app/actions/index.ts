"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/data/plans";

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

/* ---------------------------------- plans --------------------------------- */

export async function startPlan(formData: FormData): Promise<void> {
  const caseId = String(formData.get("caseId") ?? "");
  if (!caseId) throw new Error("No case was supplied.");

  // Creating a plan needs a store. Until there is one, open the seeded plan for
  // this case so the seven steps can be walked; a case with no seeded plan has
  // nothing to open, and the list says so.
  const existing = PLANS.find((plan) => plan.caseId === caseId);
  redirect(existing ? `/plan/${existing.id}/step/1` : "/plans");
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

export type SealState = { error?: string };

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

export async function createCohort(
  _prev: CohortState,
  formData: FormData,
): Promise<CohortState> {
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    return { error: "Give the cohort a name of at least two characters." };
  }

  return { error: NOT_PERSISTED };
}

export type InviteState = {
  error?: string;
  /** Returned once. There is no query that fetches it back. */
  link?: string;
  expiresAt?: string;
  revoked?: string;
};

export async function createInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const cohortId = String(formData.get("cohortId") ?? "");
  if (!cohortId) return { error: "This form is missing its cohort." };

  return {
    error:
      "Join links are minted and redeemed by a service that is not running yet.",
  };
}

export async function revokeInvite(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const inviteId = String(formData.get("inviteId") ?? "");
  if (!inviteId) return { error: "This form is missing its invite." };

  return { error: NOT_PERSISTED };
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
