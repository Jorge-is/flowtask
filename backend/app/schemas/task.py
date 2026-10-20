from datetime import date, datetime
from typing import Annotated

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    model_validator,
)

from app.models import TaskStatus
from app.schemas.category import CategoryRead


def _ensure_not_in_past(value: date) -> date:
    if value < date.today():
        raise ValueError("La fecha límite no puede estar en el pasado")
    return value


Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
Description = Annotated[str, Field(max_length=1000)]
DueDate = Annotated[date, AfterValidator(_ensure_not_in_past)]
CategoryId = Annotated[int, Field(gt=0)]


class TaskCreate(BaseModel):
    title: Title
    description: Description | None = None
    status: TaskStatus = TaskStatus.PENDING
    due_date: DueDate
    category_id: CategoryId


class TaskUpdate(BaseModel):
    """Actualización parcial: solo se modifican los campos enviados."""

    title: Title | None = None
    description: Description | None = None
    status: TaskStatus | None = None
    due_date: DueDate | None = None
    category_id: CategoryId | None = None

    @model_validator(mode="after")
    def reject_null_on_required_fields(self) -> "TaskUpdate":
        # `None` significa "no enviado"; enviarlo explícitamente solo vale para description.
        for field_name in ("title", "status", "due_date", "category_id"):
            if field_name in self.model_fields_set and getattr(self, field_name) is None:
                raise ValueError(f"El campo '{field_name}' no puede ser nulo")
        return self


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    status: TaskStatus
    due_date: date
    category_id: int
    category: CategoryRead
    created_at: datetime
    updated_at: datetime
