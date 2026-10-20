from app.core.exceptions import InvalidReferenceError
from app.models import Task
from app.repositories.category_repository import CategoryRepository
from app.repositories.task_repository import TaskRepository
from app.schemas.task import TaskCreate

CATEGORY_NOT_FOUND = "Categoría no encontrada"


class TaskService:
    def __init__(
        self,
        task_repository: TaskRepository,
        category_repository: CategoryRepository,
    ) -> None:
        self._task_repository = task_repository
        self._category_repository = category_repository

    def create_task(self, data: TaskCreate) -> Task:
        self._ensure_category_exists(data.category_id)
        return self._task_repository.add(Task(**data.model_dump()))

    def _ensure_category_exists(self, category_id: int) -> None:
        if self._category_repository.get_by_id(category_id) is None:
            raise InvalidReferenceError(CATEGORY_NOT_FOUND)
