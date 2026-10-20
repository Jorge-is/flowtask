"""Tests unitarios de TaskService: la lógica de negocio se prueba con repositorios en memoria."""

from collections.abc import Sequence
from datetime import date, timedelta

import pytest

from app.core.exceptions import InvalidReferenceError, NotFoundError
from app.models import Category, Task, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.task_service import TaskService


class InMemoryCategoryRepository:
    def __init__(self, categories: Sequence[Category]) -> None:
        self._categories = {category.id: category for category in categories}

    def get_by_id(self, entity_id: int) -> Category | None:
        return self._categories.get(entity_id)

    def list_all(self) -> Sequence[Category]:
        return list(self._categories.values())


class InMemoryTaskRepository:
    def __init__(self) -> None:
        self.tasks: dict[int, Task] = {}

    def get_by_id(self, entity_id: int) -> Task | None:
        return self.tasks.get(entity_id)

    def add(self, entity: Task) -> Task:
        entity.id = len(self.tasks) + 1
        self.tasks[entity.id] = entity
        return entity

    def save(self, entity: Task) -> Task:
        return entity

    def delete(self, entity: Task) -> None:
        del self.tasks[entity.id]

    def find_page(self, **_filters: object) -> tuple[Sequence[Task], int]:
        return list(self.tasks.values()), len(self.tasks)


@pytest.fixture
def task_repository() -> InMemoryTaskRepository:
    return InMemoryTaskRepository()


@pytest.fixture
def service(task_repository: InMemoryTaskRepository) -> TaskService:
    category_repository = InMemoryCategoryRepository([Category(id=1, name="Trabajo")])
    return TaskService(task_repository, category_repository)


def _new_task_data(**overrides: object) -> TaskCreate:
    fields = {
        "title": "Tarea",
        "due_date": date.today() + timedelta(days=1),
        "category_id": 1,
        **overrides,
    }
    return TaskCreate.model_validate(fields)


def test_create_task_persists_task(
    service: TaskService, task_repository: InMemoryTaskRepository
) -> None:
    task = service.create_task(_new_task_data())

    assert task_repository.get_by_id(task.id) is task
    assert task.status is TaskStatus.PENDING


def test_create_task_with_unknown_category_does_not_persist(
    service: TaskService, task_repository: InMemoryTaskRepository
) -> None:
    with pytest.raises(InvalidReferenceError):
        service.create_task(_new_task_data(category_id=99))

    assert task_repository.tasks == {}


def test_get_task_raises_not_found_for_unknown_id(service: TaskService) -> None:
    with pytest.raises(NotFoundError, match="Tarea no encontrada"):
        service.get_task(99)


def test_update_task_ignores_fields_not_sent(service: TaskService) -> None:
    task = service.create_task(_new_task_data(title="Original", description="Intacta"))

    service.update_task(task.id, TaskUpdate(status=TaskStatus.COMPLETED))

    assert task.status is TaskStatus.COMPLETED
    assert task.title == "Original"
    assert task.description == "Intacta"


def test_update_task_with_unknown_category_leaves_task_unchanged(service: TaskService) -> None:
    task = service.create_task(_new_task_data())

    with pytest.raises(InvalidReferenceError):
        service.update_task(task.id, TaskUpdate(category_id=99, title="Cambio"))

    assert task.category_id == 1
    assert task.title == "Tarea"


def test_delete_task_removes_it(
    service: TaskService, task_repository: InMemoryTaskRepository
) -> None:
    task = service.create_task(_new_task_data())

    service.delete_task(task.id)

    assert task_repository.tasks == {}
