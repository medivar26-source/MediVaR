from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    """
    Basic health check endpoint. The headset reads `serverTimeUtc` to learn its clock offset and any 200 as
    "the dashboard is reachable" (its gateway chip); `status` is what existed before and stays.
    """
    return {
        "status": "ok",
        "service": "mediver-api",
        "apiVersion": 1,
        "serverTimeUtc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

@router.get("/ready")
def readiness_check():
    """
    Readiness check endpoint.
    """
    # In the future, this should check DB connectivity, Supabase access, etc.
    return {"status": "ready"}
