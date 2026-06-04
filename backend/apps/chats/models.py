import uuid
from django.db import models
from django.utils import timezone
from apps.users.models import User
from apps.school.models import SchoolClass


class Chat(models.Model):
    """Чат - может быть личным или групповым (для класса)"""
    
    class ChatType(models.TextChoices):
        PRIVATE = "private", "Личный"
        CLASS = "class", "Класс"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_type = models.CharField(
        max_length=20,
        choices=ChatType.choices,
        default=ChatType.PRIVATE,
    )
    
    # Для личных чатов
    participant_1 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="private_chats_as_participant_1",
        null=True,
        blank=True,
    )
    participant_2 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="private_chats_as_participant_2",
        null=True,
        blank=True,
    )
    
    # Для групповых чатов (класса)
    school_class = models.OneToOneField(
        SchoolClass,
        on_delete=models.CASCADE,
        related_name="chat",
        null=True,
        blank=True,
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Чат"
        verbose_name_plural = "Чаты"
        unique_together = [["chat_type", "participant_1", "participant_2"]]
    
    def __str__(self):
        if self.chat_type == self.ChatType.PRIVATE:
            return f"Chat: {self.participant_1.email} - {self.participant_2.email}"
        return f"Class Chat: {self.school_class.name}"
    
    def get_participants(self):
        """Получить участников чата"""
        if self.chat_type == self.ChatType.PRIVATE:
            return [self.participant_1, self.participant_2]
        return list(self.school_class.students.all())


class Message(models.Model):
    """Сообщение в чате"""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat = models.ForeignKey(
        Chat,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Сообщение"
        verbose_name_plural = "Сообщения"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["chat", "-created_at"]),
            models.Index(fields=["sender", "-created_at"]),
        ]
    
    def __str__(self):
        return f"{self.sender.email}: {self.content[:50]}"


class OnlineStatus(models.Model):
    """Статус онлайна пользователя"""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="online_status",
        primary_key=True,
    )
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Статус онлайна"
        verbose_name_plural = "Статусы онлайна"
    
    def __str__(self):
        status = "🟢 Online" if self.is_online else "⚫ Offline"
        return f"{self.user.email}: {status}"
