#!/bin/sh
set -e

echo "Aplicando migraciones..."
alembic upgrade head

echo "Cargando categorías base..."
python seed.py

exec "$@"
