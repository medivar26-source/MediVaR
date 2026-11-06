import type { NextRequest } from "next/server";
import { getSessionToken } from "@/lib/session";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const dynamic = "force-dynamic";

/**
 * The moving picture: `GET /api/live/{assignmentId}/stream` pipes the backend's MJPEG stream
 * (`GET /assignments/{id}/live/stream`, `multipart/x-mixed-replace`) straight through, with the viewer's token
 * from the httpOnly cookie. An `<img>` plays it as video. No deadline on this fetch: it lives as long as the
 * page watches. Never cached or compressed: a buffering proxy would show nothing until the run ended.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const token = await getSessionToken();
  if (!token) return new Response(null, { status: 401 });

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/assignments/${encodeURIComponent(assignmentId)}/live/stream`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: _request.signal,
    });
  } catch {
    return new Response(null, { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response(null, { status: upstream.ok ? 502 : upstream.status, headers: { "Cache-Control": "no-store" } });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "multipart/x-mixed-replace; boundary=mediverframe",
      "Cache-Control": "no-store",
      "Content-Encoding": "identity",
      "X-Accel-Buffering": "no",
    },
  });
}
