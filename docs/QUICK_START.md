# Быстрый старт - Real-Time Chat

## ✅ Что было реализовано

### 1. **Backend (Django)**
- ✅ Django app `apps.chats` 
- ✅ 3 модели:
  - `Chat` - личные и групповые чаты
  - `Message` - сообщения в чатах
  - `OnlineStatus` - статус онлайна пользователей
- ✅ WebSocket Consumers:
  - `ChatConsumer` - для отправки/получения сообщений
  - `NotificationConsumer` - для статуса онлайна
- ✅ REST API endpoints с DRF ViewSets
- ✅ Django Channels + Redis конфигурация
- ✅ Admin панель для управления чатами/сообщениями

### 2. **Frontend (Next.js)**
- ✅ `ChatWindow` компонент - основное чат окно
- ✅ `OnlineStatus` компонент - отображение статусов
- ✅ `chatService` - API методы
- ✅ Auto-scroll при новых сообщениях
- ✅ Индикатор подключения

### 3. **Требования**
```
channels>=4.0          # WebSocket поддержка
channels-redis>=4.0    # Redis для Channel Layers  
daphne>=4.0            # ASGI сервер
```

---

## 🚀 Шаги для запуска

### Step 1: Установить зависимости
```bash
# Backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Step 2: БД миграции
```bash
cd backend
python manage.py migrate
```

### Step 3: Запустить Redis (опционально для dev)
```bash
# Для простой разработки можно использовать in-memory channel layer
# В production нужна Redis
redis-server  # или docker run -p 6379:6379 redis:latest
```

### Step 4: Запустить Backend с WebSocket поддержкой
```bash
cd backend
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Step 5: Запустить Frontend
```bash
cd frontend
npm run dev
```

---

## 📝 Примеры использования

### REST API - Создать приватный чат
```bash
curl -X POST http://localhost:8000/api/v1/chats/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat_type": "private", "user_id": "other-user-uuid"}'
```

### WebSocket - Отправить сообщение
```javascript
const socket = new WebSocket('ws://localhost:8000/ws/chat/chat-uuid/');

socket.onopen = () => {
  socket.send(JSON.stringify({
    type: 'chat_message',
    content: 'Hello!'
  }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};
```

### React Component - Использование
```tsx
import { ChatWindow } from '@/components/chat/chat-window';

export default function Page() {
  return <ChatWindow chatId="your-chat-id" />;
}
```

---

## 🔧 Конфигурация

### settings.py обновлены:
- ✅ `INSTALLED_APPS` - добавлены `channels` и `apps.chats`
- ✅ `ASGI_APPLICATION` - установлен `config.asgi:application`
- ✅ `CHANNEL_LAYERS` - конфигурация Redis

### asgi.py обновлен:
- ✅ `ProtocolTypeRouter` для HTTP и WebSocket
- ✅ `AuthMiddlewareStack` для JWT аутентификации
- ✅ Маршрутизация на WebSocket consumers

---

## 🎯 Функции

| Функция | Статус |
|---------|--------|
| Личные чаты | ✅ |
| Групповые чаты (класс) | ✅ |
| Real-time сообщения | ✅ |
| Статус онлайна | ✅ |
| История сообщений | ✅ |
| Редактирование сообщений | ✅ |
| WebSocket соединение | ✅ |

---

## 📁 Структура файлов

```
backend/
├── apps/chats/
│   ├── models.py           # Chat, Message, OnlineStatus
│   ├── consumers.py        # WebSocket consumers
│   ├── views.py            # REST API ViewSets
│   ├── serializers.py      # DRF serializers
│   ├── urls.py             # API routes
│   ├── routing.py          # WebSocket routes
│   ├── admin.py            # Admin interface
│   └── signals.py          # Django signals
├── config/
│   ├── asgi.py             # Channels ASGI config
│   ├── urls.py             # Main URL routing
│   └── settings/
│       └── base.py         # Django settings

frontend/
├── components/chat/
│   ├── chat-window.tsx     # Chat component
│   └── online-status.tsx   # Online status component
└── services/
    └── chat.service.ts     # API service
```

---

## 🔒 Безопасность

- ✅ JWT аутентификация для WebSocket
- ✅ Проверка прав доступа (только участники чата могут писать)
- ✅ SQL injection защита (ORM)
- ✅ CORS настроена

---

## 🐛 Debugging

### Если WebSocket не соединяется:
1. Убедитесь, что дафнус запущен: `daphne -b 0.0.0.0 -p 8000 config.asgi:application`
2. Проверьте JWT токен в браузере (DevTools → Network → WS)
3. Проверьте Redis: `redis-cli ping`

### Если сообщения не сохраняются:
1. Проверьте БД миграции: `python manage.py migrate`
2. Проверьте логи: `python manage.py runserver --debug`

---

## 📚 Документация

Полная документация в: [docs/CHAT_SYSTEM.md](./CHAT_SYSTEM.md)

---

## ✨ Дополнительно

Система готова для:
- ✅ Production deployment (с Nginx + Daphne)
- ✅ Масштабирования (Redis Channel Layers)
- ✅ Кастомизации (легко добавить typing indicator, read receipts и т.д.)
