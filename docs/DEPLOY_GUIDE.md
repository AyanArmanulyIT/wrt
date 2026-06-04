# 🚀 Deploy Guide: WRT

## 📦 Backend → Railway

### Шаг 1: Prepare backend
```
cd backend
```

**Railway автоматически обнаружит:** `Procfile`, `requirements.txt`, `railway.json`

### Шаг 2: Push to Railway

1. Create account on https://railway.app (GitHub login)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select `AyanArmanulyIT/wrt`
4. Railway will auto-detect the backend

### Шаг 3: Configure Railway

**Environment Variables** (Settings → Variables):
```
DJANGO_SETTINGS_MODULE=config.settings.production
SECRET_KEY=generate-a-long-random-string
DEBUG=False
ALLOWED_HOSTS=.railway.app,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://wrt-username.vercel.app,https://*.railway.app
```

**Add PostgreSQL** (New → Database → PostgreSQL)
- Railway auto-injects `DATABASE_URL`

**Add Redis** (New → Redis)
- Railway auto-injects `REDIS_URL`

### Шаг 4: Run migrations
Railway runs `release: python manage.py migrate --noinput` automatically.

### Шаг 5: Create superuser
After deploy, in Railway terminal:
```bash
python manage.py createsuperuser
python manage.py shell -c "from apps.school.models import School; from apps.chats.models import OnlineStatus; print('OK')"
```

**Railway URL will be:** `https://wrt-backend.up.railway.app`

---

## 🖥 Frontend → Vercel

### Шаг 1: Prepare frontend
```bash
cd frontend
npx next build  # test locally first
```

### Шаг 2: Push to Vercel

1. Create account on https://vercel.com (GitHub login)
2. Click **Add New** → **Project**
3. Import `AyanArmanulyIT/wrt`
4. Set **Root Directory** to `frontend`
5. Configure:

**Framework Preset:** Next.js
**Build Command:** `next build`
**Output Directory:** `.next`

### Шаг 3: Environment Variables in Vercel
```
NEXT_PUBLIC_API_URL=https://wrt-backend.up.railway.app
```

### Шаг 4: Deploy
Click **Deploy**. Vercel will automatically:
- Install deps
- Build with `next build`
- Deploy to `wrt-username.vercel.app`

---

## 🌐 Final URLs

| Service | URL |
|---------|-----|
| Frontend | `https://wrt-username.vercel.app` |
| Backend API | `https://wrt-backend.up.railway.app` |
| Admin panel | `https://wrt-backend.up.railway.app/admin/` |

## ✅ Health Check

Backend health: `GET https://wrt-backend.up.railway.app/api/health/`
Frontend: `GET https://wrt-username.vercel.app/`

## 📝 Notes

- Media files (avatars, images) will NOT persist on Railway (ephemeral filesystem).
  - **Fix later:** Use AWS S3 / DigitalOcean Spaces / Cloudflare R2
  - Set `DEFAULT_FILE_STORAGE` to `storages.backends.s3boto3.S3Boto3Storage`
- WebSockets need Redis on Railway (included in config)
- If CORS errors: update `CORS_ALLOWED_ORIGINS` in Railway env with exact Vercel URL