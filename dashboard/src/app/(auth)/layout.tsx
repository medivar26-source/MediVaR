// app/(auth)/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import styles from "./layout.module.css";

const LOGIN_PATH = "/login";
const FORGOT_PASSWORD_PATH = "/forgot-password";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isForgotPassword = pathname === FORGOT_PASSWORD_PATH;
  // Sign-in styles itself straight onto the gradient; every other page sits on a sheet.
  const isLogin = pathname === LOGIN_PATH;

  return (
    <div className={styles.layoutContainer}>
      <div className={styles.card}>
      {isForgotPassword ? (
        <AuthBrandPanel
          heading={<>Locked out?<br />We&apos;ve got you.</>}
          description="Surgical training requires secure and uninterrupted access. Let's get you back to your TKR training rehearsals quickly and safely."
        />
      ) : (
        <AuthBrandPanel />
      )}
      {isLogin ? children : <div className={styles.sheet}>{children}</div>}
      </div>
    </div>
  );
}
