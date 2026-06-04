# Run Daphne Server for Django Channels
$BackendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Env:PYTHONPATH = $BackendPath
$Env:DJANGO_SETTINGS_MODULE = "config.settings.dev"

Write-Host "Starting Daphne server..."
Write-Host "Backend path: $BackendPath"
Write-Host ""

# Try venv Python first
$VenvPython = Join-Path $BackendPath ".venv\Scripts\python.exe"
if (Test-Path $VenvPython) {
    $PythonExe = $VenvPython
    Write-Host "Using venv Python: $VenvPython"
} else {
    $PythonExe = "python.exe"
    Write-Host "Using system Python"
}

# Run Daphne
& $PythonExe -m daphne -b 0.0.0.0 -p 8000 config.asgi:application
