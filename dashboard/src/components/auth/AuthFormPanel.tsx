// components/auth/AuthFormPanel.tsx
"use client";

import { useActionState, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Building2, CircleAlert } from "lucide-react";
import { Input } from "@/components/auth/ui/input";
import { Label } from "@/components/auth/ui/label";
import { Button } from "@/components/auth/ui/button";
import { signIn, type SignInState } from "@/app/actions";
import styles from "./AuthFormPanel.module.css";

/**
 * Credentials now travel to the server the same way as SignInForm: via a
 * Server Action bound to the <form>'s `action`, not via client state + a
 * hand-rolled fetch/redirect. The password is never held in a React
 * useState — only UI-only concerns (which tab is active, whether the
 * password is masked, SSO button loading state) live on the client.
 */
export default function AuthFormPanel({ next }: { next?: string }) {
  const [mode, setMode] = useState<"instructor" | "learner">("instructor");
  const [showPw, setShowPw] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);

  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    {},
  );

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  }

  function handleSSO() {
    // Placeholder until a real SSO provider (e.g. SAML/OAuth via your institution) is wired up.
    setSsoLoading(true);
    setTimeout(() => {
      setSsoLoading(false);
      alert("Institution SSO isn't connected yet — this is a placeholder.");
    }, 600);
  }

  return (
    <div className={styles.container}>
      <div className={styles.helpLinkContainer}>
        <Link href="/support" className={styles.helpLink}>
          Need help?
        </Link>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h2 className={styles.title}>Sign in to your account</h2>
            <p className={styles.subtitle}>
              Welcome back — pick up where you left off.
            </p>
          </div>

          <div className={styles.tabs}>
            <button
              type="button"
              onClick={() => setMode("instructor")}
              className={`${styles.tabButton} ${
                mode === "instructor" ? styles.tabButtonActive : ""
              }`}
            >
              Instructor
            </button>
            <button
              type="button"
              onClick={() => setMode("learner")}
              className={`${styles.tabButton} ${
                mode === "learner" ? styles.tabButtonActive : ""
              }`}
            >
              Learner
            </button>
          </div>

          {/* Single form for both modes — only the identifier field's label/placeholder
              change. loginType tells the server action which kind of account to check. */}
          <form action={formAction} className={styles.form} noValidate>
            {next && <input type="hidden" name="next" value={next} />}
            <input type="hidden" name="loginType" value={mode} />

            {state.error && (
              <p className={styles.errorBox} role="alert">
                <CircleAlert className={styles.errorIcon} aria-hidden="true" />
                <span>{state.error}</span>
              </p>
            )}

            <div className={styles.inputGroup}>
              <Label htmlFor="identifier">
                {mode === "instructor" ? "Email address" : "Learner ID"}
              </Label>
              <Input
                id="identifier"
                name="identifier"
                type={mode === "instructor" ? "email" : "text"}
                inputMode={mode === "instructor" ? "email" : undefined}
                autoComplete="username"
                placeholder={mode === "instructor" ? "xyz@gmail.com" : "e.g. LRN-04521"}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <Label htmlFor="password">Password</Label>
              <div className={styles.passwordWrapper}>
                <Input
                  id="password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  onKeyUp={trackCapsLock}
                  onBlur={() => setCapsLock(false)}
                  className={styles.passwordInput}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className={styles.togglePwButton}
                  aria-pressed={showPw}
                >
                  {showPw ? <EyeOff className={styles.eyeIcon} /> : <Eye className={styles.eyeIcon} />}
                </button>
              </div>
              {capsLock && (
                <p className={styles.capsLockWarning}>Caps Lock is on.</p>
              )}
            </div>

            <div className={styles.forgotPwContainer}>
              <Link href="/forgot-password" className={styles.forgotPwLink}>
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={pending}
              className={styles.submitButton}
            >
              {pending ? "Signing in" : "Sign in"}
            </Button>
          </form>

          <div className={styles.dividerContainer}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <div className={styles.dividerLine} />
          </div>

          <Button
            variant="outline"
            className={styles.ssoButton}
            onClick={handleSSO}
            disabled={ssoLoading}
          >
            <Building2 className={styles.ssoIcon} />
            {ssoLoading ? "Connecting..." : "Continue with institution SSO"}
          </Button>

          <p className={styles.signupPrompt}>
            Don&apos;t have an account?{" "}
            <Link href="/request-access" className={styles.signupLink}>
              Request access
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}