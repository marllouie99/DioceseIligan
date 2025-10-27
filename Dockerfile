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

# Make build.sh executable and run it
# Adding timestamp to bust cache
RUN chmod +x build.sh && \
    echo "Build timestamp: $(date)" && \
    bash build.sh

# Expose port
EXPOSE 8000

# Start command
CMD ["gunicorn", "ChurchIligan.wsgi:application", "-c", "gunicorn.conf.py"]
