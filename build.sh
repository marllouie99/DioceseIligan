#!/usr/bin/env bash
# exit on error
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Clear old collected static files to prevent stale paths
python manage.py collectstatic --no-input --clear
python manage.py migrate
