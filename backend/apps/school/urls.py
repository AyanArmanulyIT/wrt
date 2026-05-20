from django.urls import path

from .views import SchoolClassListView, SchoolListView

urlpatterns = [
    path("schools/", SchoolListView.as_view(), name="school-list"),
    path("schools/<slug:school_slug>/classes/", SchoolClassListView.as_view(), name="school-class-list"),
]
