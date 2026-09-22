import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Profile } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * The seam between the UI and authentication.
 *
 * Reads the session token from the httpOnly cookie, calls the backend
 * /auth/me endpoint to resolve the current user, and maps the response
 * to the existing Profile type used throughout the application.
 *
 * Returns null if there is no valid session. The middleware redirects
 * unauthenticated users to /login before they reach any server component,
 * so in practice this only returns null if the cookie is present but the
 * token has expired or is otherwise invalid.
 *
 * Components must not change — they still receive a Profile and do not know
 * or care where it came from. This was the point of the seam.
 */
export async function getCurrentUser(): Promise<Profile> {
  let token: string | undefined;

  try {
    const cookieStore = await cookies();
    token = cookieStore.get("mediver-token")?.value;
  } catch {
    // cookies() can throw in some rendering contexts
    redirect("/login");
  }

  if (!token) {
    redirect("/login");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store", // Always fetch fresh — this is identity data
    });
  } catch {
    // Backend unreachable — return null, middleware will redirect
    redirect("/login");
  }

  if (!response.ok) {
    redirect("/login");
  }

  const data = await response.json();
  const u = data?.user;
  if (!u) redirect("/login");

  // Map the backend UserProfile shape to the frontend Profile type.
  // The two shapes are intentionally kept in alignment so this mapping
  // is a thin rename rather than a transformation.
  const profile: Profile = {
    id: u.id,
    email: u.email ?? `${u.learner_id?.toLowerCase()}@learner.mediver.local`,
    displayName: u.display_name,
    role: u.role,
    level: u.level,
    defaultDifficulty: u.default_difficulty ?? "intermediate",
    cohortId: u.cohort_id,
    learnerId: u.learner_id,
    institutionId: u.institution_id,
    createdAt: new Date().toISOString(), // Backend doesn't return this in /me yet
    lastActiveAt: undefined,
  };

  return profile;
}
