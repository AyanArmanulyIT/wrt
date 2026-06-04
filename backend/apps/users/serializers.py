from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.school.models import School, SchoolClass
from apps.users.models import UserProfile, Achievement, UserAchievement, UserStreak, ProfileTheme
from apps.users.services.verification import run_verification

User = get_user_model()


class ProfileThemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProfileTheme
        fields = ("slug", "label_ru", "primary_color", "gradient_from", "gradient_to", "card_border", "is_premium")


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ("name", "slug", "description", "category", "icon_name", "condition_code")


class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)

    class Meta:
        model = UserAchievement
        fields = ("achievement", "unlocked_at")


class UserStreakSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserStreak
        fields = ("current_streak", "longest_streak", "last_login_date")


class UserProfileSerializer(serializers.ModelSerializer):
    class_name = serializers.CharField(source="user.school_class.name", read_only=True)
    school_name = serializers.CharField(source="user.school.name", read_only=True)
    theme = ProfileThemeSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            "username",
            "first_name",
            "last_name",
            "avatar",
            "bio",
            "total_points",
            "posts_count",
            "comments_count",
            "likes_received",
            "class_name",
            "school_name",
            "theme",
        )
        read_only_fields = fields


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "verification_status",
            "is_verified",
            "school",
            "school_class",
            "profile",
            "is_staff",
            "is_superuser",
            "is_school_moderator",
            "created_at",
        )
        read_only_fields = fields


class PublicProfileSerializer(serializers.Serializer):
    """Full public profile data."""
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    avatar = serializers.URLField(allow_null=True)
    bio = serializers.CharField()
    total_points = serializers.IntegerField()
    posts_count = serializers.IntegerField()
    comments_count = serializers.IntegerField()
    likes_received = serializers.IntegerField()
    class_name = serializers.CharField(allow_null=True)
    school_name = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField()
    
    # Achievements
    achievements = UserAchievementSerializer(many=True)
    
    # Streak
    streak = UserStreakSerializer(allow_null=True)
    
    # Theme
    theme = ProfileThemeSerializer(allow_null=True)
    
    # Contribution from class_clash
    week_points = serializers.IntegerField()
    class_rank = serializers.IntegerField()
    class_total = serializers.IntegerField()
    contribution_by_action = serializers.DictField(child=serializers.IntegerField())
    
    # Badges
    is_verified = serializers.BooleanField()
    is_staff = serializers.BooleanField()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    username = serializers.CharField(min_length=3, max_length=50)
    school_slug = serializers.SlugField()
    school_class_id = serializers.UUIDField(required=False, allow_null=True)
    invite_code = serializers.CharField(required=False, allow_blank=True)
    class_code = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Пользователь с таким email уже существует.")
        return value.lower()

    def validate_username(self, value):
        if UserProfile.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Имя пользователя занято.")
        return value

    def validate(self, attrs):
        school = School.objects.filter(slug=attrs["school_slug"], is_active=True).first()
        if not school:
            raise serializers.ValidationError({"school_slug": "Школа не найдена."})
        attrs["school"] = school

        class_id = attrs.get("school_class_id")
        if class_id:
            school_class = SchoolClass.objects.filter(id=class_id, school=school).first()
            if not school_class:
                raise serializers.ValidationError({"school_class_id": "Класс не найден в этой школе."})
            attrs["school_class"] = school_class
        else:
            attrs["school_class"] = None

        return attrs

    def create(self, validated_data):
        school = validated_data["school"]
        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            school=school,
            school_class=validated_data.get("school_class"),
        )
        UserProfile.objects.create(user=user, username=validated_data["username"])

        ok, _ = run_verification(
            user,
            invite_code=validated_data.get("invite_code", ""),
            class_code=validated_data.get("class_code", ""),
        )
        if not ok and school.verification_mode == "manual":
            user.verification_status = User.VerificationStatus.PENDING
            user.save(update_fields=["verification_status", "updated_at"])

        return user


class VerifySchoolSerializer(serializers.Serializer):
    invite_code = serializers.CharField(required=False, allow_blank=True)
    class_code = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        user = self.context["request"].user
        if user.is_verified:
            raise serializers.ValidationError("Вы уже подтверждены.")
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        ok, message = run_verification(
            user,
            invite_code=self.validated_data.get("invite_code", ""),
            class_code=self.validated_data.get("class_code", ""),
        )
        if not ok:
            raise serializers.ValidationError({"detail": message})
        return user