/**
 * Pure validation helpers for authentication and credential changes.
 * Can be tested directly in unit tests without Next.js runtime dependencies.
 */

export type PasswordValidationResult = {
  isValid: boolean;
  error?: string;
};

export function validatePasswordChange(
  currentPassword?: string | null,
  newPassword?: string | null,
  confirmPassword?: string | null,
): PasswordValidationResult {
  const current = currentPassword?.trim() ?? "";
  const next = newPassword ?? "";
  const confirm = confirmPassword ?? "";

  if (!current || !next || !confirm) {
    return {
      isValid: false,
      error: "All password fields are required.",
    };
  }

  if (next.length < 8) {
    return {
      isValid: false,
      error: "New password must be at least 8 characters long.",
    };
  }

  if (next !== confirm) {
    return {
      isValid: false,
      error: "New password and confirmation do not match.",
    };
  }

  if (next === current) {
    return {
      isValid: false,
      error: "New password must be different from current password.",
    };
  }

  return { isValid: true };
}
