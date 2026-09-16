"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Banner, Button } from "@/components/ui";
import s from "./states.module.css";

/**
 * State what failed and what to do, with a retry. Never a
 * full-page error unless the route itself is invalid — this boundary keeps the
 * chrome around it wherever Next allows.
 *
 * The message is deliberately not the raw error text: a rejected read
 * violation reads as gibberish to a surgeon, and echoing server errors into the
 * page leaks schema detail. The digest is shown so a support conversation can
 * find the matching server log line.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[mediver] route error", error);
  }, [error]);

  return (
    <div className={s.error}>
      <Banner
        tone="fail"
        title="This screen could not be loaded"
        action={
          <Button size="sm" onClick={reset}>
            Try again
          </Button>
        }
      >
        The data behind it did not come back. Your work is not lost — nothing on
        this screen writes until you press a button.
        {error.digest && (
          <>
            {" "}
            Reference <code>{error.digest}</code>.
          </>
        )}
      </Banner>

      <p className={s.errorFoot}>
        If it keeps happening, check the backend status on the{" "}
        <Link href="/help">help page</Link>.
      </p>
    </div>
  );
}
