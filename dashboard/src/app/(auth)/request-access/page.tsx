"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Input } from "@/components/auth/ui/input";
import { Label } from "@/components/auth/ui/label";
import { Button } from "@/components/auth/ui/button";
import styles from "./request-access.module.css";

export default function RequestAccessPage() {
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [role, setRole] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit() {
    console.log({ fullName, workEmail, institution, role, reason });
    alert("Request submitted — this is a placeholder until the backend is wired up.");
  }

  return (
    <div className={styles.container}>
      <Link
        href="/"
        className={styles.backButton}
      >
        <ArrowLeft className={styles.backIcon} />
      </Link>

      <div className={styles.mainContent}>
        <div className={styles.formWrapper}>

          <div className={styles.header}>
            <h1 className={styles.title}>Request access</h1>
            <p className={styles.subtitle}>
              Fill in your details and we&apos;ll get back to you within 24 hours.
            </p>
          </div>

          <div className={styles.form}>
            <div className={styles.inputGroup}>
              <Label htmlFor="full-name">Full name</Label>
              <Input id="full-name" type="text" placeholder="Dr. Alexis Vance"
                value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className={styles.inputGroup}>
              <Label htmlFor="work-email">Work email</Label>
              <Input id="work-email" type="email" placeholder="vance@clinicalhospital.org"
                value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} />
            </div>

            <div className={styles.gridCols2}>
              <div className={styles.inputGroup}>
                <Label htmlFor="institution">Institution / Hospital</Label>
                <Input id="institution" type="text" placeholder="Metro Orthopedic Center"
                  value={institution} onChange={(e) => setInstitution(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <Label htmlFor="role">Role / Department</Label>
                <Input id="role" type="text" placeholder="Chief Orthopedic Resident"
                  value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <Label htmlFor="reason">Why are you interested in MediVeR XR?</Label>
              <textarea id="reason" rows={4}
                className={styles.textarea}
                placeholder="Explain clinical or training goals (e.g. resident onboarding, pre-op practice)..."
                value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>

            <Button className={styles.submitButton} onClick={handleSubmit}>
              Submit request
            </Button>

            <p className={styles.signInPrompt}>
              Already have an account?{" "}
              <Link href="/" className={styles.signInLink}>Sign in</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}