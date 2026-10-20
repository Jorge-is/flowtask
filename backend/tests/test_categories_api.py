from fastapi.testclient import TestClient


def test_list_categories_returns_seeded_categories(client: TestClient) -> None:
    response = client.get("/categories")

    assert response.status_code == 200
    names = {category["name"] for category in response.json()}
    assert {"Trabajo", "Personal", "Urgente"} <= names


def test_list_categories_exposes_id_name_and_description(client: TestClient) -> None:
    category = client.get("/categories").json()[0]

    assert set(category) == {"id", "name", "description"}
