"""
URL configuration for ChurchIligan project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.staticfiles.views import serve as staticfiles_serve
from django.http import FileResponse, Http404
import os

urlpatterns = [
    path('admin/', admin.site.urls),
    # Django built-in auth views (password reset, login helpers, etc.)
    path('accounts/', include('django.contrib.auth.urls')),
    # Django Allauth URLs (Google OAuth) - temporarily commented out
    # path('accounts/', include('allauth.urls')),
    # Legacy/home demo moved under /app/
    path('app/', include('core.urls', namespace='core')),
    # Landing page and auth flows (keep last so it doesn't eat /static/)
    path('', include('accounts.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
