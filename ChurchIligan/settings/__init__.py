"""
Settings package for ChurchIligan project.
"""
import os

# Determine which settings to use based on environment
environment = os.environ.get('DJANGO_SETTINGS_MODULE', 'ChurchIligan.settings.development')

if 'production' in environment:
    from .production import *
elif 'development' in environment:
    from .development import *
else:
    from .base import *
