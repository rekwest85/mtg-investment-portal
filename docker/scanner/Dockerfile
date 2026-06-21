# ============================================================
# MTG Scanner Service — Dockerfile
# Runs: HTTP trigger server + 6-hour scheduler
# ============================================================

FROM python:3.11-slim

WORKDIR /app

# Install minimal deps
COPY docker/scanner/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy entrypoint
COPY docker/scanner/server.py .

# Scripts volume mounted at /app/scripts
# Data volume mounted at /data

EXPOSE 8899

ENV PORT=8899
ENV DATA_DIR=/data
ENV SCRIPTS_DIR=/app/scripts

CMD ["python", "server.py"]
