from django.db import migrations


def seed_achievements_and_themes(apps, schema_editor):
    Achievement = apps.get_model("users", "Achievement")
    ProfileTheme = apps.get_model("users", "ProfileTheme")

    # Seed default achievements
    achievements = [
        {
            "slug": "first-post",
            "name": "Первый пост",
            "description": "Опубликуйте свою первую запись в ленте",
            "category": "content",
            "icon_name": "FileText",
            "condition_code": "posts_count>=1",
            "sort_order": 1,
        },
        {
            "slug": "100-likes",
            "name": "Популярность",
            "description": "Получите 100 лайков на свои публикации",
            "category": "social",
            "icon_name": "Heart",
            "condition_code": "likes_received>=100",
            "sort_order": 2,
        },
        {
            "slug": "top-contributor",
            "name": "Лучший контрибьютор",
            "description": "Наберите более 500 очков вклада",
            "category": "special",
            "icon_name": "Crown",
            "condition_code": "total_points>=500",
            "sort_order": 3,
        },
        {
            "slug": "class-warrior",
            "name": "Воин класса",
            "description": "Наберите более 100 очков вклада для своего класса",
            "category": "class",
            "icon_name": "Shield",
            "condition_code": "total_points>=100",
            "sort_order": 4,
        },
        {
            "slug": "7-day-streak",
            "name": "Недельный марафон",
            "description": "Заходите в приложение 7 дней подряд",
            "category": "streak",
            "icon_name": "Flame",
            "condition_code": "current_streak>=7",
            "sort_order": 5,
        },
    ]

    for data in achievements:
        Achievement.objects.update_or_create(slug=data["slug"], defaults=data)

    # Seed default and premium themes
    themes = [
        {
            "slug": "cosmic",
            "name": "Космическая тема",
            "label_ru": "Космос",
            "primary_color": "#818cf8",
            "gradient_from": "#1e1b4b",
            "gradient_to": "#0f0f0f",
            "card_border": "#2e2e2e",
            "is_premium": False,
            "sort_order": 1,
        },
        {
            "slug": "gold",
            "name": "Золотая тема",
            "label_ru": "Золото",
            "primary_color": "#fbbf24",
            "gradient_from": "#78350f",
            "gradient_to": "#0f0f0f",
            "card_border": "#2e2e2e",
            "is_premium": True,
            "sort_order": 2,
        },
        {
            "slug": "matrix",
            "name": "Матрица",
            "label_ru": "Матрица",
            "primary_color": "#22c55e",
            "gradient_from": "#052e16",
            "gradient_to": "#0f0f0f",
            "card_border": "#2e2e2e",
            "is_premium": True,
            "sort_order": 3,
        },
        {
            "slug": "sunset",
            "name": "Закат",
            "label_ru": "Закат",
            "primary_color": "#f43f5e",
            "gradient_from": "#581c87",
            "gradient_to": "#0f0f0f",
            "card_border": "#2e2e2e",
            "is_premium": True,
            "sort_order": 4,
        },
    ]

    for theme_data in themes:
        ProfileTheme.objects.update_or_create(slug=theme_data["slug"], defaults=theme_data)


def rollback_achievements_and_themes(apps, schema_editor):
    Achievement = apps.get_model("users", "Achievement")
    ProfileTheme = apps.get_model("users", "ProfileTheme")

    Achievement.objects.filter(
        slug__in=["first-post", "100-likes", "top-contributor", "class-warrior", "7-day-streak"]
    ).delete()
    ProfileTheme.objects.filter(slug__in=["cosmic", "gold", "matrix", "sunset"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0003_add_profile_first_last_name"),
    ]

    operations = [
        migrations.RunPython(seed_achievements_and_themes, rollback_achievements_and_themes),
    ]
