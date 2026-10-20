from datetime import date, datetime
from enum import Enum
from typing import TYPE_CHECKING

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.category import Category


class TaskStatus(str, Enum):
    PENDING = "Pendiente"
    IN_PROGRESS = "En Progreso"
    COMPLETED = "Completada"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[TaskStatus] = mapped_column(
        # VARCHAR + CHECK en lugar de un ENUM nativo: portable entre SQLite y PostgreSQL.
        SqlEnum(
            TaskStatus,
            name="task_status",
            native_enum=False,
            values_callable=lambda statuses: [status.value for status in statuses],
            validate_strings=True,
        ),
        default=TaskStatus.PENDING,
    )
    due_date: Mapped[date] = mapped_column(Date)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.id", ondelete="RESTRICT"), index=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    category: Mapped["Category"] = relationship(back_populates="tasks")
