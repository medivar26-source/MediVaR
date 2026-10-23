"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Bell, CircleHelp, LogOut, Menu, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Popover,
  PopoverDivider,
  PopoverEmpty,
  PopoverHeading,
  PopoverItem,
} from "@/components/ui/Popover";
import { ROLE_LABEL } from "@/lib/roles";
import type { Persona } from "@/lib/roles";
import { initialsOf } from "@/lib/format";
import { signOut } from "@/app/actions";
import type { NavAction, NavNotification } from "@/lib/data/nav";
import type { Profile } from "@/lib/types";
import { SearchDialog } from "./SearchDialog";
import s from "./AppShell.module.css";

export type Notification = NavNotification;

const noSubscription = () => () => {};

export function TopBar({
  user,
  persona,
  searchHint,
  notifications,
  primaryAction,
  menuOpen,
  onOpenMenu,
}: {
  user: Profile;
  persona: Persona;
  searchHint: string;
  notifications: Notification[];
  /** The one thing this role most often comes here to do. */
  primaryAction?: NavAction;
  /** The phone menu: its button shows only where the sidebar has no room. */
  menuOpen: boolean;
  onOpenMenu: () => void;
}) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  // The shortcut is named the way this keyboard labels it. Read after mounting: the server cannot know.
  const isMac = useSyncExternalStore(
    noSubscription,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => false,
  );

  // ⌘K / Ctrl+K opens search from anywhere.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className={s.topbar}>
        <button
          type="button"
          className={s.menuBtn}
          onClick={onOpenMenu}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
        >
          <Menu width={20} height={20} strokeWidth={1.75} aria-hidden="true" />
        </button>

        <button
          type="button"
          className={s.search}
          onClick={() => setSearchOpen(true)}
          aria-label={`Search. ${searchHint}`}
          aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        >
          <Search className={s.searchIcon} strokeWidth={2} aria-hidden="true" />
          <span className={s.searchLabel} aria-hidden="true">{searchHint}</span>
          <kbd className={s.searchKey} aria-hidden="true">{isMac ? "⌘K" : "Ctrl K"}</kbd>
        </button>

        <div className={s.topRight}>
          {primaryAction && (
            <Button variant="primary" size="sm" href={primaryAction.href}>
              {primaryAction.label}
            </Button>
          )}

          <Popover
            label={
              notifications.length
                ? `Notifications, ${notifications.length} waiting`
                : "Notifications, none waiting"
            }
            trigger={
              <span className={s.iconBtn}>
                <Bell width={18} height={18} strokeWidth={1.75} />
                {notifications.length > 0 && (
                  <span className={s.iconDot} aria-hidden="true" />
                )}
              </span>
            }
          >
            {(close) => (
              <>
                <PopoverHeading>Notifications</PopoverHeading>
                {notifications.length === 0 ? (
                  <PopoverEmpty>
                    Nothing waiting. A running session, an interrupted one and a
                    new report all appear here.
                  </PopoverEmpty>
                ) : (
                  notifications.map((n) => (
                    <PopoverItem
                      key={n.id}
                      meta={n.meta}
                      onClick={() => {
                        close();
                        router.push(n.href);
                      }}
                    >
                      {n.title}
                    </PopoverItem>
                  ))
                )}
              </>
            )}
          </Popover>

          <Popover
            label="Account menu"
            trigger={
              <span className={s.avatar}>{initialsOf(user.displayName)}</span>
            }
          >
            {(close) => (
              <>
                <PopoverHeading>
                  {user.displayName} · {ROLE_LABEL[user.role]}
                </PopoverHeading>
                <PopoverItem
                  icon={Settings}
                  onClick={() => {
                    close();
                    router.push("/settings");
                  }}
                >
                  Account &amp; settings
                </PopoverItem>
                <PopoverItem
                  icon={CircleHelp}
                  onClick={() => {
                    close();
                    router.push("/help");
                  }}
                >
                  Help
                </PopoverItem>
                <PopoverDivider />
                <PopoverItem
                  icon={LogOut}
                  onClick={() => {
                    close();
                    // Server Action: clears the session, then
                    // redirects. Pushing to /login alone would leave the
                    // session alive and the guard would bounce straight back.
                    void signOut();
                  }}
                >
                  Sign out
                </PopoverItem>
              </>
            )}
          </Popover>

        </div>
      </header>

      <SearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        persona={persona}
      />
    </>
  );
}
