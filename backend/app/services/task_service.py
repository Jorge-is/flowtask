from app.core.exceptions import InvalidReferenceError, NotFoundError
from app.models import Task, TaskStatus
from app.repositories.category_repository import CategoryRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.pagination import Page
from app.schemas.task import TaskCreate, TaskRead

TASK_NOT_FOUND = "Tarea no encontrada"
CATEGORY_NOT_FOUND = "Categoría no encontrada"


class TaskService:
    def __init__(
        self,
        task_repository: TaskRepository,
        category_repository: CategoryRepository,
    ) -> None:
        self._task_repository = task_repository
        self._category_repository = category_repository

    def list_tasks(
        self,
        *,
        status: TaskStatus | None,
        category_id: int | None,
        limit: int,
        offset: int,
    ) -> Page[TaskRead]:
        tasks, total = self._task_repository.find_page(
            status=status, category_id=category_id, limit=limit, offset=offset
        )
        return Page[TaskRead](
            items=[TaskRead.model_validate(task) for task in tasks],
            total=total,
            limit=limit,
            offset=offset,
        )

    def get_task(self, task_id: int) -> Task:
        task = self._task_repository.get_by_id(task_id)
        if task is None:
            raise NotFoundError(TASK_NOT_FOUND)
        return task

    def create_task(self, data: TaskCreate) -> Task:
        self._ensure_category_exists(data.category_id)
        return self._task_repository.add(Task(**data.model_dump()))

    def _ensure_category_exists(self, category_id: int) -> None:
        if self._category_repository.get_by_id(category_id) is None:
            raise InvalidReferenceError(CATEGORY_NOT_FOUND)
