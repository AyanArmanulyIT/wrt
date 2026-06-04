from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SchoolEvent, EventParticipant
from .serializers import (
    EventDetailSerializer,
    EventListSerializer,
    RegisterSerializer,
    UnregisterSerializer,
)


class EventListView(APIView):
    """Список событий школы."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = SchoolEvent.objects.filter(school_id=request.user.school_id).order_by("starts_at")
        serializer = EventListSerializer(events, many=True, context={"request": request})
        return Response(serializer.data)


class EventDetailView(APIView):
    """Детальная информация о событии."""
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        try:
            event = SchoolEvent.objects.get(pk=event_id, school_id=request.user.school_id)
        except SchoolEvent.DoesNotExist:
            return Response({"error": "Событие не найдено"}, status=404)

        serializer = EventDetailSerializer(event, context={"request": request})
        return Response(serializer.data)


class EventRegisterView(APIView):
    """Зарегистрироваться на событие."""
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        try:
            event = SchoolEvent.objects.get(pk=event_id, school_id=request.user.school_id)
        except SchoolEvent.DoesNotExist:
            return Response({"error": "Событие не найдено"}, status=404)

        serializer = RegisterSerializer(data={}, context={"request": request, "event": event})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        EventParticipant.objects.create(user=request.user, event=event)
        return Response({"success": True, "action": "registered"})


class EventUnregisterView(APIView):
    """Отменить регистрацию на событие."""
    permission_classes = [IsAuthenticated]

    def post(self, request, event_id):
        try:
            event = SchoolEvent.objects.get(pk=event_id, school_id=request.user.school_id)
        except SchoolEvent.DoesNotExist:
            return Response({"error": "Событие не найдено"}, status=404)

        serializer = UnregisterSerializer(data={}, context={"request": request, "event": event})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        EventParticipant.objects.filter(event=event, user=request.user).delete()
        return Response({"success": True, "action": "unregistered"})