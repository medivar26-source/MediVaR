import type { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/session";
import { requestSignal } from "@/lib/http";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * The live page's poll: `GET /api/live/{assignmentId}?after=<seq>` forwards to the backend's
 * `GET /assignments/{id}/live` with the viewer's own token (an httpOnly cookie the browser cannot read, so the
 * page cannot call the backend itself). The backend decides who may watch; this only carries the request.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const token = await getSessionToken();
  if (!token) return Response.json({ detail: "Not signed in." }, { status: 401 });

  const after = Number.parseInt(request.nextUrl.searchParams.get("after") ?? "0", 10);
  const url = `${API_BASE}/assignments/${encodeURIComponent(assignmentId)}/live?after=${Number.isFinite(after) && after > 0 ? after : 0}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
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
