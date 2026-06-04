from .base import *

# Dev settings
DEBUG = True

# Add security middleware to the base middleware list
import copy
if "core.security.RateLimitMiddleware" not in MIDDLEWARE:
    MIDDLEWARE.insert(1, "core.security.SecurityHeadersMiddleware")
    MIDDLEWARE.insert(2, "core.security.RateLimitMiddleware")

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DATABASE_NAME", "wrt_db"),
        "USER": os.getenv("DATABASE_USER", "wrt_user"),
        "PASSWORD": os.getenv("DATABASE_PASSWORD", "password"),
        "HOST": os.getenv("DATABASE_HOST", "localhost"),
        "PORT": os.getenv("DATABASE_PORT", "5432"),
    }
}