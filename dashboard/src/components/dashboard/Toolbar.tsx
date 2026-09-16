"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, ChevronDown, Download, Share2 } from "lucide-react";
import {
  Popover,
  PopoverHeading,
  PopoverItem,
} from "@/components/ui/Popover";
import { cx } from "@/lib/cx";
import type { WindowSpec } from "@/lib/window";
import s from "./dashboard.module.css";

/**
 * The row above the hero.
 *
 * It used to carry filter chips, a density menu and a timeframe that all
 * toggled and changed nothing on the page — a static picture of a control,
 * which is not allowed. Neither is here.
 * The timeframe stayed and was made real: it writes `?weeks=` to the URL, the
 * server re-runs the accessors over that window, and every chart moves.
 *
 * Weeks rather than days because that is the unit the data has. `weekly_activity`
 * and `cohort_weekly_activity` bucket by week, so "last 7 days" would have
 * plotted a single point and called it a trend.
 */

export type ToolbarProps = {
  /** Rows exported when Download is used. First row is the header. */
  exportRows: (string | number)[][];
  exportName: string;
  window: WindowSpec;
  /** Button rendered inline with the timeframe, for the list this page summarises. */
  action?: { label: string; href: string };
};

export function Toolbar({
  exportRows,
  exportName,
  window: spec,
  action,
}: ToolbarProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [shared, setShared] = useState(false);

  const current =
    spec.options.find((o) => o.value === spec.value) ?? spec.options[0];

  const setWindow = (value: number) => {
    const search = new URLSearchParams(params.toString());
    if (value === spec.fallback) search.delete(spec.param);
    else search.set(spec.param, String(value));
    const qs = search.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  };

  const download = () => {
    const csv = exportRows
      .map((row) =>
        row
          .map((cell) => {
            const value = String(cell);
            return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
          })
          .join(","),
      )
      .join("\n");

    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // Clipboard can be blocked by permissions; fail quietly rather than
      // throwing an error the user cannot act on.
    }
  };

  return (
    <div className={s.contextRow}>
      {action && (
        <Link href={action.href} className={s.ctxAction}>
          {action.label}
          <ArrowRight width={15} height={15} strokeWidth={2} />
        </Link>
      )}

      <div className={s.ctxRight}>
        <button
          type="button"
          className={s.ctxIcon}
          onClick={download}
          aria-label="Download as CSV"
          title="Download as CSV"
        >
          <Download width={16} height={16} strokeWidth={1.75} />
        </button>

        <button
          type="button"
          className={cx(s.ctxIcon, shared && s.ctxIconDone)}
          onClick={share}
          aria-label={shared ? "Link copied" : "Copy link"}
          title={shared ? "Link copied" : "Copy link"}
        >
          {shared ? (
            <Check width={16} height={16} strokeWidth={2.5} />
          ) : (
            <Share2 width={16} height={16} strokeWidth={1.75} />
          )}
        </button>

        <Popover
          label="Change the window these figures cover"
          trigger={
            <span className={s.timeframe}>
              {current.label}
              <ChevronDown width={14} height={14} strokeWidth={2} />
            </span>
          }
        >
          {(close) => (
            <>
              <PopoverHeading>Window</PopoverHeading>
              {spec.options.map((option) => (
                <PopoverItem
                  key={option.value}
                  selected={option.value === spec.value}
                  meta={option.value === spec.fallback ? "Default" : undefined}
                  onClick={() => {
                    setWindow(option.value);
                    close();
                  }}
                >
                  {option.label}
                </PopoverItem>
              ))}
            </>
          )}
        </Popover>
      </div>
    </div>
  );
}
