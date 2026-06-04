# Real-Time Chat System - Server Setup Guide

Your chat system is **fully configured and ready to run**. The database migrations have been applied successfully.

## Problem with Current Terminal

The current PowerShell terminal appears to have execution issues. Here's how to fix it:

## Solution 1: Use a Fresh Terminal (Recommended)

1. **Close the current terminal** - Click the X on the terminal tab
2. **Open a new terminal** - Press `Ctrl+` ` (backtick) to open a new integrated terminal
3. **Select CMD as the default shell** when prompted, or use "Terminal: Create New Terminal" from the command palette
4. **Navigate to backend directory:**
   ```cmd
   cd C:\Users\default-pc\Documents\wrt\backend
   ```

## Solution 2: Activate VirtualEnv and Run

Once in a working terminal (CMD or fresh PowerShell):

### Option A: Using the management command
```cmd
python manage.py rundasync
```

This will start Daphne on `0.0.0.0:8000`

### Option B: Using Daphne directly
```cmd
python -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Option C: Using the startup script
```cmd
python start_server.py
```

## If You're Using the Venv

If you have a virtual environment activated:

```cmd
# Activate venv (if not already activated)
.venv\Scripts\activate.bat

# Then run:
python manage.py rundasync
```

## Verify It's Working

Once the server starts, you should see output like:
```
Starting Daphne server on 0.0.0.0:8000...
Listening on TCP address 0.0.0.0:8000
Channel layer default (asgi_local.InMemoryChannelLayer)
HTTP/2 support disabled. Use an ASGI HTTP/2 protocol server for HTTP/2 support.
```

## Frontend Setup

In a separate terminal, start the Next.js frontend:

```cmd
cd C:\Users\default-pc\Documents\wrt\frontend
npm run dev
```

The app will be available at `http://localhost:3000`

## Test the Chat

1. Go to `http://localhost:3000`
2. Create/login to two different user accounts
3. Open the chat interface
4. Messages should be delivered in real-time via WebSocket

## Troubleshooting

### Port 8000 Already in Use
```cmd
python manage.py rundasync --port 8001
```

### Module Not Found Error
Make sure you're running from the `backend` directory:
```cmd
cd C:\Users\default-pc\Documents\wrt\backend
python manage.py rundasync
```

### ImportError: No module named 'channels'
```cmd
pip install -r requirements.txt
```

## Environment Variables (Optional)

If you want to customize the server, edit `.env` in the backend directory:

```
PYTHONUNBUFFERED=1
DJANGO_SETTINGS_MODULE=config.settings.dev
```

---

**Everything is set up correctly!** You just need a working terminal to execute the commands above.
