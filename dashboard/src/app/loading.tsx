import { Skeleton } from "@/components/ui";
import s from "./states.module.css";

/**
 * Skeleton blocks matching the final layout, no spinner and no
 * shimmer. The shapes below are the page header, the four-card stat row and
 * the two-column body every screen in this app resolves to, so nothing jumps
 * when the data lands.
 */
export default function Loading() {
  return (
    <div className={s.loading} aria-busy="true" aria-live="polite">
      <span className={s.srOnly}>Loading</span>

      <div className={s.head}>
        <Skeleton width="220px" height="14px" />
        <Skeleton width="380px" height="34px" />
        <Skeleton width="520px" height="16px" />
      </div>

      <div className={s.row}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height="104px" block />
        ))}
      </div>

      <div className={s.body}>
        <Skeleton height="280px" block />
        <Skeleton height="280px" block />
      </div>
    </div>
  );
}
