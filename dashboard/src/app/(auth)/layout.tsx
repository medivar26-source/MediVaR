// app/(auth)/layout.tsx
"use client";

import { usePathname } from "next/navigation";
import AuthBrandPanel from "@/components/auth/AuthBrandPanel";
import styles from "./layout.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isForgotPassword = pathname === "/forgot-password";

  return (
    <div className={styles.layoutContainer}>
      {isForgotPassword ? (
        <AuthBrandPanel
          heading={<>Locked out?<br />We&apos;ve got you.</>}
          description="Surgical training requires secure and uninterrupted access. Let's get you back to your TKR training rehearsals quickly and safely."
        />
      ) : (
        <AuthBrandPanel />
      )}
      {children}
    </div>
  );
}