"""Despliega FlowTask en Google Cloud emulado localmente con floci-gcp.

Crea una instancia de Cloud SQL (PostgreSQL 17) y dos servicios de Cloud Run (API y web)
a partir de las imágenes construidas con `docker compose build`. Es idempotente: volver a
ejecutarlo redespliega los servicios con la imagen actual.

Uso (desde la raíz del repositorio):
    docker compose build
    docker compose -f deploy/gcp/docker-compose.yml up -d
    python deploy/gcp/deploy.py            # desplegar
    python deploy/gcp/deploy.py --destroy  # eliminar los recursos

Solo usa la biblioteca estándar de Python (3.10+).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from typing import Any

FLOCI_URL = os.environ.get("FLOCI_URL", "http://localhost:4588")
PROJECT = "flowtask-local"
REGION = "us-central1"

SQL_INSTANCE = "flowtask-db"
SQL_VERSION = "POSTGRES_17"
DATABASE = "flowtask"
# floci-gcp fija el usuario administrador de Postgres. En GCP real las credenciales vivirían
# en Secret Manager y la conexión usaría el conector de Cloud SQL.
DB_USER = "postgres"
DB_PASSWORD = "postgres"

API_SERVICE = "flowtask-api"
WEB_SERVICE = "flowtask-web"
BACKEND_IMAGE = "flowtask-backend:latest"
FRONTEND_IMAGE = "flowtask-frontend:latest"

# Dentro de la red del emulador, floci-gcp se alcanza por su nombre de servicio de Compose.
INTERNAL_FLOCI_URL = "http://floci-gcp:4588"
DOCKER_EMBEDDED_DNS = "127.0.0.11"

POLL_INTERVAL_SECONDS = 2
TIMEOUT_SECONDS = 240


class DeployError(RuntimeError):
    """Error controlado del despliegue, con un mensaje pensado para el usuario."""


class FlociClient:
    """Cliente REST mínimo para las APIs de GCP que emula floci-gcp."""

    def __init__(self, base_url: str) -> None:
        self._base_url = base_url.rstrip("/")

    def get(self, path: str) -> dict[str, Any] | None:
        """Devuelve el recurso o None si no existe (404)."""
        try:
            return self._send("GET", path)
        except urllib.error.HTTPError as error:
            if error.code == 404:
                return None
            raise

    def post(self, path: str, body: dict[str, Any]) -> dict[str, Any]:
        return self._send("POST", path, body)

    def delete(self, path: str) -> None:
        try:
            self._send("DELETE", path)
        except urllib.error.HTTPError as error:
            if error.code != 404:
                raise

    def wait_until_reachable(self) -> None:
        deadline = time.monotonic() + 60
        while time.monotonic() < deadline:
            try:
                self._send("GET", f"/v1/projects/{PROJECT}/instances")
                return
            except (urllib.error.URLError, ConnectionError):
                time.sleep(POLL_INTERVAL_SECONDS)
        raise DeployError(
            f"floci-gcp no responde en {self._base_url}. "
            "Levántalo con: docker compose -f deploy/gcp/docker-compose.yml up -d"
        )

    def _send(self, method: str, path: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        data = json.dumps(body).encode() if body is not None else None
        request = urllib.request.Request(
            f"{self._base_url}{path}",
            data=data,
            method=method,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            payload = response.read()
        return json.loads(payload) if payload else {}


class CloudSql:
    def __init__(self, client: FlociClient) -> None:
        self._client = client
        self._base = f"/v1/projects/{PROJECT}/instances"

    def ensure_instance(self) -> str:
        """Crea la instancia si no existe y devuelve su IP privada."""
        instance = self._client.get(f"{self._base}/{SQL_INSTANCE}")
        if instance is None:
            print(f"  Creando instancia {SQL_INSTANCE} ({SQL_VERSION})...")
            self._client.post(
                self._base,
                {
                    "name": SQL_INSTANCE,
                    "databaseVersion": SQL_VERSION,
                    "region": REGION,
                    "settings": {"tier": "db-f1-micro"},
                },
            )
            instance = self._client.get(f"{self._base}/{SQL_INSTANCE}")
        if instance is None or instance.get("state") != "RUNNABLE":
            raise DeployError(f"La instancia {SQL_INSTANCE} no quedó en estado RUNNABLE.")
        return instance["ipAddresses"][0]["ipAddress"]

    def ensure_database(self) -> None:
        databases = f"{self._base}/{SQL_INSTANCE}/databases"
        if self._client.get(f"{databases}/{DATABASE}") is None:
            print(f"  Creando base de datos {DATABASE}...")
            self._client.post(databases, {"name": DATABASE})

    def delete_instance(self) -> None:
        self._client.delete(f"{self._base}/{SQL_INSTANCE}")


class CloudRun:
    def __init__(self, client: FlociClient) -> None:
        self._client = client
        self._base = f"/v2/projects/{PROJECT}/locations/{REGION}/services"

    def deploy(self, service_id: str, image: str, env: dict[str, str]) -> str:
        """(Re)despliega el servicio y devuelve su URL pública."""
        if self._client.get(f"{self._base}/{service_id}") is not None:
            print(f"  Reemplazando revisión existente de {service_id}...")
            self.delete(service_id)

        print(f"  Desplegando {service_id} ({image})...")
        container = {"image": image, "env": [{"name": k, "value": v} for k, v in env.items()]}
        self._client.post(
            f"{self._base}?serviceId={service_id}", {"template": {"containers": [container]}}
        )
        return self._wait_until_ready(service_id)

    def delete(self, service_id: str) -> None:
        self._client.delete(f"{self._base}/{service_id}")
        self._wait(lambda: self._client.get(f"{self._base}/{service_id}") is None)

    def invocation_path(self, service_id: str) -> str:
        """Ruta de invocación por path que expone floci-gcp para cada servicio."""
        return f"/run/v2/projects/{PROJECT}/locations/{REGION}/services/{service_id}"

    def _wait_until_ready(self, service_id: str) -> str:
        service: dict[str, Any] = {}

        def is_settled() -> bool:
            nonlocal service
            service = self._client.get(f"{self._base}/{service_id}") or {}
            state = service.get("terminalCondition", {}).get("state")
            return state in {"CONDITION_SUCCEEDED", "CONDITION_FAILED"}

        self._wait(is_settled)
        condition = service["terminalCondition"]
        if condition["state"] != "CONDITION_SUCCEEDED":
            raise DeployError(f"{service_id} falló: {condition.get('message', 'sin detalle')}")
        return service["uri"]

    @staticmethod
    def _wait(condition: Any) -> None:
        deadline = time.monotonic() + TIMEOUT_SECONDS
        while not condition():
            if time.monotonic() > deadline:
                raise DeployError("Se agotó el tiempo de espera de la operación.")
            time.sleep(POLL_INTERVAL_SECONDS)


def deploy(client: FlociClient) -> None:
    cloud_sql = CloudSql(client)
    cloud_run = CloudRun(client)

    print("1/3 Cloud SQL")
    db_ip = cloud_sql.ensure_instance()
    cloud_sql.ensure_database()

    print("2/3 Cloud Run: API")
    database_url = f"postgresql+psycopg://{DB_USER}:{DB_PASSWORD}@{db_ip}:5432/{DATABASE}"
    api_url = cloud_run.deploy(API_SERVICE, BACKEND_IMAGE, {"DATABASE_URL": database_url})

    print("3/3 Cloud Run: web")
    # nginx reenvía /api a la API a través del front door del emulador. En GCP real
    # API_UPSTREAM sería directamente la URL https://flowtask-api-xxxx.run.app.
    api_upstream = INTERNAL_FLOCI_URL + cloud_run.invocation_path(API_SERVICE)
    web_env = {
        "API_UPSTREAM": api_upstream,
        # floci-gcp conecta la red del emulador después de arrancar el contenedor, así que
        # el resolv.conf inicial no conoce "floci-gcp": se fija el DNS embebido de Docker.
        "NGINX_RESOLVER": DOCKER_EMBEDDED_DNS,
    }
    web_url = cloud_run.deploy(WEB_SERVICE, FRONTEND_IMAGE, web_env)

    print("\nDespliegue completado:")
    print(f"  Web (Cloud Run)  {web_url}")
    print(f"  API (Cloud Run)  {api_url}/docs")
    print(f"  Cloud SQL        {PROJECT}:{REGION}:{SQL_INSTANCE} ({db_ip})")


def destroy(client: FlociClient) -> None:
    cloud_run = CloudRun(client)
    for service_id in (WEB_SERVICE, API_SERVICE):
        print(f"Eliminando servicio {service_id}...")
        cloud_run.delete(service_id)
    print(f"Eliminando instancia {SQL_INSTANCE}...")
    CloudSql(client).delete_instance()
    print("Recursos eliminados.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Despliega FlowTask en floci-gcp.")
    parser.add_argument("--destroy", action="store_true", help="eliminar los recursos creados")
    args = parser.parse_args()

    client = FlociClient(FLOCI_URL)
    try:
        client.wait_until_reachable()
        if args.destroy:
            destroy(client)
        else:
            deploy(client)
    except DeployError as error:
        print(f"\nError: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
