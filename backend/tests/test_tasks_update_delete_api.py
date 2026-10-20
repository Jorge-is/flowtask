from collections.abc import Callable
from datetime import date, timedelta
from typing import Any

import pytest
from fastapi.testclient import TestClient

CreateTask = Callable[..., dict[str, Any]]


def test_patch_task_marks_it_as_completed(client: TestClient, create_task: CreateTask) -> None:
    task = create_task()

    response = client.patch(f"/tasks/{task['id']}", json={"status": "Completada"})

    assert response.status_code == 200
    assert response.json()["status"] == "Completada"
    assert client.get(f"/tasks/{task['id']}").json()["status"] == "Completada"


def test_patch_task_only_changes_sent_fields(client: TestClient, create_task: CreateTask) -> None:
    task = create_task(title="Original", description="Se mantiene")

    response = client.patch(f"/tasks/{task['id']}", json={"title": "Nuevo título"})

    body = response.json()
    assert body["title"] == "Nuevo título"
    assert body["description"] == "Se mantiene"
    assert body["status"] == task["status"]


def test_patch_task_can_change_category(
    client: TestClient, create_task: CreateTask, category_ids: dict[str, int]
) -> None:
    task = create_task()

    response = client.patch(f"/tasks/{task['id']}", json={"category_id": category_ids["Urgente"]})

    assert response.json()["category"]["name"] == "Urgente"


def test_patch_nonexistent_task_returns_404(client: TestClient) -> None:
    response = client.patch("/tasks/99999", json={"status": "Completada"})

    assert response.status_code == 404
    assert response.json() == {"detail": "Tarea no encontrada"}


def test_patch_task_with_unknown_category_returns_422(
    client: TestClient, create_task: CreateTask
) -> None:
    task = create_task()

    response = client.patch(f"/tasks/{task['id']}", json={"category_id": 9999})

    assert response.status_code == 422
    assert response.json() == {"detail": "Categoría no encontrada"}


@pytest.mark.parametrize(
    "payload",
    [
        {"status": "Archivada"},
        {"title": "   "},
        {"title": None},
        {"status": None},
        {"due_date": None},
        {"category_id": None},
    ],
)
def test_patch_task_with_invalid_values_returns_422(
    client: TestClient, create_task: CreateTask, payload: dict[str, Any]
) -> None:
    task = create_task()

    response = client.patch(f"/tasks/{task['id']}", json=payload)

    assert response.status_code == 422


def test_patch_task_with_past_due_date_returns_422(
    client: TestClient, create_task: CreateTask
) -> None:
    task = create_task()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    response = client.patch(f"/tasks/{task['id']}", json={"due_date": yesterday})

    assert response.status_code == 422


def test_patch_task_can_clear_description(client: TestClient, create_task: CreateTask) -> None:
    task = create_task(description="Temporal")

    response = client.patch(f"/tasks/{task['id']}", json={"description": None})

    assert response.json()["description"] is None


def test_delete_task_returns_204_and_removes_it(
    client: TestClient, create_task: CreateTask
) -> None:
    task = create_task()

    response = client.delete(f"/tasks/{task['id']}")

    assert response.status_code == 204
    assert client.get(f"/tasks/{task['id']}").status_code == 404


def test_delete_nonexistent_task_returns_404(client: TestClient) -> None:
    response = client.delete("/tasks/99999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Tarea no encontrada"}
