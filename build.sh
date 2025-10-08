#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Collect static files
echo "=== Collecting static files ==="
python manage.py collectstatic --no-input --clear

# Verify static files were collected
echo "=== Verifying static files were collected ==="
ls -lh staticfiles/ || echo "staticfiles/ directory not found!"
ls -lh staticfiles/css/ || echo "staticfiles/css/ directory not found!"
ls -lh staticfiles/js/ || echo "staticfiles/js/ directory not found!"

echo "=== Running migrations ==="
python manage.py migrate

# Create superuser if environment variables are set
python manage.py create_superuser_with_env || true
