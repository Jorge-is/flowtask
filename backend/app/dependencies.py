"""Composición de dependencias: construye cada servicio con sus repositorios."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.category_repository import CategoryRepository
from app.services.category_service import CategoryService

DbSession = Annotated[Session, Depends(get_db)]


def get_category_service(session: DbSession) -> CategoryService:
    return CategoryService(CategoryRepository(session))


CategoryServiceDep = Annotated[CategoryService, Depends(get_category_service)]
