#!/usr/bin/env python
"""Run Daphne server"""
import os
import sys
import subprocess

# Get backend path
backend_path = os.path.dirname(os.path.abspath(__file__))
venv_python = os.path.join(backend_path, '.venv', 'Scripts', 'python.exe')

# Use venv python if it exists, otherwise use system python
python_exe = venv_python if os.path.exists(venv_python) else sys.executable

print(f"Using Python: {python_exe}")
print(f"Backend path: {backend_path}")

# Set environment
env = os.environ.copy()
env['PYTHONPATH'] = backend_path
env['DJANGO_SETTINGS_MODULE'] = 'config.settings.dev'
env['PYTHONUNBUFFERED'] = '1'

# Run daphne
args = [
    python_exe,
    '-m', 'daphne',
    '-b', '0.0.0.0',
    '-p', '8000',
    'config.asgi:application'
]

print(f"Running: {' '.join(args)}")
print(f"From: {backend_path}")
print()

try:
    subprocess.run(args, cwd=backend_path, env=env)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
