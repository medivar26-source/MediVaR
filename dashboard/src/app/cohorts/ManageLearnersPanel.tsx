"use client";

import { useActionState, useEffect } from "react";
import { Copy, UserPlus, FileText } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";
import { createLearner, addExistingLearner, LearnerProvisionState } from "../actions";
import p from "../panels.module.css";

const initialState: LearnerProvisionState = {};

export function ManageLearnersPanel({ cohortId }: { cohortId: string }) {
  const [createState, createAction, isCreating] = useActionState(createLearner, initialState);
  const [addState, addAction, isAdding] = useActionState(addExistingLearner, initialState);

  return (
    <div className={p.rows}>
      {/* Create New Learner */}
      <div className={p.row}>
        <div className={p.rowBody}>
          <p className={p.rowTitle}>Create New Learner</p>
          <p className={p.rowDesc}>
            Generate a new Learner ID and password for a student, and enroll them in this cohort.
          </p>
          <form action={createAction} className={p.form}>
            <input type="hidden" name="cohortId" value={cohortId} />
            <div className={p.formRow}>
              <Input name="firstName" label="First Name" placeholder="Jane" required />
              <Input name="lastName" label="Last Name" placeholder="Doe" required />
              <Button type="submit" variant="primary" disabled={isCreating}>
                <UserPlus size={16} style={{ marginRight: "0.5rem" }} />
                {isCreating ? "Creating..." : "Create Learner"}
              </Button>
            </div>
            {createState.error && <p className={p.error}>{createState.error}</p>}
            {createState.success && (
              <div className={p.successPanel}>
                <p><strong>Success!</strong> Learner account created.</p>
                <div className={p.credentials}>
                  <div>
                    <span className={p.credLabel}>Learner ID:</span>
                    <code className={p.credValue}>{createState.learnerId}</code>
                  </div>
                  <div>
                    <span className={p.credLabel}>Temporary Password:</span>
                    <code className={p.credValue}>{createState.tempPassword}</code>
                  </div>
                </div>
                <p className={p.note}>Share these credentials securely. They will not be shown again.</p>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Add Existing Learner */}
      <div className={p.row}>
        <div className={p.rowBody}>
          <p className={p.rowTitle}>Add Existing Learner</p>
          <p className={p.rowDesc}>
            If a learner already has a MediVeR account, enroll them here using their Learner ID.
          </p>
          <form action={addAction} className={p.form}>
            <input type="hidden" name="cohortId" value={cohortId} />
            <div className={p.formRow}>
              <Input name="learnerId" label="Learner ID" placeholder="MVR-XXXXXX" required />
              <Button type="submit" variant="secondary" disabled={isAdding}>
                <FileText size={16} style={{ marginRight: "0.5rem" }} />
                {isAdding ? "Adding..." : "Add Learner"}
              </Button>
            </div>
            {addState.error && <p className={p.error}>{addState.error}</p>}
            {addState.success && <p className={p.success}>Learner successfully enrolled.</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
