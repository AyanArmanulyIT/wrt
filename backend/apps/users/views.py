from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.users.auth_serializers import WRTTokenObtainPairSerializer

from apps.users.serializers import (
    RegisterSerializer,
    UserSerializer,
    VerifySchoolSerializer,
)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        output = UserSerializer(user)
        return Response(output.data, status=status.HTTP_201_CREATED)


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return (
            type(self.request.user)
            .objects.select_related("school", "school_class", "profile")
            .get(pk=self.request.user.pk)
        )

    def retrieve(self, request, *args, **kwargs):
        from apps.class_clash.services.points import award_daily_login

        award_daily_login(request.user)
        return super().retrieve(request, *args, **kwargs)


class VerifySchoolView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VerifySchoolSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        user = (
            type(request.user)
            .objects.select_related("school", "school_class", "profile")
            .get(pk=request.user.pk)
        )
        return Response(UserSerializer(user).data)


class LoginView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = WRTTokenObtainPairSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
