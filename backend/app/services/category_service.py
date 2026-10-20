from collections.abc import Sequence

from app.models import Category
from app.repositories.category_repository import CategoryRepository


class CategoryService:
    def __init__(self, category_repository: CategoryRepository) -> None:
        self._category_repository = category_repository

    def list_categories(self) -> Sequence[Category]:
        return self._category_repository.list_all()
