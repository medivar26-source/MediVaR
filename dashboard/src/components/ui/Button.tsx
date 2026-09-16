import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Button.module.css";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tonal"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Icon rendered before the label. */
  icon?: LucideIcon;
  /** Icon rendered after the label — chevrons, external-link marks. */
  trailingIcon?: LucideIcon;
  block?: boolean;
  loading?: boolean;
  children?: ReactNode;
  /**
   * Renders a link that looks like a button. A control that navigates must be
   * an anchor — middle-click, copy-link and the status bar all depend on it,
   * and a button that does nothing is not allowed.
   */
  href?: string;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  trailingIcon: TrailingIcon,
  block,
  loading,
  disabled,
  className,
  children,
  href,
  type = "button",
  ...rest
}: ButtonProps) {
  const iconOnly = !children;
  const classes = cx(
    s.btn,
    s[variant],
    size !== "md" && s[size],
    block && s.block,
    iconOnly && s.iconOnly,
    className,
  );

  if (href && !disabled && !loading) {
    return (
      <Link href={href} className={classes} aria-label={rest["aria-label"]}>
        {Icon && <Icon className={s.icon} strokeWidth={2} aria-hidden="true" />}
        {children}
        {TrailingIcon && (
          <TrailingIcon className={s.icon} strokeWidth={2} aria-hidden="true" />
        )}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {loading ? (
        <span className={s.spinner} aria-hidden="true" />
      ) : (
        Icon && <Icon className={s.icon} aria-hidden="true" strokeWidth={1.75} />
      )}
      {children && <span className={s.label}>{children}</span>}
      {TrailingIcon && !loading && (
        <TrailingIcon className={s.icon} aria-hidden="true" strokeWidth={1.75} />
      )}
    </button>
  );
}
