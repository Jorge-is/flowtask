from fastapi.testclient import TestClient

from app.dependencies import get_category_service
from main import create_app


class ExplodingCategoryService:
    def list_categories(self) -> None:
        raise RuntimeError("fallo inesperado de infraestructura")


def test_unexpected_error_returns_json_500_without_internals() -> None:
    app = create_app()
    app.dependency_overrides[get_category_service] = ExplodingCategoryService
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/categories")

    assert response.status_code == 500
    assert response.json() == {"detail": "Error interno del servidor"}
