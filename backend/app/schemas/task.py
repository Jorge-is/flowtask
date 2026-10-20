from datetime import date, datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator

from app.models import TaskStatus
from app.schemas.category import CategoryRead

Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=150)]
Description = Annotated[str, Field(max_length=1000)]
CategoryId = Annotated[int, Field(gt=0)]


class TaskCreate(BaseModel):
    title: Title
    description: Description | None = None
    status: TaskStatus = TaskStatus.PENDING
    due_date: date
    category_id: CategoryId

    @field_validator("due_date")
    @classmethod
    def due_date_not_in_past(cls, value: date) -> date:
        if value < date.today():
            raise ValueError("La fecha límite no puede estar en el pasado")
        return value


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
