"use client";

import { useEffect } from "react";
import {
  EMBED_CLASS,
  EMBED_PARAM,
  SCROLLING_CLASS,
  SETTINGS_PATH,
  isEmbedded,
} from "@/lib/embed";

/**
 * Runs only inside the settings modal's iframe (`?embed=1`).
 *
 * 1. Marks <html> and <body> as embedded, which switches on the auto-hiding
 *    scrollbar in globals.css.
 * 2. Adds `is-scrolling` while the page scrolls and removes it once scrolling has
 *    been idle for `--scroll-idle`, so the scrollbar thumb only exists in motion.
 * 3. Sends any link that leaves settings to the top window. Without this, "Open
 *    reports" would load the whole app inside the little modal.
 */
export function EmbedLinkRedirect() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!isEmbedded(params.get(EMBED_PARAM))) return;

    const roots = [document.documentElement, document.body];
    roots.forEach((el) => el.classList.add(EMBED_CLASS));

    const idleMs =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--scroll-idle")) || 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      roots.forEach((el) => el.classList.add(SCROLLING_CLASS));
      clearTimeout(timer);
      timer = setTimeout(() => {
        roots.forEach((el) => el.classList.remove(SCROLLING_CLASS));
      }, idleMs);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || (anchor.target && anchor.target !== "_self")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === SETTINGS_PATH) return;
      if (!window.top || window.top === window) return;
      event.preventDefault();
      event.stopPropagation();
      window.top.location.assign(url.href);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      clearTimeout(timer);
      roots.forEach((el) => el.classList.remove(EMBED_CLASS, SCROLLING_CLASS));
    };
  }, []);

  return null;
}
