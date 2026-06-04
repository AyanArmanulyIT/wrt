"""
Security middleware and utilities for WRT.
Provides rate limiting, security headers, and input sanitization.
"""
import re
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Adds security headers to all responses:
    - Content-Security-Policy (CSP)
    - X-Content-Type-Options
    - X-Frame-Options
    - Referrer-Policy
    - Permissions-Policy
    """

    def process_response(self, request, response):
        response["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https: ws: wss:; "
            "frame-ancestors 'none';"
        )
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=(), "
            "fullscreen=(self), display-capture=()"
        )
        return response


class RateLimitMiddleware(MiddlewareMixin):
    """
    In-memory rate limiting per IP.
    Auth endpoints: 10 req/min, API endpoints: 100 req/min.
    """

    def __init__(self, get_response=None):
        super().__init__(get_response)
        self._cache: dict[str, list[int]] = {}

    def process_view(self, request, view_func, view_args, view_kwargs):
        if not request.path.startswith("/api/"):
            return None

        ip = self._get_client_ip(request)
        now = self._get_timestamp()
        is_auth = "/auth/" in request.path
        max_requests = 10 if is_auth else 100
        window = 60

        self._clean_expired(now - window)

        key = f"{ip}:{request.path}"
        if key not in self._cache:
            self._cache[key] = []

        self._cache[key] = [t for t in self._cache[key] if t > now - window]

        if len(self._cache[key]) >= max_requests:
            return HttpResponse(
                "Too Many Requests. Please slow down.",
                status=429,
                content_type="text/plain",
            )

        self._cache[key].append(now)
        return None

    def _get_client_ip(self, request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR", "unknown")

    def _get_timestamp(self):
        import time
        return int(time.time())

    def _clean_expired(self, cutoff):
        for key in list(self._cache.keys()):
            self._cache[key] = [t for t in self._cache[key] if t > cutoff]
            if not self._cache[key]:
                del self._cache[key]


# ---- Input Sanitization ----

def sanitize_html(text: str) -> str:
    """
    Sanitize user-provided content.
    Strips script tags, javascript: URIs, event handlers, and all HTML tags.
    """
    if not text:
        return ""
    text = re.sub(r"<script[^>]*>.*?</script>", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"javascript\s*:", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\bon\w+\s*=", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]*>", "", text)
    return text.strip()


def sanitize_text(text: str) -> str:
    """Sanitize plain text: strip HTML, normalize whitespace."""
    if not text:
        return ""
    text = re.sub(r"<[^>]*>", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


# ---- Upload Validation ----

MAX_IMAGE_SIZE = 8 * 1024 * 1024  # 8MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}


def validate_uploaded_image(uploaded_file) -> str | None:
    """Validate uploaded image. Returns None if valid, error message string otherwise."""
    import os

    if uploaded_file.size > MAX_IMAGE_SIZE:
        return f"Изображение не должно превышать {MAX_IMAGE_SIZE // (1024*1024)}MB."

    content_type = getattr(uploaded_file, "content_type", None)
    if content_type and content_type not in ALLOWED_IMAGE_TYPES:
        return "Поддерживаются только JPEG, PNG, WebP, GIF, AVIF."

    _, ext = os.path.splitext(uploaded_file.name.lower())
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return "Недопустимый формат файла."

    return None