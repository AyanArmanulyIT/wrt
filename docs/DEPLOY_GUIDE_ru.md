# 🚀 Полное руководство по деплою WRT

**Архитектура:**
- **Backend** (Django + DRF + PostgreSQL) → **Railway**
- **Frontend** (Next.js) → **Vercel**

---

## 📖 Содержание

1. [Что такое деплой?](#1-что-такое-деплой)
2. [Backend: Railway пошагово](#2-backend-railway-пошагово)
3. [Frontend: Vercel пошагово](#3-frontend-vercel-пошагово)
4. [Переменные окружения (Environment Variables)](#4-переменные-окружения)
5. [ALLOWED_HOSTS, CORS, CSRF — что это?](#5-allowed_hosts-cors-csrf)
6. [STATIC и MEDIA файлы](#6-static-и-media-файлы)
7. [База данных PostgreSQL в Railway](#7-база-данных-postgresql)
8. [Как соединить Railway и Vercel](#8-как-соединить-railway-и-vercel)
9. [Как проверять, что всё работает](#9-проверка-что-всё-работает)
10. [Как читать логи](#10-как-читать-логи)
11. [Как исправлять ошибки](#11-как-исправлять-ошибки)
12. [Финальные чек-листы](#12-финальные-чек-листы)

---

## 1. Что такое деплой?

**Деплой** — это когда ты загружаешь свой код на сервер в интернете, чтобы другие люди могли пользоваться твоим приложением.

Сейчас у тебя всё работает на твоём компьютере (`localhost:8000` для Django, `localhost:3000` для Next.js). Чтобы это работало в интернете, нужно:

1. **Backend** (Django) загрузить на **Railway** — сервис, который запускает Python/Django приложения
2. **Frontend** (Next.js) загрузить на **Vercel** — сервис, который запускает Next.js приложения
3. **Базу данных** (PostgreSQL) создать в Railway — он умеет создавать базы данных автоматически

---

## 2. Backend: Railway пошагово

### Шаг 1: Создай аккаунт на Railway

1. Открой сайт [railway.app](https://railway.app)
2. Нажми **"Login"** в правом верхнем углу
3. Выбери **"Continue with GitHub"**
4. Разреши Railway доступ к твоим репозиториям

### Шаг 2: Подготовь файлы для Railway

Railway нужно 3 файла в папке `backend/`:

**Файл 1: `requirements.txt`** — список Python библиотек
```
Django>=5.2,<6.1
djangorestframework>=3.15,<4
djangorestframework-simplejwt>=5.3,<6
django-cors-headers>=4.3,<5
python-dotenv>=1.0,<2
psycopg[binary]>=3.2,<4
Pillow>=10.0,<12
django-filter>=24.0,<26
channels>=4.0,<5
channels-redis>=4.0,<5
daphne>=4.0,<5
python-json-logger>=2.0,<3
```
⚠️ **Важно:** Убедись, что этот файл есть в папке `backend/`.

**Файл 2: `Procfile`** — инструкция для Railway, как запускать приложение
```
web: daphne -b 0.0.0.0 -p $PORT config.asgi:application
release: python manage.py migrate --noinput
```
Что это значит:
- `web:` — запускает веб-сервер
- `daphne -b 0.0.0.0 -p $PORT` — Daphne (ASGI сервер) слушает на всех адресах, порт даёт Railway
- `config.asgi:application` — путь к ASGI приложению (файл `config/asgi.py`)
- `release:` — запускается **один раз перед деплоем**
- `python manage.py migrate --noinput` — применяет миграции базы данных

**Файл 3: `railway.json`** — настройки Railway
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "daphne -b 0.0.0.0 -p $PORT config.asgi:application",
    "healthcheckPath": "/api/health/",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```
- `healthcheckPath` — Railway будет проверять, что приложение живо, делая GET-запрос на этот адрес
- `restartPolicyType: ON_FAILURE` — перезапускать, если упало

### Шаг 3: Загрузи код на GitHub

Railway работает с GitHub. Тебе нужно:

1. Открыть терминал (VS Code → Terminal)
2. Выполнить команды:
```bash
git add .
git commit -m "Готовимся к деплою"
git push
```

Если ты ещё не привязал GitHub:
```bash
git init
git add .
git commit -m "Первый коммит"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/wrt.git
git push -u origin main
```

### Шаг 4: Создай проект в Railway

1. Зайди на [railway.app/dashboard](https://railway.app/dashboard)
2. Нажми **"New Project"**
3. Выбери **"Deploy from GitHub repo"**
4. Найди и выбери репозиторий `wrt`
5. Когда Railway спросит **Root Directory** → введи `backend`
6. Railway автоматически найдёт `requirements.txt`, `Procfile` и `railway.json`

**Что такое Root Directory?**
Это папка, в которой лежит твой backend. У тебя проект выглядит так:
```
wrt/
├── backend/     ← Вот эта папка. Root Directory = "backend"
├── frontend/
```
Railway будет работать внутри папки `backend/`.

### Шаг 5: Добавь базу данных PostgreSQL

1. В проекте Railway нажми **"New"**
2. Выбери **"Database"** → **"Add PostgreSQL"**
3. Подожди 1-2 минуты, пока Railway создаст базу
4. Railway автоматически добавит переменную `DATABASE_URL` в твой проект

**Как Railway подключается к базе?**
Railway добавляет переменную окружения `DATABASE_URL`:
```
DATABASE_URL=postgresql://user:password@host:port/railway
```

Твой `production.py` должен читать эту переменную. У тебя сейчас используется:
```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DATABASE_NAME", "wrt_db"),
        "USER": os.getenv("DATABASE_USER", "wrt_user"),
        # ...
    }
}
```

**Нужно изменить на:**
```python
import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL"),
        conn_max_age=600,
    )
}
```

Добавь `dj-database-url` в `requirements.txt`:
```
dj-database-url>=2.0,<3
```

### Шаг 6: Настрой переменные окружения в Railway

1. В проекте Railway перейди на вкладку **"Variables"**
2. Добавь эти переменные:

| Переменная | Значение | Пример |
|-----------|----------|--------|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` | |
| `SECRET_KEY` | Случайная строка 64 символа | `django-insecure-abc123...` |
| `ALLOWED_HOSTS` | Домен твоего приложения | `wrt-production.up.railway.app,api.wrt.app` |
| `CORS_ALLOWED_ORIGINS` | URL фронтенда | `https://wrt.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | URL фронтенда | `https://wrt.vercel.app` |
| `DATABASE_URL` | **Автоматически** от Railway | |
| `NEXT_PUBLIC_API_URL` | URL бэкенда | `https://wrt-production.up.railway.app` |

### Шаг 7: Нажми Deploy

После добавления всех переменных, Railway сам перезапустит приложение. Если нет — нажми **"Deploy"** вручную.

**Где смотреть логи:**
1. Открой проект в Railway
2. Нажми на **"Deployments"**
3. Выбери последний деплой
4. Нажми **"View Logs"**

**Как выглядит успешный деплой:**
```
[BUILD] Installing requirements...
[BUILD] Successfully installed Django...
[RUN] Applying migrations...
[RUN] Operations to perform:
[RUN]   Apply all migrations: admin, auth, ...
[RUN]   OK
[RUN] Starting Daphne on 0.0.0.0:8000
```

### 🛑 Типичные ошибки Railway

**Ошибка:** `ModuleNotFoundError: No module named '...'`
**Причина:** Библиотека не установлена.
**Решение:** Добавь её в `requirements.txt`.

**Ошибка:** `Connection refused to database`
**Причина:** PostgreSQL не запущен или неправильный `DATABASE_URL`.
**Решение:** Проверь, что ты добавил PostgreSQL Database в проект Railway.

**Ошибка:** `Invalid HTTP_HOST header`
**Причина:** Домен не добавлен в `ALLOWED_HOSTS`.
**Решение:** Добавь домен в переменную `ALLOWED_HOSTS` в Railway.

---

## 3. Frontend: Vercel пошагово

### Шаг 1: Создай аккаунт на Vercel

1. Открой [vercel.com](https://vercel.com)
2. Нажми **"Sign Up"**
3. Выбери **"Continue with GitHub"**

### Шаг 2: Подготовь Next.js для продакшена

Убедись, что в `next.config.ts` есть настройки для продакшена:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Локальная разработка
      { protocol: "http", hostname: "127.0.0.1", port: "8000", pathname: "/media/**" },
      { protocol: "http", hostname: "localhost", port: "8000", pathname: "/media/**" },
      // Railway (твой бэкенд) — добавь свой URL
      { protocol: "https", hostname: "*.up.railway.app", pathname: "/media/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
```

### Шаг 3: Загрузи на Vercel

1. В Vercel нажми **"Add New..."** → **"Project"**
2. Выбери репозиторий `wrt`
3. В настройках проекта:

| Параметр | Значение | Почему |
|----------|----------|--------|
| **Root Directory** | `frontend` | Потому что Next.js в папке frontend |
| **Build Command** | `npm run build` | Стандартная команда для Next.js |
| **Output Directory** | `.next` | Стандартная папка Next.js |

### Шаг 4: Добавь переменные окружения

Нажми **"Environment Variables"** и добавь:

| Переменная | Значение |
|-----------|----------|
| `NEXT_PUBLIC_API_URL` | URL твоего бэкенда на Railway (например `https://wrt-production.up.railway.app`) |

**ВАЖНО:** В Vercel никогда не используй `.env.local`! Все переменные добавляются через интерфейс Vercel.

### Шаг 5: Нажми Deploy

Нажми **"Deploy"**. Vercel автоматически:
1. Установит зависимости (`npm install`)
2. Соберёт Next.js (`npm run build`)
3. Запустит приложение

**Как выглядит успешный деплой:**
```
[3:45:12 PM] Cloning github.com/.../wrt...
[3:45:15 PM] Installing dependencies...
[3:45:45 PM] Running "npm run build"
[3:46:30 PM] ✓ Compiled successfully
[3:46:31 PM] ✓ Deployed to https://wrt.vercel.app
```

### 🛑 Типичные ошибки Vercel

**Ошибка:** `Build failed: Could not find package.json`
**Причина:** Не указан Root Directory. Vercel ищет package.json в корне, а он в папке frontend.
**Решение:** В настройках проекта укажи **Root Directory → `frontend`**.

**Ошибка:** `Error: 404 NOT_FOUND`
**Причина:** API_URL указывает на неправильный адрес.
**Решение:** Проверь `NEXT_PUBLIC_API_URL` в переменных Vercel. Должен быть URL твоего Railway приложения.

**Ошибка:** `Image optimization failed`
**Причина:** В `next.config.ts` не добавлен домен для изображений с бэкенда.
**Решение:** Добавь `*.up.railway.app` в `remotePatterns`.

---

## 4. Переменные окружения

### Что такое переменные окружения?

Это секретные настройки, которые не хранятся в коде (в Git), а задаются на сервере.

**Пример:** Твой пароль от базы данных. Ты не хочешь, чтобы он был в Git. Вместо этого ты создаёшь переменную `DATABASE_URL` на Railway, и Django читает её оттуда.

### Полный список переменных для Railway (Backend)

```bash
# === Обязательные ===

# Какой файл настроек использовать
DJANGO_SETTINGS_MODULE=config.settings.production

# Секретный ключ Django — сгенерируй случайную строку
# Можно сгенерировать: python -c "import secrets; print(secrets.token_urlsafe(64))"
SECRET_KEY=<нужна случайная строка>

# Домены, которые могут обращаться к бэкенду
ALLOWED_HOSTS=<railway-домен>,<свой-домен>

# Откуда можно делать запросы (фронтенд)
CORS_ALLOWED_ORIGINS=<vercel-домен>

# Откуда можно отправлять POST-запросы (фронтенд)  
CSRF_TRUSTED_ORIGINS=<vercel-домен>

# URL базы данных — Railway добавляет автоматически
DATABASE_URL=postgresql://...

# === Опциональные ===

# Уровень логирования
LOG_LEVEL=INFO

# Redis (для чатов)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Полный список переменных для Vercel (Frontend)

```bash
# URL твоего бэкенда на Railway
# ⚠️ Без /api/v1 на конце! Эта часть добавляется в коде автоматически
NEXT_PUBLIC_API_URL=https://wrt-production.up.railway.app
```

**Почему без `/api/v1`?** Потому что в файле `frontend/lib/constants.ts` уже написано:
```typescript
// Если переменная NEXT_PUBLIC_API_URL задана, к ней добавляется /api/v1
if (configured) return `${configured}/api/v1`;
```

---

## 5. ALLOWED_HOSTS, CORS, CSRF — что это?

### ALLOWED_HOSTS — белый список доменов

Django проверяет заголовок `Host` в каждом запросе. Если домена нет в `ALLOWED_HOSTS`, Django вернёт ошибку 400.

**Как настроить:**
```python
# В production.py
ALLOWED_HOSTS = [
    # Домен, который дал Railway (типа wrt-production.up.railway.app)
    "wrt-production.up.railway.app",
    # Свой домен (если есть)
    "api.wrt.app",
    "wrt.app",
]
```

**Как это выглядит в Railway Variables:**
```
ALLOWED_HOSTS=wrt-production.up.railway.app,api.wrt.app
```

### CORS — кто может делать запросы к API

CORS (Cross-Origin Resource Sharing) — это защита браузера. Если фронтенд на `wrt.vercel.app` делает запрос к бэкенду на `wrt.up.railway.app`, браузер проверяет, разрешено ли это.

**Как настроить:**
```python
# В production.py
CORS_ALLOWED_ORIGINS = [
    "https://wrt.vercel.app",  # Твой фронтенд на Vercel
    "https://wrt.app",         # Свой домен (если есть)
]
CORS_ALLOW_CREDENTIALS = True  # Разрешить куки и токены
```

**В Railway Variables:**
```
CORS_ALLOWED_ORIGINS=https://wrt.vercel.app,https://wrt.app
```

### CSRF — защита от подделки запросов

CSRF защищает от того, чтобы злоумышленник не отправил POST-запрос от имени твоего пользователя.

```python
# В production.py
CSRF_TRUSTED_ORIGINS = [
    "https://wrt.vercel.app",
    "https://wrt.app",
]
```

---

## 6. STATIC и MEDIA файлы

### STATIC файлы

Это CSS, JavaScript, картинки, которые нужны для работы Django Admin панели.

**Как настроить в production:**
```python
# В production.py
STATIC_ROOT = BASE_DIR / "staticfiles"
STATIC_URL = "static/"

# Собери статические файлы один раз:
# python manage.py collectstatic --noinput
```

В `Procfile` уже есть `release: python manage.py migrate --noinput`. Добавь туда же сборку статики:
```
release: python manage.py migrate --noinput && python manage.py collectstatic --noinput
```

**Проблема:** Railway не хранит файлы между деплоями постоянно. Статика будет собираться заново при каждом деплое, что нормально. Но MEDIA файлы (загруженные пользователями) — **пропадут** при следующем деплое!

### MEDIA файлы — ⚠️ ВАЖНО!

Это картинки, которые загружают пользователи (аватары, посты). На Railway они хранятся в временном хранилище.

**Проблема:** При каждом новом деплое Railway создаёт новый экземпляр приложения. Все файлы, загруженные пользователями, пропадут!

**Решение 1 (простое): Использовать Cloudinary**
```python
# Установи: pip install cloudinary django-cloudinary-storage

INSTALLED_APPS = [
    "cloudinary_storage",
    # ...
]

DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": os.getenv("CLOUDINARY_CLOUD_NAME"),
    "API_KEY": os.getenv("CLOUDINARY_API_KEY"),
    "API_SECRET": os.getenv("CLOUDINARY_API_SECRET"),
}
```

**Решение 2 (среднее): Использовать AWS S3**
```python
# Установи: pip install django-storages boto3

DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "eu-central-1")
```

**Рекомендация:** Начни с Cloudinary — это проще всего. Cloudinary бесплатен для небольших проектов.

---

## 7. База данных PostgreSQL

### Как Railway создаёт базу

1. В проекте Railway нажми **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway создаёт базу и автоматически добавляет переменную `DATABASE_URL`
3. База данных — отдельный сервис, который работает 24/7 отдельно от твоего приложения

### Как Django подключается

Лучший способ — использовать `dj-database-url`:

```python
# Установи: pip install dj-database-url
import dj_database_url

DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL"),
        conn_max_age=600,  # 10 минут держать соединение
    )
}
```

### Как сделать бэкап

В Railway база данных автоматически делает бэкапы. Но лучше сделать手动备份 перед важными изменениями:

```bash
# Скачай дамп базы
pg_dump --no-owner -h $DATABASE_HOST -U $DATABASE_USER $DATABASE_NAME > backup_$(date +%Y%m%d).sql
```

### Как восстановиться из бэкапа

```bash
# Восстанови базу
psql -h $DATABASE_HOST -U $DATABASE_USER $DATABASE_NAME < backup.sql
```

---

## 8. Как соединить Railway и Vercel

### Схема соединения

```
Пользователь → Vercel (фронтенд: wrт.vercel.app)
                          ↓
                   API запросы (через браузер)
                          ↓
              Railway (бэкенд: wrt.up.railway.app)
                          ↓
                  PostgreSQL (база данных)
```

### Пошаговая настройка

**Шаг 1:** После деплоя бэкенда на Railway, скопируй URL приложения. Он выглядит так:
```
https://wrt-production.up.railway.app
```

**Шаг 2:** В проекте Vercel добавь переменную:
```
NEXT_PUBLIC_API_URL=https://wrt-production.up.railway.app
```

**Шаг 3:** В проекте Railway добавь переменные для Vercel:
```
CORS_ALLOWED_ORIGINS=https://wrt.vercel.app
CSRF_TRUSTED_ORIGINS=https://wrt.vercel.app
```

### Как проверить соединение

1. Открой в браузере: `https://wrt-production.up.railway.app/api/health/`
2. Должен увидеть: `{"status": "ok"}`

3. Открой в браузере: `https://wrt.vercel.app`
4. Должен загрузиться твой фронтенд

5. Если фронтенд загрузился, но не показывает посты → открой **"Console"** в инструментах разработчика (F12) и посмотри ошибки

---

## 9. Проверка что всё работает

### Тест 1: Health check (проверка бэкенда)

```bash
# Через терминал
curl https://wrt-production.up.railway.app/api/health/

# Должен вернуть:
{"status": "ok", "database": "connected", "timestamp": "2026-06-04T12:00:00Z"}
```

### Тест 2: Проверка авторизации

```bash
curl -X POST https://wrt-production.up.railway.app/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@school.ru","password":"password123"}'

# Должен вернуть:
{"access": "eyJ...", "refresh": "eyJ..."}
```

### Тест 3: Проверка загрузки изображений

```bash
curl -X POST https://wrt-production.up.railway.app/api/v1/posts/ \
  -H "Authorization: Bearer eyJ..." \
  -F "content=Test post from API" \
  -F "image=@test.jpg"

# Должен вернуть:
{"id": "...", "content": "Test post from API", ...}
```

### Тест 4: Проверка фронтенда

1. Открой `https://wrt.vercel.app` в браузере
2. Попробуй залогиниться
3. Загрузи изображение
4. Открой инструменты разработчика (F12) → вкладка **Network**
5. Убедись, что запросы идут на `https://wrt-production.up.railway.app/api/v1/...`

---

## 10. Как читать логи

### Логи Railway

1. Зайди на [railway.app/dashboard](https://railway.app/dashboard)
2. Нажми на свой проект
3. Слева выбери **"Deployments"**
4. Выбери деплой (обычно верхний)
5. Нажми **"View Logs"**

**Что искать в логах:**

| Строка в логе | Что значит | OK? |
|--------------|------------|-----|
| `Starting Daphne on 0.0.0.0:8000` | Сервер запущен | ✅ |
| `Operations to perform:` | Миграции выполняются | ✅ |
| `Applying feed.0003... OK` | Миграция применена | ✅ |
| `Error: No module named 'xxx'` | Библиотека не найдена | ❌ |
| `ConnectionError: can't connect to db` | База не доступна | ❌ |
| `Invalid HTTP_HOST header` | Домен не в ALLOWED_HOSTS | ❌ |

### Логи Vercel

1. Зайди на [vercel.com](https://vercel.com/dashboard)
2. Нажми на проект `wrt`
3. Выбери **"Deployments"**
4. Нажми на последний деплой
5. Выбери вкладку **"Functions"** или **"Logs"**

**Что искать в логах:**

| Строка в логе | Что значит | OK? |
|--------------|------------|-----|
| `✓ Deployed` | Деплой успешен | ✅ |
| `✓ Compiled successfully` | Сборка прошла успешно | ✅ |
| `Error: 500` | Внутренняя ошибка сервера | ❌ |
| `Error: fetch failed` | Не может достучаться до API | ❌ |
| `TypeError: ... is not a function` | Ошибка в JavaScript коде | ❌ |

### Логи в браузере (Frontend)

1. Нажми **F12**
2. Перейди на вкладку **Console**
3. Там будут все ошибки JavaScript

**Если видишь:**
```
❌ Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy
```
→ Проблема с CORS. Проверь `CORS_ALLOWED_ORIGINS` в Railway.

```
❌ 401 Unauthorized
```
→ Токен авторизации недействителен. Нужно перезайти.

```
❌ 404 NOT_FOUND
```
→ Адрес API указан неправильно. Проверь `NEXT_PUBLIC_API_URL`.

---

## 11. Как исправлять ошибки

### Топ-10 ошибок и их решения

| # | Ошибка | Где появляется | Причина | Решение |
|---|--------|---------------|---------|---------|
| 1 | `ModuleNotFoundError` | Railway Logs | Нет библиотеки в requirements.txt | Добавь библиотеку и передеплой |
| 2 | `Invalid HTTP_HOST header` | Railway Logs | Домен не в ALLOWED_HOSTS | Добавь домен в Variables Railway |
| 3 | `CORS policy error` | Browser Console | Фронтенд не может достучаться до API | Проверь CORS_ALLOWED_ORIGINS |
| 4 | `404 /api/v1/...` | Browser Console | Неправильный API_URL | Проверь NEXT_PUBLIC_API_URL в Vercel |
| 5 | `Connection refused` | Railway Logs | PostgreSQL не запущен | Жди 2 минуты, Railway создаёт БД |
| 6 | `Build failed` | Vercel Build Logs | Ошибка в коде | Посмотри конкретную ошибку TypeScript |
| 7 | `Image not loading` | Browser | Домен не в remotePatterns | Добавь домен в next.config.ts |
| 8 | `500 Internal Server` | Railway Logs | Ошибка в Python коде | Посмотри полный traceback в логах |
| 9 | `Permission denied` | API Response | Пользователь не авторизован | Проверь токен в localStorage |
| 10 | `Field 'id' expected a number` | API Response | Используй UUID, не Integer | Все ID должны быть UUID строками |

### Как быстро откатить деплой

**В Railway:**
1. Выбери **"Deployments"**
2. Найди предыдущий успешный деплой (зелёная галочка)
3. Нажми **"..."** → **"Redeploy"**

**В Vercel:**
1. Выбери **"Deployments"**
2. Найди предыдущий успешный деплой
3. Нажми **"..."** → **"Promote to Production"**

---

## 12. Финальные чек-листы

### ✅ Railway Deployment Checklist (Backend)

Перед деплоем проверь:

- [ ] `backend/requirements.txt` существует и содержит все библиотеки
- [ ] `backend/Procfile` существует
- [ ] `backend/railway.json` существует
- [ ] В `Procfile` написано: `web: daphne -b 0.0.0.0 -p $PORT config.asgi:application`
- [ ] В `Procfile` написано: `release: python manage.py migrate --noinput`
- [ ] В Git закоммичены все файлы
- [ ] В Railway выбран Root Directory = `backend`
- [ ] PostgreSQL Database добавлена в проект Railway
- [ ] Переменные окружения добавлены:

| Переменная | Статус |
|-----------|--------|
| `DJANGO_SETTINGS_MODULE=config.settings.production` | ✅ |
| `SECRET_KEY` (64 символа) | ✅ |
| `ALLOWED_HOSTS` (домен Railway + свой домен) | ✅ |
| `CORS_ALLOWED_ORIGINS` (домен Vercel) | ✅ |
| `CSRF_TRUSTED_ORIGINS` (домен Vercel) | ✅ |
| `DATABASE_URL` (автоматически от Railway) | ✅ |

- [ ] Health check работает: `GET /api/health/ → 200`
- [ ] Логи показывают `Starting Daphne on 0.0.0.0:$PORT`

### ✅ Vercel Deployment Checklist (Frontend)

Перед деплоем проверь:

- [ ] `frontend/package.json` существует
- [ ] `frontend/next.config.ts` существует
- [ ] В Git закоммичены все файлы
- [ ] В Vercel выбран Root Directory = `frontend`
- [ ] Build Command = `npm run build`
- [ ] Переменные окружения:

| Переменная | Статус |
|-----------|--------|
| `NEXT_PUBLIC_API_URL` (URL бэкенда без /api/v1) | ✅ |

- [ ] В `next.config.ts` добавлен `remotePatterns` для домена Railway:

```typescript
{ protocol: "https", hostname: "*.up.railway.app", pathname: "/media/**" }
```

### ✅ Production Launch Checklist

**До запуска (T-24 часа):**
- [ ] Все миграции применены
- [ ] Создан суперпользователь админки
- [ ] Собран staticfiles
- [ ] Проверен health check
- [ ] Проверена регистрация нового пользователя
- [ ] Проверена загрузка изображения
- [ ] Проверена работа ленты
- [ ] Проверена работа комментариев

**В момент запуска (T-0):**
- [ ] Установлен Sentry (или аналог) для отслеживания ошибок
- [ ] Настроен UptimeRobot (или аналог) для мониторинга
- [ ] Сделан бэкап базы данных
- [ ] Записан Git tag: `git tag v1.0.0 && git push --tags`

**После запуска (T+1 час):**
- [ ] Проверены логи Railway — нет ошибок 500
- [ ] Проверены логи Vercel — нет ошибок сборки
- [ ] Проверен Browser Console — нет CORS ошибок
- [ ] Проверено, что изображения загружаются
- [ ] Проверено, что уведомления работают

**После запуска (T+24 часа):**
- [ ] Проверена база данных — подключения в норме
- [ ] Проверены логи — нет необычных ошибок
- [ ] Проверен DAU (Daily Active Users) в Founder Dashboard

---

## Быстрые команды для терминала

```bash
# === Backend ===

# Установить зависимости
pip install -r backend/requirements.txt

# Запустить локально
cd backend && python manage.py runserver

# Создать суперпользователя
python manage.py createsuperuser

# Собрать статику
python manage.py collectstatic --noinput

# Применить миграции
python manage.py migrate

# Создать миграции (после изменения моделей)
python manage.py makemigrations

# Сгенерировать SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(64))"

# === Frontend ===

# Установить зависимости
cd frontend && npm install

# Запустить локально
cd frontend && npm run dev

# Собрать для продакшена
cd frontend && npm run build

# === Git ===

# Сохранить изменения
git add .
git commit -m "Описание изменений"
git push

# Откатить до предыдущей версии
git log --oneline
git reset --hard <commit-hash>
git push --force
```

---

## Шпаргалка для запуска

**Если фронтенд не видит бэкенд:**
1. Проверь `NEXT_PUBLIC_API_URL` в Vercel
2. Открой `https://wrt.vercel.app`, нажми F12 → Network
3. Посмотри, какой URL отображается в запросах
4. Если URL неправильный — исправь переменную в Vercel

**Если бэкенд не стартует:**
1. Зайди в Railway → Deployments → последний деплой
2. Нажми View Logs
3. Найди красную ошибку
4. Исправь, закоммить, передеплой

**Если не работают картинки:**
1. Проверь `remotePatterns` в `next.config.ts`
2. Проверь, что в Railway настроено хранилище (Cloudinary или S3)
3. Проверь, что файл реально загрузился (смотри `backend/media/`)

**Если не работает база данных:**
1. Проверь, что в Railway есть PostgreSQL Database
2. Проверь `DATABASE_URL` в Variables
3. Проверь, что установлен `dj-database-url`