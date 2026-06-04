from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.users.urls")),
    path("api/v1/", include("apps.school.urls")),
    path("api/v1/", include("apps.posts.urls")),
    path("api/v1/", include("apps.class_clash.urls")),
    path("api/v1/", include("apps.recommendations.urls")),
    path("api/v1/", include("apps.notifications.urls")),
    path("api/v1/", include("apps.adminpanel.urls")),
    path("api/v1/", include("apps.chats.urls")),
    path("api/v1/", include("apps.polls.urls")),
    path("api/v1/", include("apps.events.urls")),
    path("api/health/", include("core.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
