/**
 * Centralized API client for communicating with the FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

import { cookies } from "next/headers";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function fetchWithConfig(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("mediver-token")?.value;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    // If called in a context where cookies() is not available (e.g. client component),
    // we cannot inject the httpOnly cookie.
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    throw new ApiError(response.status, errorData.detail || 'API Error', errorData);
  }

  // Handle empty responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const apiClient = {
  get: (endpoint: string, options?: RequestInit) => 
    fetchWithConfig(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, data: any, options?: RequestInit) => 
    fetchWithConfig(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),
  
  put: (endpoint: string, data: any, options?: RequestInit) => 
    fetchWithConfig(endpoint, { ...options, method: 'PUT', body: JSON.stringify(data) }),
  
  upload: async (endpoint: string, formData: FormData, options?: RequestInit) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = new Headers(options?.headers);
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("mediver-token")?.value;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch {}
    const response = await fetch(url, {
      ...options,
      method: "POST",
      headers,
      body: formData,
    });
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: response.statusText };
      }
      throw new ApiError(response.status, errorData.detail || "API Error", errorData);
    }
    return response.json();
  },
  
  delete: (endpoint: string, options?: RequestInit) => 
    fetchWithConfig(endpoint, { ...options, method: 'DELETE' }),
};

