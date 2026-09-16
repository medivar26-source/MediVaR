"use client";

import { useActionState, useState } from "react";
import type { KeyboardEvent } from "react";
import { CircleAlert, Eye, EyeOff } from "lucide-react";
import { Button, Input, Segmented } from "@/components/ui";
import { signIn, type SignInState } from "@/app/actions";
import s from "./login.module.css";

/**
 * The only client component on this screen. Credentials go to a Server Action,
 * so the password never travels through client-side state and the
 * session cookie is set on the server.
 *
 * Three affordances that a sign-in screen is judged on, and that this one had
 * to earn rather than decorate:
 *
 *   - **Show password.** A real toggle, not an icon that looks like one. People
 *     mistype long passwords and a headset lab is not a quiet room.
 *   - **Caps Lock.** Warned on the field itself, before the failed attempt,
 *     because "your password is wrong" is the least useful thing to say to
 *     somebody whose password is right.
 *   - **One error, no counter.** Which half was wrong, and how many attempts
 *     remain, helps an attacker and nobody else.
 */
export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    {},
  );
  const [loginType, setLoginType] = useState<"instructor" | "learner">("instructor");
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  function trackCapsLock(event: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  }

  return (
    <form className={s.form} action={formAction} noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state.error && (
        <p className={s.formError} role="alert">
          <CircleAlert className={s.formErrorIcon} aria-hidden="true" />
          <span>{state.error}</span>
        </p>
      )}

      <Segmented<"instructor" | "learner">
        label="Account type"
        options={[
          { value: "instructor", label: "Instructor" },
          { value: "learner", label: "Learner" },
        ]}
        value={loginType}
        onChange={setLoginType}
        className={s.roleToggle}
      />

      <input type="hidden" name="loginType" value={loginType} />

      {loginType === "instructor" ? (
        <Input
          label="Email"
          type="email"
          name="identifier"
          autoComplete="username"
          inputMode="email"
          placeholder="name@example.org"
          autoFocus
          required
        />
      ) : (
        <Input
          label="Learner ID"
          type="text"
          name="identifier"
          autoComplete="username"
          placeholder="MVR-123456"
          autoFocus
          required
        />
      )}

      <Input
        label="Password"
        type={visible ? "text" : "password"}
        name="password"
        autoComplete="current-password"
        onKeyUp={trackCapsLock}
        onBlur={() => setCapsLock(false)}
        helper={
          capsLock ? (
            <span className={s.caps}>Caps Lock is on.</span>
          ) : undefined
        }
        required
        trailing={
          <button
            type="button"
            className={s.reveal}
            onClick={() => setVisible((on) => !on)}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff className={s.revealIcon} aria-hidden="true" />
            ) : (
              <Eye className={s.revealIcon} aria-hidden="true" />
            )}
            {visible ? "Hide" : "Show"}
          </button>
        }
      />

      <Button
        variant="primary"
        size="lg"
        block
        type="submit"
        loading={pending}
        className={s.submit}
      >
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
