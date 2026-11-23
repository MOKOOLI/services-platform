#!/bin/sh
set -e
# Migrations + idempotent seed run on every start (works on Render free tier too,
# where preDeployCommand is not available).
alembic upgrade head
python -m app.seed
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
