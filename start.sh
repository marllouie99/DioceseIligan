#!/usr/bin/env bash
# Startup script for Railway deployment
set -e

echo "=== Running database migrations ==="
python manage.py migrate --no-input

echo "=== Creating superuser if needed ==="
python manage.py create_superuser_with_env || echo "Superuser creation skipped"

echo "=== Starting Gunicorn server ==="
exec gunicorn ChurchIligan.wsgi:application -c gunicorn.conf.py
