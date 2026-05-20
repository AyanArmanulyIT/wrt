from django.http import JsonResponse
from django.urls import path


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "wrt-api"})


urlpatterns = [
    path("", health_check, name="health"),
]
