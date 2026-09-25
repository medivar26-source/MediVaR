from fastapi import APIRouter
from api.v1.endpoints import health, auth, cohorts, programs, cases, procedures, residents

api_router = APIRouter()
api_router.include_router(health.router, prefix="", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(programs.router, prefix="/programs", tags=["programs"])
api_router.include_router(cohorts.router, prefix="/cohorts", tags=["cohorts"])
api_router.include_router(cases.router, prefix="/cases", tags=["cases"])
api_router.include_router(procedures.router, prefix="/procedures", tags=["procedures"])
api_router.include_router(residents.router, prefix="/residents", tags=["residents"])
# Future routes:
# api_router.include_router(sessions.router, prefix="/sessions", tags=["sessions"])


