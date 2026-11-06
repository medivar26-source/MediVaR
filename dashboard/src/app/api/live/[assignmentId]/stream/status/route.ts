import type { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/session";
import { requestSignal } from "@/lib/http";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Is the headset on the stream? `GET /api/live/{assignmentId}/stream/status` forwards the backend's answer
 * (`deviceConnected`, `watchers`, `frameSeq`) so the live page can choose the moving picture when there is one
 * and the snapshot when there is not, instead of guessing from a broken `<img>`.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const token = await getSessionToken();
  if (!token) return Response.json({ detail: "Not signed in." }, { status: 401 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/assignments/${encodeURIComponent(assignmentId)}/live/stream/status`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
      signal: requestSignal(),
    });
  } catch {
    return Response.json({ detail: "The backend did not answer." }, { status: 502 });
  }
  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
  });
}
