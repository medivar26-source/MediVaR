// components/auth/AuthBrandPanel.tsx
import { ShieldCheck } from "lucide-react";
import AuthFeatureGrid from "./AuthFeatureGrid";
import styles from "./AuthBrandPanel.module.css";

interface AuthBrandPanelProps {
  heading?: React.ReactNode;
  description?: string;
}

export default function AuthBrandPanel({
  heading = (
    <>
      Plan it precisely.<br />Practice it confidently.
    </>
  ),
  description = "Step into immersive, patient-specific surgical TKR rehearsals — bridging the gap between planning and performance.",
}: AuthBrandPanelProps) {
  return (
    <div className={styles.container} data-brand-panel>

      {/* top: logo + name */}
      <div className={styles.logoContainer}>
        <span className={styles.logoIconWrapper}>
          <ShieldCheck className={styles.logoIcon} strokeWidth={2} />
        </span>
        <div>
          <div className={styles.brandName}>MediVeR</div>
          <div className={styles.brandSubtitle}>TKR VR Training Platform</div>
        </div>
      </div>

      {/* middle: heading + description. Fixed size, so it never moves when the grid below is hovered. */}
      <div className={styles.heroContent}>
        <h1 className={styles.heading}>
          {heading}
        </h1>
        <p className={styles.description}>
          {description}
        </p>
      </div>

      {/* bottom: the feature grid, the same on every auth page, including forgot-password */}
      <AuthFeatureGrid />

    </div>
  );
}
