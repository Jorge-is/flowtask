from collections.abc import Callable, Iterator
from datetime import date, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Category
from main import create_app
from seed import seed_default_categories


@pytest.fixture
def db_session() -> Iterator[Session]:
    """Base SQLite en memoria, aislada y recreada para cada test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    with session_factory() as session:
        yield session
    engine.dispose()


@pytest.fixture
def seeded_session(db_session: Session) -> Session:
    seed_default_categories(db_session)
    return db_session


@pytest.fixture
def client(seeded_session: Session) -> Iterator[TestClient]:
    app = create_app()
    app.dependency_overrides[get_db] = lambda: seeded_session
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def category_ids(seeded_session: Session) -> dict[str, int]:
    categories = seeded_session.scalars(select(Category)).all()
    return {category.name: category.id for category in categories}


@pytest.fixture
def future_date() -> str:
    return (date.today() + timedelta(days=7)).isoformat()


@pytest.fixture
def create_task(
    client: TestClient, category_ids: dict[str, int], future_date: str
) -> Callable[..., dict[str, Any]]:
    """Factory: crea una tarea vía API con valores por defecto sobrescribibles."""

    def _create_task(**overrides: Any) -> dict[str, Any]:
        payload = {
            "title": "Preparar informe",
            "description": "Informe mensual de avance",
            "due_date": future_date,
            "category_id": category_ids["Trabajo"],
            **overrides,
        }
        response = client.post("/tasks", json=payload)
        assert response.status_code == 201, response.text
        return response.json()

    return _create_task
