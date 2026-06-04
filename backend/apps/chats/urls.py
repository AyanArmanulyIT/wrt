from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.chats.views import ChatViewSet, MessageViewSet, OnlineStatusViewSet

router = DefaultRouter()
router.register(r"chats", ChatViewSet, basename="chat")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"online-status", OnlineStatusViewSet, basename="online-status")

urlpatterns = router.urls
