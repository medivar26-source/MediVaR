// app/(auth)/reset-password/page.tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/auth/ui/input";
import { Label } from "@/components/auth/ui/label";
import { Button } from "@/components/auth/ui/button";
import { completePasswordReset } from "@/app/actions";
import styles from "../forgot-password/forgot-password.module.css";

/**
 * Landing page for the emailed recovery link. Supabase appends the recovery session to the
 * URL *fragment* (#access_token=…&type=recovery), which the server never sees, so it is read
 * here in the browser and posted to the backend, then scrubbed from the address bar.
 */
export default function ResetPasswordPage() {
  const [token, setToken] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  // Strict mode runs effects twice; the fragment is scrubbed after the first read.
  const parsed = useRef(false);

  useEffect(() => {
    if (parsed.current) return;
    parsed.current = true;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const access = params.get("access_token");
    const type = params.get("type");
    const errorDescription = params.get("error_description");

    if (access && type === "recovery") {
      setToken(access);
    } else {
      setLinkError(
        errorDescription?.replace(/\+/g, " ") ??
          "This reset link is invalid or has expired. Request a new one.",
      );
    }
    // Keep the token out of history and the address bar.
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError(null);
    startTransition(async () => {
      const result = await completePasswordReset(token, password, confirm);
      if (result.error) setError(result.error);
      else setDone(true);
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Choose a new password</h1>
            <p className={styles.subtitle}>Use at least 8 characters.</p>
          </div>

          {done ? (
            <div className={styles.successBox}>
              <CheckCircle2 className={styles.successIcon} />
              <p>
                Your password has been updated. <Link href="/login">Sign in</Link> with the new
                password.
              </p>
            </div>
          ) : linkError ? (
            <div className={styles.form}>
              <p role="alert" style={{ color: "#dc2626", fontSize: "0.875rem" }}>{linkError}</p>
              <Link href="/forgot-password">Request a new reset link</Link>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} noValidate>
              <div className={styles.inputGroup}>
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && <p role="alert" style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}
              <Button
                type="submit"
                className={styles.submitButton}
                disabled={pending || !token || !password || !confirm}
              >
                {pending ? "Saving…" : "Update password"}
              </Button>
            </form>
          )}
        </div>

        <Link href="/login" className={styles.backLink}>
          <ArrowLeft className={styles.backIcon} />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
