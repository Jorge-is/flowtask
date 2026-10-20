from pathlib import Path

import pytest
from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError

import app.models  # noqa: F401
from app.database import Base

BACKEND_DIR = Path(__file__).resolve().parents[1]


@pytest.fixture
def migrated_url(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> str:
    database_url = f"sqlite:///{tmp_path / 'migrations.db'}"
    monkeypatch.setenv("DATABASE_URL", database_url)
    from app.core.config import get_settings

    get_settings.cache_clear()
    command.upgrade(Config(str(BACKEND_DIR / "alembic.ini")), "head")
    yield database_url
    get_settings.cache_clear()


def test_migrations_match_models(migrated_url: str) -> None:
    engine = create_engine(migrated_url)
    with engine.connect() as connection:
        differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    engine.dispose()

    assert differences == []


def test_database_rejects_invalid_status(migrated_url: str) -> None:
    engine = create_engine(migrated_url)
    with engine.begin() as connection:
        connection.execute(text("INSERT INTO categories (id, name) VALUES (1, 'Trabajo')"))

    with pytest.raises(IntegrityError), engine.begin() as connection:
        connection.execute(
            text(
                "INSERT INTO tasks (title, status, due_date, category_id) "
                "VALUES ('x', 'Archivada', '2099-01-01', 1)"
            )
        )
    engine.dispose()
