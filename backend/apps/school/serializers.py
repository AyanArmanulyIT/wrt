from rest_framework import serializers

from .models import School, SchoolClass


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = (
            "id",
            "name",
            "slug",
            "verification_mode",
            "allowed_email_domains",
        )


class SchoolClassSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source="school.name", read_only=True)

    class Meta:
        model = SchoolClass
        fields = (
            "id",
            "name",
            "slug",
            "school_name",
            "weekly_points",
            "total_points",
        )
