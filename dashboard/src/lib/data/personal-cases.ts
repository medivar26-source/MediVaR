import { apiClient } from "../api-client";

export type PersonalCase = {
  id: string;
  title: string;
  pathology?: string;
  pathology_label?: string;
  side?: string;
  difficulty: "beginner" | "intermediate" | "expert";
  description?: string;
  patient: any;
  objectives: string[];
  created_at: string;
  updated_at: string;
  imaging: any[];
};

export async function listPersonalCases(): Promise<PersonalCase[]> {
  const data = await apiClient.get("/personal-cases", {
    next: { tags: ["personal-cases"] },
  });
  return data;
}

export async function getPersonalCase(id: string): Promise<PersonalCase> {
  const data = await apiClient.get(`/personal-cases/${id}`, {
    next: { tags: [`personal-cases:${id}`] },
  });
  return data;
}
