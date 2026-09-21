/**
 * HTTP client for the Content / Case Library API (`/cases`, `/procedures`).
 *
 * Every function takes the session token explicitly rather than reading
 * cookies itself, so it can be exercised without a request context. Callers
 * in a server component or action resolve the token with `getAuthToken()`.
 *
 * Errors are translated to short, user-safe messages here — a status code or
 * a backend detail string never reaches the page unless the backend wrote it
 * for a person to read (the 4xx/503 `detail` values it sets deliberately).
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type ApiDifficulty = "beginner" | "intermediate" | "expert";
export type ApiCaseStatus = "active" | "inactive";

export type ApiCase = {
  id: string;
  program_id: string;
  procedure_id: string;
  procedure_name: string;
  name: string;
  difficulty: ApiDifficulty;
  description: string | null;
  learning_objective: string | null;
  status: ApiCaseStatus;
  version: number;
  created_at: string;
  updated_at: string;
};

export type ApiProcedure = {
  id: string;
  name: string;
  description: string | null;
  version: number;
  step_count: number;
};

export type ApiCaseInput = {
  name: string;
  procedure_id: string;
  difficulty: ApiDifficulty;
  learning_objective: string;
  description?: string;
};

export type ApiCasePatch = Partial<
  Omit<ApiCaseInput, "description"> & {
    description: string | null;
    status: ApiCaseStatus;
  }
>;

export class ContentApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ContentApiError";
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
    throw new ContentApiError(
      0,
      "Cannot reach the server. Check your connection and try again.",
    );
  }

  if (res.ok) return (await res.json()) as T;

  let detail: string | undefined;
  try {
    const body = await res.json();
    if (typeof body?.detail === "string") detail = body.detail;
  } catch {
    // Not JSON — fall through to the generic message.
  }

  if (res.status === 401) {
    throw new ContentApiError(401, "Your session has expired. Sign in again.");
  }
  if (res.status === 403) {
    throw new ContentApiError(403, detail ?? "You don't have permission to manage content.");
  }
  if (res.status === 404 || res.status === 400 || res.status === 503) {
    throw new ContentApiError(res.status, detail ?? "That request could not be completed.");
  }
  if (res.status === 422) {
    throw new ContentApiError(422, "Some of those details aren't valid. Check the fields and try again.");
  }
  throw new ContentApiError(res.status, "Something went wrong on the server. Try again in a moment.");
}

export const apiListCases = (token: string) => call<ApiCase[]>(token, "/cases");

export async function apiGetCase(token: string, id: string): Promise<ApiCase | null> {
  try {
    return await call<ApiCase>(token, `/cases/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ContentApiError && err.status === 404) return null;
    throw err;
  }
}

export const apiCreateCase = (token: string, input: ApiCaseInput) =>
  call<ApiCase>(token, "/cases", { method: "POST", body: input });

export const apiUpdateCase = (token: string, id: string, patch: ApiCasePatch) =>
  call<ApiCase>(token, `/cases/${encodeURIComponent(id)}`, { method: "PATCH", body: patch });

export const apiListProcedures = (token: string) =>
  call<ApiProcedure[]>(token, "/procedures");
