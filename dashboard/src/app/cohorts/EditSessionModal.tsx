"use client";

import { useState, useActionState, useEffect } from "react";
import { Edit2, X } from "lucide-react";
import { Banner, Button, Input } from "@/components/ui";
import { updateSession, type SessionState } from "@/app/actions";
import type { SessionSummary } from "@/lib/data/cohorts";
import p from "../panels.module.css";

export function EditSessionModal({ session }: { session: SessionSummary }) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, pending] = useActionState<SessionState, FormData>(
    updateSession,
    {},
  );

  // Close modal on successful update
  useEffect(() => {
    if (state.saved) {
      setIsOpen(false);
    }
  }, [state.saved]);

  // Format date string for datetime-local input (YYYY-MM-DDTHH:mm)
const defaultScheduled = session.scheduledAt
  ? (() => {
      const date = new Date(session.scheduledAt);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    })()
  : "";

  return (
    <>
      <Button
        variant="secondary"
        icon={Edit2}
        type="button"
        onClick={() => setIsOpen(true)}
      >
        Edit
      </Button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--color-bg, #fff)",
              padding: "1.5rem",
              borderRadius: "8px",
              width: "100%",
              maxWidth: "500px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem" }}>Edit Session</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {state.error && (
                <Banner tone="fail" title="Update failed">
                  {state.error}
                </Banner>
              )}

              <input type="hidden" name="sessionId" value={session.id} />
              <input type="hidden" name="cohortId" value={session.cohortId} />

              <Input
                label="Session Name"
                name="name"
                defaultValue={session.name}
                required
              />

              <Input
                label="Scheduled Date & Time"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={defaultScheduled}
                required
              />

              <Input
                label="Duration (minutes)"
                name="duration"
                type="number"
                min={5}
                max={480}
                defaultValue={session.duration}
                required
              />

              <Input
                label="Description (optional)"
                name="description"
                defaultValue={session.description ?? ""}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                <Button variant="secondary" type="button" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" loading={pending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}