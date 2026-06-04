import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from apps.chats.models import Chat, Message, OnlineStatus
from apps.users.models import User

logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer для чатов с поддержкой typing и присутствия"""

    async def connect(self):
        self.chat_id = self.scope["url_route"]["kwargs"]["chat_id"]
        self.room_group_name = f"chat_{self.chat_id}"
        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        if not await self.user_in_chat():
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        await self.set_user_online()

        # Уведомить всех в чате, что пользователь онлайн
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_online",
                "user_id": str(self.user.id),
                "user_email": self.user.email,
                "username": await self.get_username(),
            }
        )

        # Отправить список онлайн пользователей новому участнику
        online_ids = await self.get_online_users_in_chat()
        await self.send(text_data=json.dumps({
            "type": "online_users",
            "user_ids": online_ids,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        await self.set_user_offline()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "user_offline",
                "user_id": str(self.user.id),
                "user_email": self.user.email,
                "username": await self.get_username(),
            }
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "chat_message":
                content = data.get("content", "").strip()
                if not content:
                    return
                message = await self.save_message(content)

                # Остановить typing
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {"type": "stop_typing", "user_id": str(self.user.id)}
                )

                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "chat_message",
                        "id": str(message.id),
                        "content": message.content,
                        "sender_id": str(message.sender.id),
                        "sender_email": message.sender.email,
                        "created_at": message.created_at.isoformat(),
                    }
                )

            elif message_type == "typing":
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "user_typing",
                        "user_id": str(self.user.id),
                        "username": data.get("username", "Someone"),
                    }
                )

            elif message_type == "stop_typing":
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "stop_typing",
                        "user_id": str(self.user.id),
                    }
                )
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
        except Exception as e:
            logger.error(f"Error in receive: {e}")

    # === Обработчики событий ===
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "id": event["id"],
            "content": event["content"],
            "sender_id": event["sender_id"],
            "sender_email": event["sender_email"],
            "created_at": event["created_at"],
        }))

    async def user_online(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_online",
            "user_id": event["user_id"],
            "user_email": event.get("user_email", ""),
            "username": event.get("username", ""),
        }))

    async def user_offline(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_offline",
            "user_id": event["user_id"],
            "user_email": event.get("user_email", ""),
            "username": event.get("username", ""),
        }))

    async def user_typing(self, event):
        await self.send(text_data=json.dumps({
            "type": "user_typing",
            "user_id": event["user_id"],
            "username": event.get("username", "Someone"),
        }))

    async def stop_typing(self, event):
        await self.send(text_data=json.dumps({
            "type": "stop_typing",
            "user_id": event["user_id"],
        }))

    # === Вспомогательные методы ===
    @database_sync_to_async
    def get_username(self):
        return self.user.profile.username if hasattr(self.user, 'profile') else self.user.email.split('@')[0]

    @database_sync_to_async
    def user_in_chat(self):
        try:
            chat = Chat.objects.get(id=self.chat_id)
            if chat.chat_type == Chat.ChatType.PRIVATE:
                return (
                    self.user == chat.participant_1 or
                    self.user == chat.participant_2
                )
            elif chat.chat_type == Chat.ChatType.CLASS:
                return chat.school_class.students.filter(id=self.user.id).exists()
            return False
        except Chat.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        chat = Chat.objects.get(id=self.chat_id)
        message = Message.objects.create(
            chat=chat,
            sender=self.user,
            content=content,
        )
        return message

    @database_sync_to_async
    def get_online_users_in_chat(self):
        """Получить список ID онлайн пользователей в этом чате"""
        try:
            chat = Chat.objects.get(id=self.chat_id)
            if chat.chat_type == Chat.ChatType.PRIVATE:
                users = [chat.participant_1, chat.participant_2]
            else:
                users = list(chat.school_class.students.all())
            user_ids = []
            for u in users:
                if u.id == self.user.id:
                    user_ids.append(str(u.id))
                    continue
                try:
                    os = OnlineStatus.objects.get(user=u)
                    if os.is_online:
                        user_ids.append(str(u.id))
                except OnlineStatus.DoesNotExist:
                    pass
            return user_ids
        except Chat.DoesNotExist:
            return []

    @database_sync_to_async
    def set_user_online(self):
        online_status, _ = OnlineStatus.objects.get_or_create(user=self.user)
        online_status.is_online = True
        online_status.save()

    @database_sync_to_async
    def set_user_offline(self):
        try:
            online_status = OnlineStatus.objects.get(user=self.user)
            online_status.is_online = False
            online_status.last_seen = timezone.now()
            online_status.save()
        except OnlineStatus.DoesNotExist:
            pass


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer для уведомлений о статусе онлайна и присутствия класса"""

    async def connect(self):
        self.user = self.scope.get("user")

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.user_group_name = f"user_status_{self.user.id}"

        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        await self.accept()
        await self.set_user_online()

        # Отправить количество онлайн в классе
        class_online_count = await self.get_class_online_count()
        await self.send(text_data=json.dumps({
            "type": "class_online_count",
            "count": class_online_count,
        }))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )
        await self.set_user_offline()

    async def status_update(self, event):
        await self.send(text_data=json.dumps({
            "type": "status_update",
            "user_id": event["user_id"],
            "is_online": event["is_online"],
            "username": event.get("username", ""),
        }))

    async def class_online_count(self, event):
        await self.send(text_data=json.dumps({
            "type": "class_online_count",
            "count": event.get("count", 0),
        }))

    @database_sync_to_async
    def get_class_online_count(self):
        """Сколько пользователей из класса онлайн"""
        school_class = self.user.school_class
        if not school_class:
            return 0
        return OnlineStatus.objects.filter(
            user__school_class=school_class,
            is_online=True
        ).count()

    @database_sync_to_async
    def set_user_online(self):
        online_status, _ = OnlineStatus.objects.get_or_create(user=self.user)
        online_status.is_online = True
        online_status.save()

    @database_sync_to_async
    def set_user_offline(self):
        try:
            online_status = OnlineStatus.objects.get(user=self.user)
            online_status.is_online = False
            online_status.last_seen = timezone.now()
            online_status.save()
        except OnlineStatus.DoesNotExist:
            pass