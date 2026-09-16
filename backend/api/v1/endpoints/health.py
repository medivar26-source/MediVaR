from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health_check():
    """
    Basic health check endpoint.
    """
    return {"status": "ok"}

@router.get("/ready")
def readiness_check():
    """
    Readiness check endpoint.
    """
    # In the future, this should check DB connectivity, Supabase access, etc.
    return {"status": "ready"}
