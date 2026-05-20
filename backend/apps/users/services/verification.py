from django.utils import timezone

from apps.school.models import School, SchoolClass, SchoolInviteCode
from apps.users.models import User


def _email_domain(email: str) -> str:
    return email.split("@")[-1].lower().strip()


def verify_school_invite_code(school: School, code: str) -> tuple[bool, str]:
    invite = (
        SchoolInviteCode.objects.filter(
            school=school,
            code__iexact=code.strip(),
            is_active=True,
        )
        .select_related("school")
        .first()
    )
    if not invite:
        return False, "Неверный код школы."
    if invite.expires_at and invite.expires_at < timezone.now():
        return False, "Срок действия кода истёк."
    if invite.max_uses is not None and invite.uses_count >= invite.max_uses:
        return False, "Код уже использован максимальное число раз."
    invite.uses_count += 1
    invite.save(update_fields=["uses_count"])
    return True, "invite"


def verify_email_domain(school: School, email: str) -> tuple[bool, str]:
    domain = _email_domain(email)
    allowed = [d.lower() for d in (school.allowed_email_domains or [])]
    if not allowed:
        return False, "Для этой школы не настроены email-домены."
    if domain not in allowed:
        return False, f"Email должен быть с домена: {', '.join(allowed)}"
    return True, "email"


def run_verification(
    user: User,
    *,
    invite_code: str = "",
    class_code: str = "",
) -> tuple[bool, str]:
    """
    Проверяет пользователя по настройкам школы.
    Возвращает (успех, метод или сообщение об ошибке).
    """
    school = user.school
    if not school:
        return False, "Школа не выбрана."

    mode = school.verification_mode

    if mode == School.VerificationMode.INVITE:
        if not invite_code:
            return False, "Укажите код школы."
        ok, result = verify_school_invite_code(school, invite_code)
        if not ok:
            return False, result
        user.mark_verified(result)
        return True, result

    if mode == School.VerificationMode.EMAIL:
        ok, result = verify_email_domain(school, user.email)
        if not ok:
            return False, result
        user.mark_verified(result)
        return True, result

    if mode == School.VerificationMode.CLASS_CODE:
        # MVP: class_code = slug класса + invite (упрощённо — проверка класса в школе)
        if not class_code or not user.school_class:
            return False, "Выберите класс и укажите код класса."
        if user.school_class.slug != class_code.strip().lower():
            return False, "Неверный код класса."
        user.mark_verified("class_code")
        return True, "class_code"

    # manual — остаётся pending до approve в админке
    return False, "Ожидайте подтверждения модератором школы."
