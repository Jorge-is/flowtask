from collections.abc import Sequence

from sqlalchemy import select

from app.models import Category
from app.repositories.base import BaseRepository


class CategoryRepository(BaseRepository[Category]):
    model = Category

    def list_all(self) -> Sequence[Category]:
        return self._session.scalars(select(Category).order_by(Category.name)).all()

    def get_by_name(self, name: str) -> Category | None:
        return self._session.scalar(select(Category).where(Category.name == name))
