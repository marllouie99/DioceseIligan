#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Clear old collected static files to prevent stale paths
python manage.py collectstatic --no-input --clear

# Diagnostics: verify static files exist and are collected (will not fail build)
echo "[Diagnostics] Checking static file discovery via 'findstatic'" || true
python manage.py findstatic css/pages/landing.css -v 2 || true
python manage.py findstatic js/landing.js -v 2 || true
python manage.py findstatic js/hero-carousel.js -v 2 || true
python manage.py findstatic js/utils/clock-sync.js -v 2 || true

echo "[Diagnostics] Checking collected files in STATIC_ROOT" || true
ls -la staticfiles/css/pages 2>/dev/null || true
ls -la staticfiles/js 2>/dev/null || true
ls -la staticfiles/js/utils 2>/dev/null || true
python manage.py migrate

# Create superuser if environment variables are set
python manage.py create_superuser_with_env || true
