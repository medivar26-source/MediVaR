import test from "node:test";
import assert from "node:assert/strict";
import { validatePasswordChange } from "../auth-validation";
import type { Profile } from "../types";

test("Password change validation rules", async (t) => {
  await t.test("rejects empty fields", () => {
    assert.deepEqual(validatePasswordChange("", "newpassword123", "newpassword123"), {
      isValid: false,
      error: "All password fields are required.",
    });

    assert.deepEqual(validatePasswordChange("oldpass123", "", "newpassword123"), {
      isValid: false,
      error: "All password fields are required.",
    });

    assert.deepEqual(validatePasswordChange("oldpass123", "newpassword123", ""), {
      isValid: false,
      error: "All password fields are required.",
    });

    assert.deepEqual(validatePasswordChange(undefined, "newpassword123", "newpassword123"), {
      isValid: false,
      error: "All password fields are required.",
    });
  });

  await t.test("rejects new passwords under 8 characters", () => {
    assert.deepEqual(validatePasswordChange("oldpass123", "short7", "short7"), {
      isValid: false,
      error: "New password must be at least 8 characters long.",
    });
  });

  await t.test("rejects mismatched new and confirmation passwords", () => {
    assert.deepEqual(
      validatePasswordChange("oldpass123", "secret_pass_1", "secret_pass_2"),
      {
        isValid: false,
        error: "New password and confirmation do not match.",
      },
    );
  });

  await t.test("rejects new password identical to current password", () => {
    assert.deepEqual(
      validatePasswordChange("samepassword123", "samepassword123", "samepassword123"),
      {
        isValid: false,
        error: "New password must be different from current password.",
      },
    );
  });

  await t.test("accepts valid password change inputs", () => {
    const result = validatePasswordChange(
      "temporary_pass_123",
      "new_secure_pass_456",
      "new_secure_pass_456",
    );
    assert.equal(result.isValid, true);
    assert.equal(result.error, undefined);
  });
});

test("Learner profile credential integrity", async (t) => {
  await t.test("profile supports learnerId for account display", () => {
    const learnerProfile: Profile = {
      id: "user-uuid-1",
      displayName: "Dr Vinith Kumar",
      role: "resident",
      defaultDifficulty: "intermediate",
      learnerId: "MVR-F9F0PS",
      email: "mvr-f9f0ps@learner.mediver.local",
      createdAt: "2026-09-17T10:00:00Z",
    };

    assert.equal(learnerProfile.learnerId, "MVR-F9F0PS");
    assert.ok(learnerProfile.learnerId.startsWith("MVR-"));
    assert.equal(learnerProfile.role, "resident");
  });
});
