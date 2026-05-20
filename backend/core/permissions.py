from rest_framework.permissions import BasePermission


class IsVerifiedUser(BasePermission):
    """Доступ только после подтверждения школы."""

    message = "Подтвердите, что вы учитесь в выбранной школе."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return getattr(user, "verification_status", None) == "verified"


class IsSchoolModerator(BasePermission):
    """Модератор школы или суперпользователь."""

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and (user.is_superuser or getattr(user, "is_school_moderator", False))
        )
