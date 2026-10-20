from collections.abc import Sequence

from fastapi import APIRouter

from app.dependencies import CategoryServiceDep
from app.models import Category
from app.schemas.category import CategoryRead

router = APIRouter(prefix="/categories", tags=["Categorías"])


@router.get("", response_model=list[CategoryRead], summary="Listar categorías")
def list_categories(service: CategoryServiceDep) -> Sequence[Category]:
    return service.list_categories()
