import type { Metadata } from "next";
import Link from "next/link";
import { AppShell, PageHeader, SectionHeader } from "@/components/shell";
import { Badge, Button, Chip } from "@/components/ui";
import { cx } from "@/lib/cx";
import { getSettings } from "@/lib/data/settings";
import { relativeTime, shortDate, titleCase } from "@/lib/format";
import { personaFor, ROLE_LABEL } from "@/lib/roles";
import { getCurrentUser } from "@/lib/session";
import { AccountForm } from "./AccountForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import p from "../panels.module.css";
import s from "./settings.module.css";

export const metadata: Metadata = { title: "Settings" };

const TABS = [
  { value: "account", label: "Account" },
  { value: "display", label: "Display" },
  { value: "pairing", label: "Device & pairing" },
  { value: "data", label: "Data" },
  { value: "about", label: "About" },
] as const;

type Tab = (typeof TABS)[number]["value"];

/**
 * Five tabs, and the tab is the URL — the same ruling `/performance` made in
 * A settings screen is somewhere people are sent ("check Settings →
 * Device & pairing"), and a section you cannot link to cannot be sent to.
 */
export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: raw } = await searchParams;
  const tab: Tab = (TABS.find((t) => t.value === raw)?.value ?? "account") as Tab;

  const user = await getCurrentUser();
  const view = await getSettings(user);
  const persona = personaFor(user.role);

  return (
    <AppShell user={user} searchHint='Try searching "settings"'>
      <PageHeader
        title="Settings"
        lede="Your account, how the product looks, how a headset reaches it, and what this build is made of."
      />

      {/* The tab is the URL, and each one is an anchor, so
          "check Settings → Device & pairing" can be a link rather than an
          instruction. */}
      <nav className={p.tabs} aria-label="Settings sections">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={t.value === "account" ? "/settings" : `/settings?tab=${t.value}`}
            className={cx(p.tab, tab === t.value && p.tabOn)}
            aria-current={tab === t.value ? "page" : undefined}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "account" && (
        <>
          <section className={p.panel} aria-label="Your details">
            <div className={p.panelHead}>
              <div>
                <p className={p.panelTitle}>Your details</p>
                <p className={p.panelSub}>
                  Three fields are yours to change. The rest of an account is
                  administered.
                </p>
              </div>
            </div>

            <AccountForm
              displayName={user.displayName}
              level={user.level}
              defaultDifficulty={user.defaultDifficulty}
            />
          </section>

          <SectionHeader title="Security" />

          <section className={p.panel} aria-label="Change password">
            <div className={p.panelHead}>
              <div>
                <p className={p.panelTitle}>Change password</p>
                <p className={p.panelSub}>
                  Update your password to keep your account secure. If you are signing in with an instructor-issued temporary password, set a personal password here.
                </p>
              </div>
            </div>

            <ChangePasswordForm />
          </section>

          <SectionHeader title="Administered" />

          <section className={p.panel} aria-label="Administered fields">
            <p className={p.panelSub}>
              Each of these decides what you can see or who your results are
              compared against, so none of them is self-service. An administrator
              changes them through the account management screen.
            </p>

            <div className={p.rows}>
              {user.learnerId && (
                <div className={s.administered}>
                  <span>Learner ID</span>
                  <span className={s.administeredValue} style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}>
                    {user.learnerId}
                  </span>
                </div>
              )}
              {user.email && !user.email.endsWith("@learner.mediver.local") && (
                <div className={s.administered}>
                  <span>Email address</span>
                  <span className={s.administeredValue}>{user.email}</span>
                </div>
              )}
              <div className={s.administered}>
                <span>Role</span>
                <span className={s.administeredValue}>
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
              <div className={s.administered}>
                <span>Cohort</span>
                <span className={s.administeredValue}>
                  {view.cohortName ?? "Not in a cohort"}
                </span>
              </div>
              {view.presetName && (
                <div className={s.administered}>
                  <span>Configuration preset</span>
                  <span className={s.administeredValue}>{view.presetName}</span>
                </div>
              )}
              <div className={s.administered}>
                <span>Account created</span>
                <span className={s.administeredValue}>
                  {shortDate(user.createdAt)}
                </span>
              </div>
            </div>

            <p className={p.note}>
              Your cohort decides which population your percentile is computed
              against and which instructor sees your work.{" "}
              {view.presetName
                ? `Plans you start are stamped with ${view.presetName}, and any session run from one says so on its report.`
                : "Your cohort has no configuration preset, so your sessions run against the authored tolerances."}
            </p>
          </section>
        </>
      )}

      {tab === "display" && (
        <section className={p.panel} aria-label="Display">
          <div className={p.panelHead}>
            <div>
              <p className={p.panelTitle}>Display</p>
              <p className={p.panelSub}>
                Light theme only, at 1280px and above.
              </p>
            </div>
          </div>

          <div className={p.rows}>
            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Theme</p>
                <p className={p.rowDetail}>
                  Dark theme is a token swap with no component changes — planned
                  not scheduled. There is no control here rather
                  than a control that does nothing.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">Light</Chip>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Units</p>
                <p className={p.rowDetail}>
                  Degrees and millimetres throughout. Every tolerance is
                  authored in them, so a conversion would be a second
                  representation of a graded number.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">Metric</Chip>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Motion</p>
                <p className={p.rowDetail}>
                  Follows your system setting. Nothing in this product animates
                  on its own — there are no pulsing status dots, because on a
                  clinical dashboard a blinking light reads as an alarm.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">System</Chip>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Minimum width</p>
                <p className={p.rowDetail}>
                  Planning needs precise measurement, so it is desktop-only by
                  design. Reports and performance stay readable
                  below that.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">1280px</Chip>
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "pairing" && (
        <>
          <section className={p.panel} aria-label="Data source">
            <div className={p.panelHead}>
              <div>
                <p className={p.panelTitle}>Data source</p>
                <p className={p.panelSub}>{view.source.label}</p>
              </div>
              <Badge status="warn">Not connected</Badge>
            </div>
            <p className={p.panelSub}>{view.source.detail}</p>
          </section>

          <SectionHeader title="Your pairing PINs" />

          {view.pins.length === 0 ? (
            <section className={p.panel} aria-label="Pairing PINs">
              <p className={p.panelSub}>
                No PIN has been issued for any of your plans. A PIN is minted
                from a sealed plan, lives thirty minutes, and can be used once.
              </p>
              <div>
                <Button href="/plans" variant="secondary">
                  Go to your plans
                </Button>
              </div>
            </section>
          ) : (
            <section className={p.panel} aria-label="Pairing PINs">
              <div className={p.rows}>
                {view.pins.map((pin) => (
                  <div key={`${pin.planId}-${pin.expiresAt}`} className={p.row}>
                    <div className={p.rowBody}>
                      <p className={p.rowTitle}>{pin.caseTitle}</p>
                      <p className={p.rowDetail}>
                        {pin.state === "redeemed"
                          ? `Redeemed ${relativeTime(pin.redeemedAt, new Date().toISOString())} — a headset paired`
                          : pin.state === "live"
                            ? `Expires ${relativeTime(pin.expiresAt, new Date().toISOString())}`
                            : `Expired ${relativeTime(pin.expiresAt, new Date().toISOString())}`}
                      </p>
                    </div>
                    <div className={p.rowAside}>
                      <Chip tone="muted">
                        {pin.state === "redeemed"
                          ? "Used"
                          : pin.state === "live"
                            ? "Live"
                            : "Expired"}
                      </Chip>
                      <Button
                        variant="ghost"
                        size="sm"
                        href={
                          pin.sessionId
                            ? `/sessions/${pin.sessionId}`
                            : `/plan/${pin.planId}/saved`
                        }
                      >
                        {pin.sessionId ? "Session" : "Plan"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className={p.note}>
                The digits are not listed here and are not stored anywhere this
                browser can read. They are shown once, on the plan that issued
                them, with a countdown.
              </p>
            </section>
          )}

        </>
      )}

      {tab === "data" && (
        <section className={p.panel} aria-label="Data">
          <div className={p.panelHead}>
            <div>
              <p className={p.panelTitle}>Data</p>
              <p className={p.panelSub}>What exists, and what it is made of.</p>
            </div>
          </div>

          <div className={p.rows}>
            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Your reports</p>
                <p className={p.rowDetail}>
                  Every report you may read, with the figures the database
                  derived. A CSV of any table on screen is a download away from
                  the screen it is on.
                </p>
              </div>
              <div className={p.rowAside}>
                <Button href="/reports" variant="secondary" size="sm">
                  Open
                </Button>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>PDF export</p>
                <p className={p.rowDetail}>
                  Not built. `reports.pdf_path` exists and is null on every row,
                  and a button that produced nothing would be worse than saying
                  so. The report screen is print-faithful in the meantime.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">Not built</Chip>
              </div>
            </div>

            <div className={p.row}>
              <div className={p.rowBody}>
                <p className={p.rowTitle}>Deleting your data</p>
                <p className={p.rowDetail}>
                  Not self-service. A report is evidence about training that
                  happened and an instructor&rsquo;s cohort figures are computed
                  from it, so removal is an administrator&rsquo;s decision rather
                  than a button.
                </p>
              </div>
              <div className={p.rowAside}>
                <Chip tone="muted">Ask an administrator</Chip>
              </div>
            </div>
          </div>

          <p className={p.note}>
            No patient data exists anywhere in this product. Every case is
            synthetic, which is what keeps information-governance scope narrow — there is nothing here to identify anybody but you.
          </p>
        </section>
      )}

      {tab === "about" && (
        <section className={p.panel} aria-label="About">
          <div className={p.panelHead}>
            <div>
              <p className={p.panelTitle}>About</p>
              <p className={p.panelSub}>MediVeR XR — {titleCase(persona)} view</p>
            </div>
          </div>

          <dl className={p.kv}>
            {view.about.map((fact) => (
              <div key={fact.label} style={{ display: "contents" }}>
                <dt>{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>

          <p className={p.note}>
            Where a document and the code disagree, the code is what ships, and
            The deviation and the reason are recorded alongside it.
          </p>
        </section>
      )}
    </AppShell>
  );
}
