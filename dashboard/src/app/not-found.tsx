import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found" };

/**
 * The app-wide 404. It deliberately avoids the app shell (no data fetch, no
 * session read), so it renders for signed-out visitors and bad URLs alike.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "var(--s-6)",
        background: "var(--canvas)",
      }}
    >
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--t-label)" }}>
          Error 404
        </p>
        <h1 style={{ color: "var(--ink)", margin: "var(--s-2) 0" }}>
          This page doesn&rsquo;t exist
        </h1>
        <p style={{ color: "var(--text)" }}>
          The address may be out of date. Start from the dashboard and use the
          sidebar to find what you need.
        </p>
        <p style={{ marginTop: "var(--s-5)" }}>
          <Link href="/" style={{ color: "var(--brand)", fontWeight: 600 }}>
            Go to the dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
