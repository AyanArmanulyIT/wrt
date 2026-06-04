import os
import django
from django.core.asgi import get_asgi_application

# Use production settings on Railway, dev locally
DJANGO_SETTINGS_MODULE = os.getenv(
    "DJANGO_SETTINGS_MODULE",
    "config.settings.production" if os.getenv("RAILWAY_ENVIRONMENT") else "config.settings.dev"
)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", DJANGO_SETTINGS_MODULE)

django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter
from apps.chats.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(
        websocket_urlpatterns
    ),
})
