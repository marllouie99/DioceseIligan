FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy project files
COPY . .

# Make build.sh executable
RUN chmod +x build.sh

# Only collect static files during build (no database needed)
RUN python manage.py collectstatic --no-input --clear || echo "Static files collection skipped"

# Make start script executable
RUN chmod +x start.sh

# Expose port
EXPOSE 8000

# Start command - run migrations then start server
CMD ["bash", "start.sh"]
