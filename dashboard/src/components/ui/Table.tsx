import type { ReactNode, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cx } from "@/lib/cx";
import s from "./Table.module.css";

export type TableProps = {
  children: ReactNode;
  /** Accessible name, e.g. "Alignment and position, planned versus achieved". */
  label: string;
  /** Drop the wrapper's own border when nested in a padding="none" Card. */
  bare?: boolean;
  className?: string;
};

export function Table({ children, label, bare, className }: TableProps) {
  return (
    <div className={cx(s.wrap, bare && s.bare, className)}>
      <table className={s.table} aria-label={label}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export type TrProps = {
  children: ReactNode;
  /** Tints the whole row. The row must still contain a Badge stating why. */
  state?: "pass" | "warn" | "fail";
  className?: string;
};

export function Tr({ children, state, className }: TrProps) {
  return (
    <tr
      className={cx(
        s.row,
        state === "pass" && s.rowPass,
        state === "warn" && s.rowWarn,
        state === "fail" && s.rowFail,
        className,
      )}
    >
      {children}
    </tr>
  );
}

export type ThProps = ThHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
};

export function Th({ numeric, className, children, ...rest }: ThProps) {
  return (
    <th
      scope="col"
      className={cx(s.th, numeric && s.numeric, className)}
      {...rest}
    >
      {children}
    </th>
  );
}

export type TdProps = TdHTMLAttributes<HTMLTableCellElement> & {
  numeric?: boolean;
  /** Renders as the row's header cell — the parameter or entity name. */
  head?: boolean;
};

export function Td({ numeric, head, className, children, ...rest }: TdProps) {
  const classes = cx(s.td, numeric && s.numeric, head && s.key, className);

  if (head) {
    return (
      <th scope="row" className={classes} {...rest}>
        {children}
      </th>
    );
  }

  return (
    <td className={classes} {...rest}>
      {children}
    </td>
  );
}

/** Units live in their own muted span so the digits themselves stay aligned. */
export function Unit({ children }: { children: ReactNode }) {
  return <span className={s.unit}> {children}</span>;
}

export function TableCaption({ children }: { children: ReactNode }) {
  return <p className={s.caption}>{children}</p>;
}
