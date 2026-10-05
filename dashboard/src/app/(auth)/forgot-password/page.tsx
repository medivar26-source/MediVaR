// app/(auth)/forgot-password/page.tsx
"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/app/actions";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Input } from "@/components/auth/ui/input";
import { Label } from "@/components/auth/ui/label";
import { Button } from "@/components/auth/ui/button";
import styles from "./forgot-password.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await requestPasswordReset(email);
      if (result.error) setError(result.error);
      else setMessage(result.message ?? "If an account exists for that address, a reset link is on its way.");
    });
  }

  return (
    <div className={styles.container}>

      {/* top-right: Need help? */}
      <div className={styles.helpLinkContainer}>
        <Link href="/support" className={styles.helpLink}>
          Need help?
        </Link>
      </div>

      {/* centered form */}
      <div className={styles.mainContent}>
        <div className={styles.formWrapper}>

          <div className={styles.header}>
            <h1 className={styles.title}>Reset your password</h1>
            <p className={styles.subtitle}>
              Enter the email associated with your account and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <Label htmlFor="reset-email">Work email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="name@hospital.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={pending || !email.trim()}
            >
              {pending ? "Sending…" : "Send reset link"}
            </Button>

            {error && <p role="alert" style={{ color: "#dc2626", fontSize: "0.875rem" }}>{error}</p>}

            {message && (
              <div className={styles.successBox}>
                <Mail className={styles.successIcon} />
                <p>{message} It may take a few minutes to arrive.</p>
              </div>
            )}
          </div>
        </div>

        {/* back to sign in */}
        <Link
          href="/login"
          className={styles.backLink}
        >
          <ArrowLeft className={styles.backIcon} />
          Back to sign in
        </Link>
      </div>

      {/* footer */}
      <footer className={styles.footer}>
        © 2026 MediVeR, Inc. ·{" "}
        <Link href="/support" className={styles.footerLink}>Support</Link>
      </footer>

    </div>
  );
}