from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "MediVeR XR Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Supabase Configuration
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""         # Publishable/anon key — safe to expose to browser
    SUPABASE_SERVICE_ROLE_KEY: str = "" # Server-only. NEVER expose to the browser.
    SUPABASE_JWT_SECRET: str = ""       # Used to verify Supabase-issued JWTs server-side.

    # Public URL of the dashboard. Used to build links in auth emails (password reset).
    FRONTEND_URL: str = "http://localhost:3000"

    # DB direct connection (IPv4 pooler — verified working)
    SUPABASE_DB_URL: str = ""

    # Database connection pool. Opening a connection to the hosted database is slow, so requests share a few.
    # Set DB_POOL_ENABLED=false to open one per call, as before.
    DB_POOL_ENABLED: bool = True
    DB_POOL_MIN: int = 1
    DB_POOL_MAX: int = 10
    DB_CONNECT_TIMEOUT: int = 10          # seconds to wait for a new database connection

    # Deadlines for calls to Supabase (seconds), so a slow upstream cannot hold a request open.
    SUPABASE_HTTP_TIMEOUT: int = 15
    SUPABASE_STORAGE_TIMEOUT: int = 30

    # Responses smaller than this (bytes) are not worth compressing.
    GZIP_MINIMUM_SIZE: int = 1024

    # Legacy alias kept for backwards-compat with existing code
    @property
    def SUPABASE_KEY(self) -> str:  # noqa: N802
        """Return service role key if available, else anon key."""
        return self.SUPABASE_SERVICE_ROLE_KEY or self.SUPABASE_ANON_KEY

    class Config:
        case_sensitive = True
        env_file = "../.env"
        extra = "ignore"


settings = Settings()
