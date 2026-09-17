import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import styles from "./page.module.css";

export default function HelpPage() {
  return (
    <div className={styles.container}>
      <Link
        href="/"
        className={styles.backLink}
      >
        <ArrowLeft className={styles.backIcon} />
      </Link>

      <div className={styles.contentWrapper}>
        <div className={styles.textContainer}>
          <h1 className={styles.title}>Need help?</h1>
          <p className={styles.description}>
            Reach out to your program administrator or email{" "}
            <a href="mailto:support@mediver.com" className={styles.emailLink}>
              support@mediver.com
            </a>{" "}
            and we&apos;ll get back to you shortly.
          </p>
        </div>
      </div>
    </div>
  );
}