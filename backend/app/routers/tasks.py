from fastapi import APIRouter, status

from app.dependencies import TaskServiceDep
from app.models import Task
from app.schemas.task import TaskCreate, TaskRead

router = APIRouter(prefix="/tasks", tags=["Tareas"])


@router.post(
    "",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una tarea",
    responses={422: {"description": "Datos inválidos o categoría inexistente"}},
)
def create_task(data: TaskCreate, service: TaskServiceDep) -> Task:
    return service.create_task(data)
