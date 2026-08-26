# syntax=docker/dockerfile:1

# ---- builder ----
# Installs dependencies in isolation so build-time state (pip cache, any
# transient build tools a package might need) never reaches the final image.
FROM python:3.12-slim AS builder

WORKDIR /app

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt .
# --user installs into /root/.local, which we copy (not the whole stage) into
# the runtime image below - keeps pip itself and any build artifacts out of
# the final image entirely.
RUN pip install --user -r requirements.txt

# ---- runtime ----
FROM python:3.12-slim AS runtime

WORKDIR /app

# Fixed uid/gid (not just an auto-assigned one) so it's stable and
# predictable across rebuilds - useful for volume permissions and auditing.
RUN groupadd --gid 1000 appuser \
    && useradd --uid 1000 --gid appuser --create-home --shell /usr/sbin/nologin appuser

COPY --from=builder --chown=appuser:appuser /root/.local /home/appuser/.local
COPY --chown=appuser:appuser app ./app

USER appuser

ENV PATH=/home/appuser/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8000/api/health', timeout=3)" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
