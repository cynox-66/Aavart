FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend /app/backend
RUN pip install --no-cache-dir /app/backend

ENV PYTHONPATH=/app/backend/src

EXPOSE 8000

