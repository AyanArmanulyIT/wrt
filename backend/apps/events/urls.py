from django.urls import path

from .views import EventDetailView, EventListView, EventRegisterView, EventUnregisterView

urlpatterns = [
    path("events/", EventListView.as_view(), name="event-list"),
    path("events/<uuid:event_id>/", EventDetailView.as_view(), name="event-detail"),
    path("events/<uuid:event_id>/register/", EventRegisterView.as_view(), name="event-register"),
    path("events/<uuid:event_id>/unregister/", EventUnregisterView.as_view(), name="event-unregister"),
]