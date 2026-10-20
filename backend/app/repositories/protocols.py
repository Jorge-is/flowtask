"""Contratos de acceso a datos. Los servicios dependen de estas abstracciones, no de SQLAlchemy."""

from collections.abc import Sequence
from typing import Protocol

from app.models import Category, Task, TaskStatus


class CategoryRepositoryProtocol(Protocol):
    def get_by_id(self, entity_id: int) -> Category | None: ...

    def list_all(self) -> Sequence[Category]: ...


class TaskRepositoryProtocol(Protocol):
    def get_by_id(self, entity_id: int) -> Task | None: ...

    def add(self, entity: Task) -> Task: ...

    def save(self, entity: Task) -> Task: ...

    def delete(self, entity: Task) -> None: ...

    def find_page(
        self,
        *,
        status: TaskStatus | None = None,
        category_id: int | None = None,
        limit: int,
        offset: int,
    ) -> tuple[Sequence[Task], int]: ...
