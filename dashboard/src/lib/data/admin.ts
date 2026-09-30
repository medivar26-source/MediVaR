import { getSessionToken } from "@/lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type StaffMember = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  status: string;
  institutionId?: string;
  institutionName?: string;
  createdAt?: string;
};

export type Institution = { id: string; name: string };

async function adminGet<T>(path: string): Promise<{ data?: T; error?: string }> {
  const token = await getSessionToken();
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: body.detail || "Could not load this information." };
    }
    return { data: (await res.json()) as T };
  } catch {
    return { error: "Could not reach the server." };
  }
}

/**
 * Every institution (`GET /admin/institutions`). Administrator-only on the
 * server; a non-admin gets a 403, surfaced here as an error.
 */
export async function listInstitutions(): Promise<{
  institutions: Institution[];
  error?: string;
}> {
  const { data, error } = await adminGet<Institution[]>("/admin/institutions");
  return { institutions: data ?? [], error };
}

/**
 * Instructors and administrators across all institutions
 * (`GET /admin/instructors`), each with the institution they belong to.
 */
export async function listInstructors(): Promise<{
  staff: StaffMember[];
  error?: string;
}> {
  const { data, error } = await adminGet<
    {
      id: string;
      first_name: string;
      last_name: string;
      email?: string;
      role: string;
      status: string;
      institution_id?: string;
      institution_name?: string;
      created_at?: string;
    }[]
  >("/admin/instructors");

  return {
    error,
    staff: (data ?? []).map((r) => ({
      id: r.id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      role: r.role,
      status: r.status,
      institutionId: r.institution_id,
      institutionName: r.institution_name,
      createdAt: r.created_at,
    })),
  };
}
