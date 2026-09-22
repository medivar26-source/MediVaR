"use client";

import { useActionState, useEffect, useRef } from "react";
import { Banner, Button, Input } from "@/components/ui";
import { changePassword, type ChangePasswordState } from "@/app/actions";
import s from "./settings.module.css";

/**
 * Change Password form for authenticated users.
 * Allows learners to replace instructor-issued temporary passwords
 * with their own personal secure password.
 * Never logs, stores, or exposes plaintext passwords.
 */
export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(
    changePassword,
    {},
  );

  // Clear inputs upon successful password change so credentials are never retained in DOM
  useEffect(() => {
    if (state.success && !state.error) {
      formRef.current?.reset();
    }
  }, [state.success, state.error]);

  return (
    <form ref={formRef} action={formAction} className={s.form}>
      {state.error && (
        <Banner tone="fail" title="Password change failed">
          {state.error}
        </Banner>
      )}
      {state.success && !state.error && (
        <Banner tone="pass" title="Password updated">
          Your password has been changed successfully. Please use your new password for future sign-ins.
        </Banner>
      )}

      <div className={s.field}>
        <Input
          label="Current password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          helper="Enter your existing password (or temporary password provided by your instructor)."
        />
      </div>

      <div className={s.pair}>
        <Input
          label="New password"
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          helper="Must be at least 8 characters long."
        />
        <Input
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          helper="Re-enter your new password to confirm."
        />
      </div>

      <div className={s.formFoot}>
        <Button variant="primary" type="submit" loading={pending}>
          Change password
        </Button>
      </div>
    </form>
  );
}
