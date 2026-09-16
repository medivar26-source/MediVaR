import type { Metadata } from "next";
import { ClipboardCheck, Headset, Stethoscope } from "lucide-react";
import { SignInForm } from "./SignInForm";
import s from "./login.module.css";

export const metadata: Metadata = { title: "Sign in" };

/**
 * The sign-in flow: single card, inline errors, no "Create account" and no
 * "Forgot password" in Phase 1 — sign-up is disabled at the Auth level and
 * accounts are provisioned by an administrator. The guard is built so both are
 * additive later, when Resend lands.
 *
 * Layout: each half is a three-row grid — mark, content, footnote — so neither
 * column has a dead top third. The earlier version centred one stack per side,
 * which left the brand floating in white space and the panel copy sunk to the
 * bottom edge.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className={s.page}>
      <div className={s.formSide}>
        <div className={s.brand}>
          <span className={s.mark} aria-hidden="true">
            <Stethoscope width={22} height={22} strokeWidth={2} />
          </span>
          <span className={s.brandText}>
            <span className={s.wordmark}>MEDIVER</span>
            <span className={s.tagline}>XR Surgical</span>
          </span>
        </div>

        <div className={s.formWrap}>
          <div className={s.formBlock}>
            <h1 className={s.title}>Sign in</h1>
            <p className={s.lede}>
              Sign in to the MediVeR XR dashboard as an Instructor or Learner.
            </p>

            <SignInForm next={next} />
          </div>
        </div>

        <p className={s.footnote}>
          Accounts are created by your administrator. There is no public sign-up,
          and no self-serve password reset in this phase — if you cannot get in,
          ask them to reset it for you.
        </p>
      </div>

      <aside className={s.aside}>
        <p className={s.asideEyebrow}>MediVeR XR · Phase 1</p>

        <div className={s.asideMain}>
          <p className={s.asideQuote}>
            Scored against your own plan, not a generic ideal.
          </p>
          <p className={s.asideSub}>
            Seven pre-operative planning steps produce a plan and a four-digit
            pairing PIN. Eleven operative parts run in the headset. The report
            compares what you planned with what you achieved.
          </p>

          <dl className={s.figures}>
            <div className={s.figure}>
              <dt>7</dt>
              <dd>Planning steps</dd>
            </div>
            <div className={s.figure}>
              <dt>11</dt>
              <dd>Operative parts</dd>
            </div>
            {/* Seven, not six. `Exposure and closure` became a
                real category worth 5 when the other six were found to sum to 95
                against a score shown out of 100 — `report_category_meta` has
                held seven rows ever since, and this was the last place in the
                product still saying otherwise. */}
            <div className={s.figure}>
              <dt>7</dt>
              <dd>Scored categories</dd>
            </div>
          </dl>
        </div>

        <div className={s.asideFoot}>
          <div className={s.loop}>
            <span className={s.loopStep}>
              <ClipboardCheck className={s.loopIcon} strokeWidth={2} />
              Plan
            </span>
            <span className={s.loopArrow} aria-hidden="true">
              →
            </span>
            <span className={s.loopStep}>
              <Headset className={s.loopIcon} strokeWidth={2} />
              Perform
            </span>
            <span className={s.loopArrow} aria-hidden="true">
              →
            </span>
            <span className={s.loopStep}>
              <Stethoscope className={s.loopIcon} strokeWidth={2} />
              Review
            </span>
          </div>

          <p className={s.asideNote}>
            Every case is synthetic. No patient data is stored anywhere in the
            product.
          </p>
        </div>
      </aside>
    </div>
  );
}
