import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type ProgramSummary = {
  id: string;
  institution_id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ProgramDetail = ProgramSummary;

export type ProgramCreate = {
  name: string;
  description?: string;
  status?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get("mediver-token")?.value;
  if (!token) redirect("/login");
  return token;
}

/**
 * Fetch all programs for the current institution.
 */
export async function getPrograms(): Promise<ProgramSummary[]> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}/programs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[programs.ts] Failed to fetch programs (${res.status}): ${errorText}`);
    throw new Error(`Failed to fetch programs: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Fetch details for a specific program.
 */
export async function getProgramDetail(id: string): Promise<ProgramDetail> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}/programs/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[programs.ts] Failed to fetch program detail (${res.status}): ${errorText}`);
    throw new Error(`Failed to fetch program detail: ${res.status} ${errorText}`);
  }

  return res.json();
}

/**
 * Fetch all cohorts under a specific program.
 */
export async function getProgramCohorts(id: string): Promise<any[]> {
  const token = await getToken();

  const res = await fetch(`${API_BASE}/programs/${id}/cohorts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[programs.ts] Failed to fetch program cohorts (${res.status}): ${errorText}`);
    throw new Error(`Failed to fetch program cohorts: ${res.status} ${errorText}`);
  }

  return res.json();
}
