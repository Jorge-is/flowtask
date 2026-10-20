from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Category
from seed import seed_default_categories


def test_seed_creates_default_categories(db_session: Session) -> None:
    created = seed_default_categories(db_session)

    assert created == 3
    assert db_session.scalar(select(func.count()).select_from(Category)) == 3


def test_seed_is_idempotent(db_session: Session) -> None:
    seed_default_categories(db_session)

    created_again = seed_default_categories(db_session)

    assert created_again == 0
    assert db_session.scalar(select(func.count()).select_from(Category)) == 3
