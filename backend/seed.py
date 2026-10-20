"""Carga las categorías base. Es idempotente: se puede ejecutar varias veces.

Uso: python seed.py
"""

from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Category
from app.repositories.category_repository import CategoryRepository

DEFAULT_CATEGORIES: tuple[tuple[str, str], ...] = (
    ("Trabajo", "Actividades laborales y de proyectos del equipo"),
    ("Personal", "Pendientes y objetivos personales"),
    ("Urgente", "Asuntos que requieren atención inmediata"),
)


def seed_default_categories(session: Session) -> int:
    """Inserta las categorías que falten y devuelve cuántas se crearon."""
    repository = CategoryRepository(session)
    created = 0
    for name, description in DEFAULT_CATEGORIES:
        if repository.get_by_name(name) is None:
            repository.add(Category(name=name, description=description))
            created += 1
    return created


if __name__ == "__main__":
    with SessionLocal() as session:
        total_created = seed_default_categories(session)
    print(f"Seed completado: {total_created} categoría(s) nueva(s).")
