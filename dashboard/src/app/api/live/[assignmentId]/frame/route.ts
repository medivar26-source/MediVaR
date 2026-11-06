import type { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/session";
import { requestSignal } from "@/lib/http";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * The eye-view snapshot: `GET /api/live/{assignmentId}/frame` streams the newest JPEG from the backend's
 * `GET /assignments/{id}/live/frame`. An `<img>` cannot send an Authorization header, so this handler adds the
 * viewer's token from the httpOnly cookie. Never cached: the `?v=<seq>` the page appends makes the browser ask
 * only when a newer frame exists.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const token = await getSessionToken();
  if (!token) return new Response(null, { status: 401 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/assignments/${encodeURIComponent(assignmentId)}/live/frame`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: requestSignal(),
    });
  } catch {
    return new Response(null, { status: 502 });
  }
  if (!upstream.ok) return new Response(null, { status: upstream.status, headers: { "Cache-Control": "no-store" } });

  const bytes = await upstream.arrayBuffer();
  const headers = new Headers({ "Content-Type": "image/jpeg", "Cache-Control": "no-store" });
  for (const name of ["x-frame-seq", "x-frame-width", "x-frame-height"]) {
    const v = upstream.headers.get(name);
    if (v) headers.set(name, v);
  }
  return new Response(bytes, { status: 200, headers });
}
