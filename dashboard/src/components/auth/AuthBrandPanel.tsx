// components/auth/AuthBrandPanel.tsx
import { Target, StepForward, ShieldCheck, CheckCircle2 } from "lucide-react";
import styles from "./AuthBrandPanel.module.css";

const features = [
  { icon: Target, title: "Practice before", subtitle: "the procedure." },
  { icon: StepForward, title: "Every step.", subtitle: "Every Attempt. Measured." },
  { icon: ShieldCheck, title: "Repeat without", subtitle: "risks." },
  { icon: CheckCircle2, title: "From first", subtitle: "incision to final closure." },
];

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
    <div className={styles.container}>

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

      {/* middle: heading + description */}
      <div className={styles.heroContent}>
        <h1 className={styles.heading}>
          {heading}
        </h1>
        <p className={styles.description}>
          {description}
        </p>
      </div>

      {/* bottom: 4-icon feature row — unchanged on every page, including forgot-password */}
      <div className={styles.featuresRow}>
        {features.map(({ icon: Icon, title, subtitle }, i) => (
          <div key={title} className={styles.featureItem}>
            <div className={styles.featureContent}>
              <span className={styles.featureIconWrapper}>
                <Icon className={styles.featureIcon} strokeWidth={1.5} />
              </span>
              <p className={styles.featureText}>
                {title}<br />{subtitle}
              </p>
            </div>
            {i < features.length - 1 && (
              <div className={styles.separator} />
            )}
          </div>
        ))}
      </div>

    </div>
  );
}