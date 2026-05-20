from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import School, SchoolClass
from .serializers import SchoolClassSerializer, SchoolSerializer


class SchoolListView(generics.ListAPIView):
    """Список активных школ (для регистрации)."""
    queryset = School.objects.filter(is_active=True)
    serializer_class = SchoolSerializer
    permission_classes = [AllowAny]
    pagination_class = None


class SchoolClassListView(generics.ListAPIView):
    """Классы выбранной школы."""
    serializer_class = SchoolClassSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return SchoolClass.objects.filter(
            school__slug=self.kwargs["school_slug"],
            school__is_active=True,
        ).select_related("school")
