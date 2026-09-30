"use server";

import { apiClient } from "@/lib/api-client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./cases";

export async function getPersonalCaseAction(caseId: string): Promise<ActionResult> {
  try {
    const data = await apiClient.get(`/personal-cases/${caseId}`);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to fetch personal case.",
    };
  }
}

export async function createPersonalCaseAction(payload: any): Promise<ActionResult> {
  try {
    const data = await apiClient.post("/personal-cases", payload);
    revalidatePath("/personal-cases");
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create personal case.",
    };
  }
}

export async function updatePersonalCaseAction(caseId: string, payload: any): Promise<ActionResult> {
  try {
    const data = await apiClient.patch(`/personal-cases/${caseId}`, payload);
    revalidatePath("/personal-cases");
    revalidatePath(`/personal-cases/${caseId}`);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to update personal case.",
    };
  }
}

export async function deletePersonalCaseAction(caseId: string): Promise<ActionResult> {
  try {
    await apiClient.delete(`/personal-cases/${caseId}`);
    revalidatePath("/personal-cases");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to delete personal case.",
    };
  }
}

export async function uploadPersonalRadiographAction(caseId: string, formData: FormData): Promise<ActionResult> {
  try {
    const data = await apiClient.upload(`/personal-cases/${caseId}/upload-radiograph`, formData);
    revalidatePath(`/personal-cases/${caseId}`);
    return { success: true, data };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to upload radiograph.",
    };
  }
}
