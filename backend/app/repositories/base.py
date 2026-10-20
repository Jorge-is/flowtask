from typing import Generic, TypeVar

from sqlalchemy.orm import Session

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Operaciones CRUD comunes. Cada subclase declara el modelo que gestiona."""

    model: type[ModelT]

    def __init__(self, session: Session) -> None:
        self._session = session

    def get_by_id(self, entity_id: int) -> ModelT | None:
        return self._session.get(self.model, entity_id)

    def add(self, entity: ModelT) -> ModelT:
        self._session.add(entity)
        return self.save(entity)

    def save(self, entity: ModelT) -> ModelT:
        self._session.commit()
        self._session.refresh(entity)
        return entity

    def delete(self, entity: ModelT) -> None:
        self._session.delete(entity)
        self._session.commit()
