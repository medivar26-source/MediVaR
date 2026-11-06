from fastapi import APIRouter
from api.v1.endpoints import health, auth, cohorts, programs, cases, procedures, residents, admin, personal_cases, results, connect, plans, live

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(programs.router, prefix="/programs", tags=["programs"])
api_router.include_router(cohorts.router, prefix="/cohorts", tags=["cohorts"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(procedures.router, prefix="/procedures", tags=["procedures"])
api_router.include_router(residents.router, prefix="/residents", tags=["residents"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(personal_cases.router, prefix="/personal-cases", tags=["personal_cases"])
api_router.include_router(results.router, prefix="/results", tags=["results"])
# Pre-op plans in the database (404 until migration 013 is applied).
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
# Dashboard <-> Quest 3 (404 until migration 015 is applied). Paths are the headset plan's contract, so no prefix.
api_router.include_router(connect.router, prefix="", tags=["vr_connectivity"])
# Live view: events + eye-view frames from the headset, polled by the dashboard (404 until migration 016 is applied).
api_router.include_router(live.router, prefix="", tags=["live_view"])
# Future routes:
# api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
