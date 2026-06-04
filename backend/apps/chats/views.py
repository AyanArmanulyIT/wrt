from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q, Prefetch
from django.utils import timezone
from django.core.cache import cache
from apps.chats.models import Chat, Message, OnlineStatus
from apps.chats.serializers import ChatSerializer, MessageSerializer, OnlineStatusSerializer
from apps.users.models import User


class ChatViewSet(viewsets.ModelViewSet):
    """ViewSet для управления чатами"""
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        # Optimized: select_related for foreign keys
        return Chat.objects.filter(
            Q(participant_1=user) | Q(participant_2=user) |
            Q(school_class__students=user)
        ).select_related(
            "participant_1", "participant_2", "school_class"
        ).prefetch_related(
            Prefetch("messages", queryset=Message.objects.order_by("-created_at")[:1])
        ).distinct()
    
    def create(self, request, *args, **kwargs):
        """Создать приватный чат с другим пользователем"""
        chat_type = request.data.get("chat_type")
        
        if chat_type == Chat.ChatType.PRIVATE:
            other_user_id = request.data.get("user_id")
            other_user = get_object_or_404(User, id=other_user_id)
            
            # Проверить, что чат не существует
            existing_chat = Chat.objects.filter(
                chat_type=Chat.ChatType.PRIVATE,
                participant_1__in=[request.user, other_user],
                participant_2__in=[request.user, other_user],
            ).first()
            
            if existing_chat:
                serializer = self.get_serializer(existing_chat)
                return Response(serializer.data)
            
            # Создать новый чат
            chat = Chat.objects.create(
                chat_type=Chat.ChatType.PRIVATE,
                participant_1=request.user,
                participant_2=other_user,
            )
            serializer = self.get_serializer(chat)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(
            {"error": "Invalid chat type"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=["post"])
    def send_message(self, request, pk=None):
        """Отправить сообщение в чат"""
        chat = self.get_object()
        content = request.data.get("content", "").strip()
        
        if not content:
            return Response(
                {"error": "Content cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            content=content,
        )
        
        serializer = MessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=["get"])
    def messages(self, request, pk=None):
        """Получить сообщения из чата с пагинацией"""
        chat = self.get_object()
        # Optimized: only fetch latest 50 messages at a time
        messages = chat.messages.select_related("sender").order_by("-created_at")
        
        page = self.paginate_queryset(messages)
        if page is not None:
            serializer = MessageSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = MessageSerializer(messages[:50], many=True)
        return Response(serializer.data)


class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet для управления сообщениями"""
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Message.objects.filter(sender=self.request.user).select_related("chat")
    
    @action(detail=True, methods=["patch"])
    def edit(self, request, pk=None):
        """Редактировать сообщение"""
        message = self.get_object()
        
        if message.sender != request.user:
            return Response(
                {"error": "You can only edit your own messages"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        content = request.data.get("content", "").strip()
        if not content:
            return Response(
                {"error": "Content cannot be empty"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        message.content = content
        message.edited_at = timezone.now()
        message.save()
        
        serializer = self.get_serializer(message)
        return Response(serializer.data)


class OnlineStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для просмотра статусов онлайна с кешированием"""
    queryset = OnlineStatus.objects.all()
    serializer_class = OnlineStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=["get"])
    def my_status(self, request):
        """Получить мой статус онлайна (cached 30s)"""
        cache_key = f"online_status_{request.user.id}"
        data = cache.get(cache_key)
        if data is None:
            online_status, _ = OnlineStatus.objects.get_or_create(user=request.user)
            serializer = self.get_serializer(online_status)
            data = serializer.data
            cache.set(cache_key, data, 30)
        return Response(data)
    
    @action(detail=False, methods=["get"])
    def class_members_status(self, request):
        """Получить статусы онлайна всех членов класса (cached 15s)"""
        user = request.user
        if not user.school_class:
            return Response(
                {"error": "User is not in a school class"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f"class_online_{user.school_class_id}"
        data = cache.get(cache_key)
        if data is None:
            statuses = OnlineStatus.objects.filter(
                user__school_class=user.school_class
            ).select_related("user")
            serializer = self.get_serializer(statuses, many=True)
            data = serializer.data
            cache.set(cache_key, data, 15)
        return Response(data)