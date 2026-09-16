"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { useId } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { cx } from "@/lib/cx";
import s from "./Field.module.css";

/**
 * Labels are always visible — a placeholder is never used as a label.
 * Errors sit below their own field and state the fix, not just the fault.
 */

type FieldShellProps = {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: (ids: {
    id: string;
    describedBy: string | undefined;
    invalid: boolean;
  }) => ReactNode;
};

function FieldShell({
  label,
  helper,
  error,
  required,
  optional,
  className,
  children,
}: FieldShellProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy =
    [error ? errorId : null, helper ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cx(s.field, className)}>
      <label className={s.label} htmlFor={id}>
        {label}
        {required && (
          <span className={s.required} aria-hidden="true">
            *
          </span>
        )}
        {required && <span className="srOnly">(required)</span>}
        {optional && <span className={s.optional}>Optional</span>}
      </label>

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error && (
        <p className={s.error} id={errorId} role="alert">
          <TriangleAlert className={s.errorIcon} aria-hidden="true" />
          {error}
        </p>
      )}
      {helper && !error && (
        <p className={s.helper} id={helperId}>
          {helper}
        </p>
      )}
    </div>
  );
}

/* ---------- Input ---------- */

export type InputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "className"
> & {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  /**
   * A control rendered inside the field, against its right edge — a show/hide
   * toggle, a unit, a clear button. It sits inside the border rather than
   * beside it, so the whole thing still reads as one field.
   */
  trailing?: ReactNode;
};

export function Input({
  label,
  helper,
  error,
  required,
  optional,
  className,
  trailing,
  ...rest
}: InputProps) {
  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {({ id, describedBy, invalid }) => {
        const control = (
          <input
            id={id}
            required={required}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            className={cx(
              s.control,
              Boolean(trailing) && s.controlTrailing,
              invalid && s.invalid,
            )}
            {...rest}
          />
        );

        if (!trailing) return control;

        return (
          <span className={s.controlWrap}>
            {control}
            <span className={s.trailing}>{trailing}</span>
          </span>
        );
      }}
    </FieldShell>
  );
}

/* ---------- Select ---------- */

export type SelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "id" | "className"
> & {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
};

export function Select({
  label,
  helper,
  error,
  required,
  optional,
  className,
  children,
  ...rest
}: SelectProps) {
  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cx(s.control, s.select, invalid && s.invalid)}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}

/* ---------- Textarea ---------- */

export type TextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "id" | "className"
> & {
  label: string;
  helper?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
};

export function Textarea({
  label,
  helper,
  error,
  required,
  optional,
  className,
  ...rest
}: TextareaProps) {
  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      required={required}
      optional={optional}
      className={className}
    >
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          className={cx(s.control, s.textarea, invalid && s.invalid)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

/* ---------- Checkbox ---------- */

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  label: ReactNode;
  helper?: ReactNode;
  className?: string;
};

export function Checkbox({ label, helper, className, ...rest }: CheckboxProps) {
  return (
    <label className={cx(s.check, className)}>
      <input type="checkbox" className={s.checkInput} {...rest} />
      <span className={s.checkBox} aria-hidden="true">
        <Check className={s.checkIcon} strokeWidth={3} />
      </span>
      <span className={s.checkBody}>
        <span className={s.checkLabel}>{label}</span>
        {helper && <span className={s.checkHelper}>{helper}</span>}
      </span>
    </label>
  );
}
