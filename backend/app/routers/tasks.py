from typing import Annotated

from fastapi import APIRouter, Query, status

from app.dependencies import TaskServiceDep
from app.models import Task, TaskStatus
from app.schemas.pagination import Page
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["Tareas"])

NOT_FOUND_RESPONSE = {404: {"description": "Tarea no encontrada"}}


@router.get("", response_model=Page[TaskRead], summary="Listar tareas con filtros y paginación")
def list_tasks(
    service: TaskServiceDep,
    status: TaskStatus | None = None,
    category_id: Annotated[int | None, Query(gt=0)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> Page[TaskRead]:
    return service.list_tasks(
        status=status, category_id=category_id, limit=limit, offset=offset
    )


@router.get(
    "/{task_id}",
    response_model=TaskRead,
    summary="Obtener una tarea",
    responses=NOT_FOUND_RESPONSE,
)
def get_task(task_id: int, service: TaskServiceDep) -> Task:
    return service.get_task(task_id)


@router.post(
    "",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear una tarea",
    responses={422: {"description": "Datos inválidos o categoría inexistente"}},
)
def create_task(data: TaskCreate, service: TaskServiceDep) -> Task:
    return service.create_task(data)


@router.patch(
    "/{task_id}",
    response_model=TaskRead,
    summary="Actualizar parcialmente una tarea",
    responses=NOT_FOUND_RESPONSE,
)
def update_task(task_id: int, data: TaskUpdate, service: TaskServiceDep) -> Task:
    return service.update_task(task_id, data)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar una tarea",
    responses=NOT_FOUND_RESPONSE,
)
def delete_task(task_id: int, service: TaskServiceDep) -> None:
    service.delete_task(task_id)
