"use server";

import { apiClient, ApiError } from "@/lib/api-client";
import { revalidatePath } from "next/cache";

export type ActionResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: string[];
};

export async function createCaseAction(payload: any): Promise<ActionResult> {
  try {
    const data = await apiClient.post("/cases", payload);
    revalidatePath("/cases");
    return { success: true, data };
  } catch (err: any) {
    console.error("createCaseAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to create case.",
      validationErrors: err.data?.detail ? (Array.isArray(err.data.detail) ? err.data.detail.map((d: any) => d.msg || String(d)) : [err.data.detail]) : undefined,
    };
  }
}

export async function updateCaseAction(caseId: string, payload: any): Promise<ActionResult> {
  try {
    const data = await apiClient.put(`/cases/${caseId}`, payload);
    revalidatePath("/cases");
    revalidatePath(`/cases/${caseId}`);
    revalidatePath(`/cases/${caseId}/edit`);
    return { success: true, data };
  } catch (err: any) {
    console.error("updateCaseAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to update case.",
      validationErrors: err.data?.detail ? (Array.isArray(err.data.detail) ? err.data.detail.map((d: any) => d.msg || String(d)) : [err.data.detail]) : undefined,
    };
  }
}

export async function publishCaseAction(caseId: string): Promise<ActionResult> {
  try {
    const data = await apiClient.post(`/cases/${caseId}/publish`, {});
    revalidatePath("/cases");
    revalidatePath(`/cases/${caseId}`);
    return { success: true, data };
  } catch (err: any) {
    console.error("publishCaseAction error:", err);
    return {
      success: false,
      error: err.message || "Publish validation failed.",
      validationErrors: err.data?.detail ? (Array.isArray(err.data.detail) ? err.data.detail.map((d: any) => d.msg || String(d)) : [err.data.detail]) : undefined,
    };
  }
}

export async function deactivateCaseAction(caseId: string): Promise<ActionResult> {
  try {
    const data = await apiClient.post(`/cases/${caseId}/deactivate`, {});
    revalidatePath("/cases");
    revalidatePath(`/cases/${caseId}`);
    return { success: true, data };
  } catch (err: any) {
    console.error("deactivateCaseAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to deactivate case.",
    };
  }
}

export async function uploadRadiographAction(caseId: string, formData: FormData): Promise<ActionResult> {
  try {
    const data = await apiClient.upload(`/cases/${caseId}/upload-radiograph`, formData);
    revalidatePath(`/cases/${caseId}`);
    revalidatePath(`/cases/${caseId}/edit`);
    return { success: true, data };
  } catch (err: any) {
    console.error("uploadRadiographAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to upload radiograph.",
      validationErrors: err.data?.detail ? [err.data.detail] : undefined,
    };
  }
}

export async function previewCaseAsLearnerAction(caseId: string): Promise<ActionResult> {
  try {
    const data = await apiClient.get(`/cases/${caseId}/preview`);
    return { success: true, data };
  } catch (err: any) {
    console.error("previewCaseAsLearnerAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch learner preview.",
    };
  }
}

export async function uploadAssetAction(formData: FormData): Promise<ActionResult<{ storage_path: string; filename: string }>> {
  try {
    const data = await apiClient.upload("/cases/upload-asset", formData);
    return { success: true, data };
  } catch (err: any) {
    console.error("uploadAssetAction error:", err);
    return {
      success: false,
      error: err.message || "Failed to upload asset.",
    };
  }
}

