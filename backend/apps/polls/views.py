from django.db.models import Count
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Poll, Vote
from .serializers import PollDetailSerializer, PollListSerializer, VoteSerializer


class PollListView(APIView):
    """Список активных голосований школы."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        polls = Poll.objects.filter(
            school_id=request.user.school_id,
            is_active=True,
        ).select_related("school").order_by("-created_at")

        serializer = PollListSerializer(polls, many=True)
        return Response(serializer.data)


class PollDetailView(APIView):
    """Детальная информация о голосовании."""
    permission_classes = [IsAuthenticated]

    def get(self, request, poll_id):
        try:
            poll = Poll.objects.get(
                pk=poll_id,
                school_id=request.user.school_id,
            )
        except Poll.DoesNotExist:
            return Response({"error": "Голосование не найдено"}, status=404)

        serializer = PollDetailSerializer(poll, context={"request": request})
        return Response(serializer.data)


class PollVoteView(APIView):
    """Проголосовать в голосовании."""
    permission_classes = [IsAuthenticated]

    def post(self, request, poll_id):
        try:
            poll = Poll.objects.get(
                pk=poll_id,
                school_id=request.user.school_id,
                is_active=True,
            )
        except Poll.DoesNotExist:
            return Response({"error": "Голосование не найдено"}, status=404)

        if poll.is_over:
            return Response({"error": "Голосование завершено"}, status=400)

        serializer = VoteSerializer(
            data=request.data,
            context={"request": request},
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        option = serializer.context["option"]
        Vote.objects.create(user=request.user, option=option)

        return Response({"success": True, "option_id": str(option.id)})


class PollResultsView(APIView):
    """Результаты голосования."""
    permission_classes = [IsAuthenticated]

    def get(self, request, poll_id):
        try:
            poll = Poll.objects.get(
                pk=poll_id,
                school_id=request.user.school_id,
            )
        except Poll.DoesNotExist:
            return Response({"error": "Голосование не найдено"}, status=404)

        options = poll.options.annotate(vote_count=Count("votes"))

        total = sum(o.vote_count for o in options) or 1
        results = [
            {
                "id": str(o.id),
                "text": o.text,
                "image": o.image.url if o.image else None,
                "vote_count": o.vote_count,
                "percentage": round((o.vote_count / total) * 100),
            }
            for o in options
        ]

        return Response({
            "poll_id": str(poll.id),
            "title": poll.title,
            "total_votes": poll.total_votes,
            "results": results,
        })