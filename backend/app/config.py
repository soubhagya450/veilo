import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "veilo-fallback-secret-key-32-chars-long")
    REDIS_URL = os.getenv("REDIS_URL", "").strip()
    ROOM_TTL_SECONDS = int(os.getenv("ROOM_TTL_SECONDS", "1800"))
    SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "3600"))
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()

    # Allowed CORS / Socket origins (defaults to * so any Vercel domain connects seamlessly)
    _frontend_origins = os.getenv("FRONTEND_ORIGIN", "*").strip()
    if not _frontend_origins or _frontend_origins == "*":
        CORS_ALLOWED_ORIGINS = ["*"]
    else:
        CORS_ALLOWED_ORIGINS = [
            origin.strip() for origin in _frontend_origins.split(",") if origin.strip()
        ]


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    # Allow all local dev origins or configured origins
    if "*" not in Config.CORS_ALLOWED_ORIGINS and not Config.CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS = ["*"]


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    LOG_LEVEL = os.getenv("LOG_LEVEL", "WARNING").upper()


class TestingConfig(Config):
    """Testing configuration."""
    TESTING = True
    DEBUG = True
    SECRET_KEY = "test-secret-key-for-veilo-testing"
    CORS_ALLOWED_ORIGINS = ["*"]
    REDIS_URL = ""  # Use in-memory store in tests


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
