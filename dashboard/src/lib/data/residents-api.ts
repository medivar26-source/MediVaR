/**
 * HTTP client for the Resident Detail API (`/residents`).
 *
 * Same shape as `content-api.ts`: token passed explicitly, errors translated
 * to short user-safe messages, nothing beyond what the backend deliberately
 * wrote for a person to read.
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type ApiResidentSummary = {
  id: string;
  display_name: string;
  role: string;
  cohort_id: string | null;
  cohort_name: string | null;
  joined_at: string | null;
};

export type ApiInstructorNote = {
  id: string;
  resident_id: string;
  instructor_id: string;
  instructor_name: string;
  note: string;
  created_at: string;
  updated_at: string;
};

export type ApiInstructorFeedback = {
  id: string;
  resident_id: string;
  attempt_id: string | null;
  instructor_id: string;
  instructor_name: string;
  feedback: string;
  created_at: string;
};

export type ApiTrainingAssignment = {
  id: string;
  resident_id: string;
  case_id: string;
  case_title: string;
  mode: "training" | "assessment";
  status: string;
  assigned_by: string;
  assigned_by_name: string;
  due_at: string | null;
  created_at: string;
  completed_at: string | null;
};

export class ResidentApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ResidentApiError";
  }
}

async function call<T>(
  token: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ResidentApiError(0, "Cannot reach the server. Check your connection and try again.");
  }

  if (res.ok) return (await res.json()) as T;

  let detail: string | undefined;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") detail = body.detail;
  } catch {
    // not JSON
  }

  if (res.status === 401) throw new ResidentApiError(401, "Your session has expired. Sign in again.");
  if (res.status === 403) throw new ResidentApiError(403, detail ?? "You don't have permission to view this resident.");
  if (res.status === 404) throw new ResidentApiError(404, detail ?? "Resident not found.");
  if (res.status === 422) throw new ResidentApiError(422, "Some of those details aren't valid.");
  throw new ResidentApiError(res.status, "Something went wrong on the server. Try again in a moment.");
}

export async function apiGetResident(token: string, id: string): Promise<ApiResidentSummary | null> {
  try {
    return await call<ApiResidentSummary>(token, `/residents/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ResidentApiError && err.status === 404) return null;
    throw err;
  }
}

export const apiListNotes = (token: string, residentId: string) =>
  call<ApiInstructorNote[]>(token, `/residents/${encodeURIComponent(residentId)}/notes`);

export const apiAddNote = (token: string, residentId: string, note: string) =>
  call<ApiInstructorNote>(token, `/residents/${encodeURIComponent(residentId)}/notes`, {
    method: "POST",
    body: { note },
  });

export const apiListFeedback = (token: string, residentId: string, attemptId?: string) =>
  call<ApiInstructorFeedback[]>(
    token,
    `/residents/${encodeURIComponent(residentId)}/feedback${attemptId ? `?attempt_id=${encodeURIComponent(attemptId)}` : ""}`,
  );

export const apiListAssignments = (token: string, residentId: string) =>
  call<ApiTrainingAssignment[]>(token, `/residents/${encodeURIComponent(residentId)}/assignments`);

export const apiAddAssignment = (
  token: string,
  residentId: string,
  input: { case_id: string; case_title: string; mode?: "training" | "assessment" },
) =>
  call<ApiTrainingAssignment>(token, `/residents/${encodeURIComponent(residentId)}/assignments`, {
    method: "POST",
    body: input,
  });

export const apiAddFeedback = (
  token: string,
  residentId: string,
  feedback: string,
  attemptId?: string,
) =>
  call<ApiInstructorFeedback>(token, `/residents/${encodeURIComponent(residentId)}/feedback`, {
    method: "POST",
    body: { feedback, attempt_id: attemptId },
  });
