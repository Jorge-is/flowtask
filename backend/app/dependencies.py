"""Composición de dependencias: construye cada servicio con sus repositorios."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.category_repository import CategoryRepository
from app.repositories.task_repository import TaskRepository
from app.services.category_service import CategoryService
from app.services.task_service import TaskService

DbSession = Annotated[Session, Depends(get_db)]


def get_category_service(session: DbSession) -> CategoryService:
    return CategoryService(CategoryRepository(session))


def get_task_service(session: DbSession) -> TaskService:
    return TaskService(TaskRepository(session), CategoryRepository(session))


CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]
TaskServiceDep = Annotated[TaskService, Depends(get_task_service)]
