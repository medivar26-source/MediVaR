import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { connection } from "next/server";
import { AppFrame } from "@/components/shell/AppFrame";
import { getNavData, type NavData } from "@/lib/data/nav";
import { getOptionalUser } from "@/lib/session";
import "./globals.css";
/**
 * One family for the whole product, in two optical roles.
 *
 * The brief asked for PayPal Sans throughout — a rounded geometric sans —
 * and flagged that it is proprietary. Plus Jakarta Sans is the closest freely
 * licensable equivalent: geometric skeleton, softly cut terminals, an open
 * aperture that holds up at 13px, and eight weights so hierarchy comes from
 * weight rather than from a second family.
 *
 * It carries `tnum`, checked in the shipped Google build rather than assumed —
 * every numeric column in the report depends on tabular figures
 *). Figtree and Inter were both rejected; Inter in particular is the default of
 * every dashboard on the internet and read as one.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MediVeR XR",
    template: "%s · MediVeR XR",
  },
  description:
    "Virtual-reality surgical simulation for Total Knee Replacement. Plan a case, perform it in the headset, and review it against your own plan.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f7a46",
};

/**
 * The signed-in app frame (side navigation and top bar) is drawn here, once, so it stays mounted while the
 * user moves between pages. It needs the user and the navigation data, which are per user and per request,
 * so this layout is dynamic. Public screens (sign-in) get no user and render without the frame.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const user = await getOptionalUser();
  const nav = user ? await getNavData(user).catch(() => EMPTY_NAV) : null;

  return (
    <html lang="en" className={jakarta.variable} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppFrame user={user} nav={nav}>
          {children}
        </AppFrame>
      </body>
    </html>
  );
}

/** Used only if the navigation data cannot be read: the frame still renders, without counts. */
const EMPTY_NAV: NavData = { counts: {}, pinned: [], notifications: [] };
