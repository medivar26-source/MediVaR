import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body>{children}</body>
    </html>
  );
}
