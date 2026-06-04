from django.urls import path
from apps.chats.consumers import ChatConsumer, NotificationConsumer

websocket_urlpatterns = [
    path("ws/chat/<uuid:chat_id>/", ChatConsumer.as_asgi(), name="ws-chat"),
    path("ws/notifications/", NotificationConsumer.as_asgi(), name="ws-notifications"),
]
