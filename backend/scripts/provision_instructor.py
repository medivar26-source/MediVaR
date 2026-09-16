"""
Instructor account provisioning script.

Creates a new instructor account:
  1. Gets or creates the institution.
  2. Creates a Supabase Auth user (email + temporary password).
  3. Creates the application users row with role='instructor'.

Usage (run from the backend/ directory):
    python scripts/provision_instructor.py \\
        --email instructor@hospital.org \\
        --first-name Helen \\
        --last-name Ward \\
        --institution "Mediver Demo Hospital" \\
        --password TempPass123!

Security notes:
  - The password is read from --password flag OR from the PROVISION_PASSWORD
    environment variable to avoid shell history exposure.
  - The password is NEVER logged or printed after the account is created.
  - Requires SUPABASE_SERVICE_ROLE_KEY to be set in .env.
"""
import argparse
import os
import sys

# Allow running from project root or backend/ directory
_here = os.path.dirname(os.path.abspath(__file__))
_backend = os.path.dirname(_here)
if _backend not in sys.path:
    sys.path.insert(0, _backend)

from core.config import settings  # noqa: E402
from services.auth_service import provision_instructor  # noqa: E402


def main():
    parser = argparse.ArgumentParser(
        description="Provision a MediVeR instructor account.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--email", required=True, help="Instructor email address")
    parser.add_argument("--first-name", required=True, help="First name")
    parser.add_argument("--last-name", required=True, help="Last name")
    parser.add_argument("--institution", required=True, help="Institution name")
    parser.add_argument(
        "--password",
        default=None,
        help="Temporary password (or set PROVISION_PASSWORD env var)",
    )
    args = parser.parse_args()

    # Resolve password from arg or env var
    password = args.password or os.environ.get("PROVISION_PASSWORD")
    if not password:
        print(
            "ERROR: Supply --password or set the PROVISION_PASSWORD environment variable.",
            file=sys.stderr,
        )
        sys.exit(1)

    if len(password) < 8:
        print("ERROR: Password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    # Verify required configuration is present
    if not settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_SERVICE_ROLE_KEY == "your-service-role-key-here":
        print(
            "ERROR: SUPABASE_SERVICE_ROLE_KEY is not configured.\n"
            "Retrieve it from Supabase Dashboard > Settings > API > service_role secret\n"
            "and add it to your .env file.",
            file=sys.stderr,
        )
        sys.exit(1)

    print(f"Provisioning instructor account for: {args.email}")
    print(f"Name:        {args.first_name} {args.last_name}")
    print(f"Institution: {args.institution}")
    print()

    try:
        profile = provision_instructor(
            email=args.email,
            first_name=args.first_name,
            last_name=args.last_name,
            institution_name=args.institution,
            temp_password=password,
        )
    except ValueError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)

    # Success — print the created account details (no password)
    print("Instructor account created successfully.")
    print(f"  User ID:     {profile.id}")
    print(f"  Email:       {profile.email}")
    print(f"  Name:        {profile.display_name}")
    print(f"  Role:        {profile.role}")
    print(f"  Institution: {args.institution} ({profile.institution_id})")
    print()
    print("The instructor may now log in at the MediVeR portal with their email")
    print("and the temporary password you provided. Advise them to change it.")
    print()
    print("IMPORTANT: Do not log, share or commit the temporary password.")


if __name__ == "__main__":
    main()
