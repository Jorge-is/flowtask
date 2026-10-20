from collections.abc import Sequence

from sqlalchemy import Select, func, select
from sqlalchemy.orm import joinedload

from app.models import Task, TaskStatus
from app.repositories.base import BaseRepository


class TaskRepository(BaseRepository[Task]):
    model = Task

    def find_page(
        self,
        *,
        status: TaskStatus | None = None,
        category_id: int | None = None,
        limit: int,
        offset: int,
    ) -> tuple[Sequence[Task], int]:
        """Devuelve una página de tareas filtradas y el total sin paginar."""
        filtered = self._apply_filters(select(Task), status, category_id)
        total = self._session.scalar(select(func.count()).select_from(filtered.subquery())) or 0
        tasks = self._session.scalars(
            filtered.options(joinedload(Task.category))  # evita N+1 al leer la categoría
            .order_by(Task.due_date, Task.id)
            .limit(limit)
            .offset(offset)
        ).all()
        return tasks, total

    @staticmethod
    def _apply_filters(
        query: Select[tuple[Task]], status: TaskStatus | None, category_id: int | None
    ) -> Select[tuple[Task]]:
        if status is not None:
            query = query.where(Task.status == status)
        if category_id is not None:
            query = query.where(Task.category_id == category_id)
        return query
