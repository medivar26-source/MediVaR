"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CircleHelp,
  LogOut,
  Search,
  Settings,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
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
import type { NavNotification } from "@/lib/data/nav";
import type { Profile } from "@/lib/types";
import { SearchDialog } from "./SearchDialog";
import s from "./AppShell.module.css";

export type Notification = NavNotification;

export function TopBar({
  user,
  persona,
  searchHint,
  notifications,
}: {
  user: Profile;
  persona: Persona;
  searchHint: string;
  notifications: Notification[];
}) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

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
          className={s.search}
          onClick={() => setSearchOpen(true)}
        >
          <Search className={s.searchIcon} strokeWidth={2} aria-hidden="true" />
          <span className={s.searchLabel}>{searchHint}</span>
          <span className={s.searchKey}>⌘K</span>
        </button>

        <div className={s.topRight}>
          <Popover
            label="Display options"
            trigger={
              <span className={s.iconBtn}>
                <SlidersHorizontal width={18} height={18} strokeWidth={1.75} />
              </span>
            }
          >
            {(close) => (
              <>
                <PopoverHeading>Display</PopoverHeading>
                <PopoverItem
                  onClick={close}
                  meta="Light theme is the only build"
                  selected
                >
                  Light
                </PopoverItem>
                <PopoverItem onClick={close} meta="Planned, not built">
                  Dark
                </PopoverItem>
                <PopoverDivider />
                <PopoverItem icon={Settings} onClick={() => router.push("/settings")}>
                  All settings
                </PopoverItem>
              </>
            )}
          </Popover>

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
                  icon={UserRound}
                  onClick={() => {
                    close();
                    router.push("/settings");
                  }}
                >
                  Account
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
