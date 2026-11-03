"use client";

import { useEffect, useRef, useState } from "react";
import type { NavData } from "@/lib/data/nav";
import type { Persona } from "@/lib/roles";
import { SideNav } from "./SideNav";
import s from "./AppShell.module.css";

/** The drawer's closing slide (--m-base, 220 ms) plus a frame, so the menu is not emptied mid-slide. */
const CLOSE_MS = 260;

/**
 * The main menu on a phone, where the sidebar has no room. It is the same sidebar, opened as a drawer from
 * the left on the platform's own `<dialog>`, so focus stays inside it, Escape closes it and the page behind
 * is inert. Its content exists only while it is open (and while it slides away), so the page never holds
 * two copies of the menu for long.
 */
export function MobileNav({
  open,
  onClose,
  persona,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  persona: Persona;
  nav: NavData;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  // The menu is created on the render that opens the drawer and removed once it has slid away.
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open || !mounted) return;
    const timer = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  // Widened past phone width with the drawer open, the sidebar is back, so the drawer goes.
  useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia("(min-width: 768px)");
    const onChange = () => wide.matches && onClose();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [open, onClose]);

  return (
    <dialog
      ref={ref}
      className={s.drawer}
      aria-label="Main menu"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // A tap on the backdrop lands on the dialog element itself, not on the menu.
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {mounted && <SideNav persona={persona} nav={nav} drawer={{ onClose }} />}
    </dialog>
  );
}
