from collections.abc import Callable
from typing import Any

from fastapi.testclient import TestClient

CreateTask = Callable[..., dict[str, Any]]


def test_get_task_by_id_returns_task(client: TestClient, create_task: CreateTask) -> None:
    task = create_task()

    response = client.get(f"/tasks/{task['id']}")

    assert response.status_code == 200
    assert response.json()["title"] == task["title"]


def test_get_nonexistent_task_returns_404_with_detail(client: TestClient) -> None:
    response = client.get("/tasks/99999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Tarea no encontrada"}


def test_get_task_with_non_numeric_id_returns_422(client: TestClient) -> None:
    response = client.get("/tasks/abc")

    assert response.status_code == 422


def test_list_tasks_returns_paginated_envelope(client: TestClient, create_task: CreateTask) -> None:
    create_task()

    response = client.get("/tasks")

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"items", "total", "limit", "offset"}
    assert body["total"] == 1
    assert body["items"][0]["category"]["name"] == "Trabajo"


def test_list_tasks_filters_by_status(client: TestClient, create_task: CreateTask) -> None:
    create_task(title="Pendiente 1")
    create_task(title="En curso", status="En Progreso")

    response = client.get("/tasks", params={"status": "En Progreso"})

    titles = [task["title"] for task in response.json()["items"]]
    assert titles == ["En curso"]


def test_list_tasks_with_invalid_status_filter_returns_422(client: TestClient) -> None:
    response = client.get("/tasks", params={"status": "Archivada"})

    assert response.status_code == 422


def test_list_tasks_filters_by_category(
    client: TestClient, create_task: CreateTask, category_ids: dict[str, int]
) -> None:
    create_task(title="Trabajo 1")
    create_task(title="Personal 1", category_id=category_ids["Personal"])

    response = client.get("/tasks", params={"category_id": category_ids["Personal"]})

    titles = [task["title"] for task in response.json()["items"]]
    assert titles == ["Personal 1"]


def test_list_tasks_applies_limit_and_offset(client: TestClient, create_task: CreateTask) -> None:
    for index in range(5):
        create_task(title=f"Tarea {index}")

    response = client.get("/tasks", params={"limit": 2, "offset": 2})

    body = response.json()
    assert body["total"] == 5
    assert body["limit"] == 2
    assert body["offset"] == 2
    assert len(body["items"]) == 2


def test_list_tasks_rejects_limit_above_maximum(client: TestClient) -> None:
    response = client.get("/tasks", params={"limit": 101})

    assert response.status_code == 422


def test_list_tasks_orders_by_nearest_due_date(client: TestClient, create_task: CreateTask) -> None:
    create_task(title="Lejana", due_date="2099-12-31")
    create_task(title="Cercana", due_date="2099-01-01")

    titles = [task["title"] for task in client.get("/tasks").json()["items"]]

    assert titles == ["Cercana", "Lejana"]
