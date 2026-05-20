from rest_framework.permissions import BasePermission


def user_has_admin_access(user) -> bool:
    return bool(
        user
        and user.is_authenticated
        and (user.is_superuser or user.is_staff or getattr(user, "is_school_moderator", False))
    )


class IsAdminUser(BasePermission):
    message = "Нет доступа к панели администратора."

    def has_permission(self, request, view):
        return user_has_admin_access(request.user)
