# syntax=docker/dockerfile:1
FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DATABASE_URL=sqlite:////app/data/flowtask.db

WORKDIR /app

# Dependencias primero: esta capa se reutiliza mientras requirements.txt no cambie.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

RUN useradd --system --uid 10001 --no-create-home appuser \
    && mkdir -p /app/data \
    && chown appuser /app/data \
    && chmod +x docker-entrypoint.sh
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

# Migraciones y seed antes de levantar la API (ver docker-entrypoint.sh).
ENTRYPOINT ["./docker-entrypoint.sh"]
# PORT lo inyecta Cloud Run; en local se usa 8000.
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
