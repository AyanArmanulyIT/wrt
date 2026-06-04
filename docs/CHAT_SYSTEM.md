# Real-Time Chat System

Простая система реал-тайм чата с использованием Django Channels и WebSockets.

## Возможности

✅ **Личные чаты** - переписка между двумя пользователями
✅ **Групповые чаты** - обсуждение в рамках класса
✅ **Статус онлайна** - видеть кто онлайн, а кто оффлайн
✅ **Real-time сообщения** - мгновенная доставка через WebSocket

## Структура

### Backend (Django)

```
backend/apps/chats/
├── models.py          # Chat, Message, OnlineStatus
├── consumers.py       # WebSocket consumers
├── views.py           # REST API endpoints
├── serializers.py     # DRF serializers
├── urls.py            # API URL routing
├── routing.py         # WebSocket URL routing
├── signals.py         # Django signals
└── admin.py           # Admin panel
```

### Frontend (Next.js)

```
frontend/components/chat/
├── chat-window.tsx    # Основной чат компонент
└── online-status.tsx  # Компонент статуса онлайна

frontend/services/
└── chat.service.ts    # API методы для чата
```

## REST API Endpoints

### Чаты
- `GET /api/v1/chats/` - Получить все чаты
- `GET /api/v1/chats/{id}/` - Получить конкретный чат
- `POST /api/v1/chats/` - Создать приватный чат
  ```json
  {
    "chat_type": "private",
    "user_id": "uuid"
  }
  ```
- `POST /api/v1/chats/{id}/send_message/` - Отправить сообщение
  ```json
  {
    "content": "Hello!"
  }
  ```
- `GET /api/v1/chats/{id}/messages/` - Получить сообщения чата

### Статус онлайна
- `GET /api/v1/online-status/` - Получить все статусы
- `GET /api/v1/online-status/my_status/` - Мой статус
- `GET /api/v1/online-status/class_members_status/` - Статусы членов класса

## WebSocket Соединение

### URL
```
ws://localhost:8000/ws/chat/{chat_id}/
ws://localhost:8000/ws/notifications/
```

### Сообщения (от клиента)

#### Отправить сообщение в чат
```json
{
  "type": "chat_message",
  "content": "Hello, everyone!"
}
```

### События (от сервера)

#### Новое сообщение
```json
{
  "type": "chat_message",
  "id": "uuid",
  "content": "Hello!",
  "sender_id": "uuid",
  "sender_email": "user@example.com",
  "created_at": "2024-01-01T12:00:00Z"
}
```

#### Пользователь онлайн
```json
{
  "type": "user_online",
  "user_id": "uuid",
  "user_email": "user@example.com"
}
```

#### Пользователь оффлайн
```json
{
  "type": "user_offline",
  "user_id": "uuid",
  "user_email": "user@example.com"
}
```

## Модели БД

### Chat
- `id` (UUID) - Primary Key
- `chat_type` - "private" или "class"
- `participant_1` - Первый участник (для приватных чатов)
- `participant_2` - Второй участник (для приватных чатов)
- `school_class` - Класс (для групповых чатов)
- `created_at` - Дата создания
- `updated_at` - Дата обновления

### Message
- `id` (UUID) - Primary Key
- `chat` - FK на Chat
- `sender` - FK на User
- `content` - Текст сообщения
- `created_at` - Дата создания
- `edited_at` - Дата редактирования

### OnlineStatus
- `user` (OneToOneField) - Primary Key, FK на User
- `is_online` - Boolean статус
- `last_seen` - Время последней активности

## Требования

```
channels>=4.0
channels-redis>=4.0
daphne>=4.0
```

## Установка и запуск

### Backend

1. Установить зависимости:
```bash
pip install -r requirements.txt
```

2. Запустить миграции:
```bash
python manage.py migrate
```

3. Запустить сервер (с поддержкой WebSockets):
```bash
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Frontend

```bash
npm install
npm run dev
```

### Redis (для production)

Убедитесь, что Redis запущен:
```bash
redis-server
```

## Использование в компонентах

```tsx
import { ChatWindow } from '@/components/chat/chat-window';
import { OnlineStatus } from '@/components/chat/online-status';
import { chatService } from '@/services/chat.service';

// Чат окно
<ChatWindow chatId="chat-uuid" />

// Статус онлайна
<OnlineStatus />

// API вызовы
const chats = await chatService.getChats();
const newChat = await chatService.createPrivateChat(userId);
const statuses = await chatService.getClassMembersStatus();
```

## Архитектура

```
┌─────────────────────┐
│   Next.js Frontend  │
│   (ChatWindow)      │
└──────────┬──────────┘
           │
      WebSocket
           │
┌──────────▼──────────┐
│  Django + Channels  │
│   (Consumers)       │
└──────────┬──────────┘
           │
      Redis Channel Layer
           │
┌──────────▼──────────┐
│   PostgreSQL DB     │
│  (Chat, Message)    │
└─────────────────────┘
```

## Заметки

- Система использует `AuthMiddlewareStack` для аутентификации WebSocket соединений через JWT токены
- Сообщения сохраняются в БД и при переподключении загружаются заново
- Статус онлайна отслеживается автоматически при подключении/отключении WebSocket
- Для production нужна Redis для работы Channel Layers
