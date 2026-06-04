#!/usr/bin/env python
"""
Wrapper script to run Daphne with proper path handling
Can be run from anywhere
"""
import os
import sys
import subprocess

# Determine the backend directory (where this script is or where config module is)
backend_dir = os.path.dirname(os.path.abspath(__file__))

# Change to backend directory
os.chdir(backend_dir)

# Add backend to Python path
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

print(f"Backend directory: {backend_dir}")
print(f"Working directory: {os.getcwd()}")
print(f"Python path includes: {backend_dir}")
print()

# Set environment variables
os.environ['PYTHONPATH'] = backend_dir
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings.dev'
os.environ['PYTHONUNBUFFERED'] = '1'

print("Starting Daphne server on 0.0.0.0:8000...")
print("Press Ctrl+C to stop\n")

try:
    # Import and run Daphne
    from daphne.cli import CommandLineInterface
    
    # Set up command line arguments
    sys.argv = [
        'daphne',
        '-b', '0.0.0.0',
        '-p', '8000',
        'config.asgi:application'
    ]
    
    # Run Daphne
    CommandLineInterface.entrypoint()
    
except KeyboardInterrupt:
    print("\n\nServer stopped.")
    sys.exit(0)
except Exception as e:
    print(f"\nError: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
