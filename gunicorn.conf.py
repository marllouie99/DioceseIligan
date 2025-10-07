"""
Gunicorn configuration for production deployment
"""
import multiprocessing
import os

# Bind to PORT environment variable (required by Render)
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# Worker configuration - optimized for Render free tier (512MB RAM)
# Free tier can't handle too many workers, limit to 2-3
workers = min(multiprocessing.cpu_count() * 2 + 1, 3)
worker_class = "sync"
worker_connections = 1000
max_requests = 1000  # Restart workers after 1000 requests to prevent memory leaks
max_requests_jitter = 50  # Add randomness to prevent all workers restarting at once

# Timeout settings
# With async email sending, 30 seconds should be sufficient
# But we increase it slightly to handle occasional slow database queries
timeout = 60  # Increased from default 30 seconds
graceful_timeout = 30
keepalive = 2

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"

# Process naming
proc_name = "churchiligan"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL (handled by Render's proxy)
forwarded_allow_ips = "*"
secure_scheme_headers = {
    "X-FORWARDED-PROTOCOL": "ssl",
    "X-FORWARDED-PROTO": "https",
    "X-FORWARDED-SSL": "on",
}
