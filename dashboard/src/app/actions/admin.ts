"use server";

import { revalidatePath } from "next/cache";
import { NEW_INSTITUTION } from "@/lib/admin-constants";
import { getSessionToken } from "@/lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export type CreateInstructorState = {
  error?: string;
  /** Shown once, straight after creation. Never stored on the front end. */
  created?: {
    name: string;
    email: string;
    institution: string;
    tempPassword: string;
  };
};

/**
 * Create an instructor login in a chosen institution
 * (`POST /admin/instructors`): an existing one, or a new one by name. Only an
 * administrator is accepted by the server. The learners this instructor later
 * creates belong to the same institution, and no other institution can see them.
 */
export async function createInstructor(
  _prev: CreateInstructorState,
  formData: FormData,
): Promise<CreateInstructorState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const institutionId = String(formData.get("institutionId") ?? "");
  const newInstitution = String(formData.get("newInstitution") ?? "").trim();

  if (!firstName || !lastName) return { error: "Enter the instructor's first and last name." };
  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (password && password.length < 8) {
    return { error: "A password must be at least 8 characters, or leave it blank to generate one." };
  }

  const isNew = institutionId === NEW_INSTITUTION;
  if (isNew && newInstitution.length < 2) return { error: "Enter the new institution's full name." };
  if (!isNew && !institutionId) return { error: "Choose an institution." };

  const token = await getSessionToken();
  try {
    const res = await fetch(`${API_BASE}/admin/instructors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email,
        ...(isNew ? { institution_name: newInstitution } : { institution_id: institutionId }),
        ...(password ? { temp_password: password } : {}),
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail = Array.isArray(body.detail) ? body.detail[0]?.msg : body.detail;
      return { error: detail || "The account could not be created." };
    }
    revalidatePath("/admin/instructors");
    return {
      created: {
        name: `${body.user.first_name} ${body.user.last_name}`,
        email: body.user.email,
        institution: body.user.institution_name ?? "",
        tempPassword: body.temp_password,
      },
    };
  } catch {
    return { error: "Could not reach the server." };
  }
}
