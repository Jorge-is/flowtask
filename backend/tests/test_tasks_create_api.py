from collections.abc import Callable
from datetime import date, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def valid_payload(category_ids: dict[str, int], future_date: str) -> dict[str, Any]:
    return {
        "title": "Revisar pull requests",
        "description": "Revisar los PR pendientes del sprint",
        "due_date": future_date,
        "category_id": category_ids["Trabajo"],
    }


def test_create_task_returns_201_with_generated_id(
    client: TestClient, valid_payload: dict[str, Any]
) -> None:
    response = client.post("/tasks", json=valid_payload)

    assert response.status_code == 201
    body = response.json()
    assert isinstance(body["id"], int)
    assert body["title"] == valid_payload["title"]
    assert body["due_date"] == valid_payload["due_date"]


def test_create_task_defaults_status_to_pendiente(
    client: TestClient, valid_payload: dict[str, Any]
) -> None:
    response = client.post("/tasks", json=valid_payload)

    assert response.json()["status"] == "Pendiente"


def test_create_task_includes_category_name(
    client: TestClient, valid_payload: dict[str, Any]
) -> None:
    response = client.post("/tasks", json=valid_payload)

    assert response.json()["category"]["name"] == "Trabajo"


def test_create_task_without_description_is_allowed(
    client: TestClient, valid_payload: dict[str, Any]
) -> None:
    del valid_payload["description"]

    response = client.post("/tasks", json=valid_payload)

    assert response.status_code == 201
    assert response.json()["description"] is None


def test_create_task_trims_title(client: TestClient, valid_payload: dict[str, Any]) -> None:
    response = client.post("/tasks", json={**valid_payload, "title": "  Revisar PR  "})

    assert response.json()["title"] == "Revisar PR"


@pytest.mark.parametrize("title", ["", "   "])
def test_create_task_with_blank_title_returns_422(
    client: TestClient, valid_payload: dict[str, Any], title: str
) -> None:
    response = client.post("/tasks", json={**valid_payload, "title": title})

    assert response.status_code == 422


def test_create_task_without_title_returns_422(
    client: TestClient, valid_payload: dict[str, Any]
) -> None:
    del valid_payload["title"]

    response = client.post("/tasks", json=valid_payload)

    assert response.status_code == 422


def test_create_task_with_invalid_status_returns_422(
    client: TestClient, valid_payload: dict[str, Any]
) -> None:
    response = client.post("/tasks", json={**valid_payload, "status": "Archivada"})

    assert response.status_code == 422


def test_create_task_with_unknown_category_returns_422_with_clear_message(
    client: TestClient, valid_payload: dict[str, Any]
) -> None:
    response = client.post("/tasks", json={**valid_payload, "category_id": 9999})

    assert response.status_code == 422
    assert response.json() == {"detail": "Categoría no encontrada"}


@pytest.mark.parametrize("due_date", ["31/12/2030", "2030-02-30", "mañana"])
def test_create_task_with_invalid_due_date_returns_422(
    client: TestClient, valid_payload: dict[str, Any], due_date: str
) -> None:
    response = client.post("/tasks", json={**valid_payload, "due_date": due_date})

    assert response.status_code == 422


def test_create_task_with_past_due_date_returns_422(
    client: TestClient, valid_payload: dict[str, Any]
) -> None:
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    response = client.post("/tasks", json={**valid_payload, "due_date": yesterday})

    assert response.status_code == 422


def test_create_task_accepts_explicit_valid_status(
    create_task: Callable[..., dict[str, Any]],
) -> None:
    task = create_task(status="En Progreso")

    assert task["status"] == "En Progreso"
