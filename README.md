# FlowTask

[![CI](https://github.com/Jorge-is/flowtask/actions/workflows/ci.yml/badge.svg)](https://github.com/Jorge-is/flowtask/actions/workflows/ci.yml)

Gestor de tareas por categorías para pequeños equipos: crear tareas con fecha límite, filtrarlas por estado o categoría, completarlas con un clic, editarlas y eliminarlas, todo sin recargar la página.

| Capa | Tecnología |
|---|---|
| Backend | Python 3.10+ · FastAPI · SQLAlchemy 2.0 · Pydantic v2 · Alembic |
| Frontend | Angular 21 (standalone, signals) · TypeScript · Angular Material |
| Base de datos | SQLite en local · PostgreSQL 17 en Docker y en el despliegue emulado |
| Calidad | pytest · Vitest · ruff · Prettier · colección Bruno · GitHub Actions |
| Infraestructura | Docker Compose · nginx · Cloud Run + Cloud SQL emulados con [floci-gcp](docs/deploy-gcp.md) |

## Contenido

- [Casos de la prueba](#casos-de-la-prueba)
- [Inicio rápido con Docker](#inicio-rápido-con-docker)
- [Instalación local paso a paso](#instalación-local-paso-a-paso)
- [Tests](#tests)
- [Colección Bruno](#colección-bruno)
- [API](#api)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Decisiones de Diseño y Arquitectura](#decisiones-de-diseño-y-arquitectura)

## Casos de la prueba

| # | Caso | Dónde se resuelve | Cómo se verifica |
|---|---|---|---|
| 1 | Categorías base y `GET /categories` | `backend/seed.py` (idempotente: Trabajo, Personal, Urgente) | `tests/test_seed.py`, `tests/test_categories_api.py` |
| 2 | `POST /tasks` con validaciones | `schemas/task.py` + `services/task_service.py` | `tests/test_tasks_create_api.py`, carpeta `Errores` de Bruno |
| 3 | Tablero con filtro por estado | `TaskService` (HTTP), `TaskBoard`, `FilterBar` | `task.service.spec.ts`, `task.store.spec.ts`, `filter-bar.spec.ts` |
| 4 | Completar en un clic y eliminar con confirmación, sin F5 | `TaskCard`, `ConfirmDialog`, `TaskStore` | `task-card.spec.ts`, `task.store.spec.ts` |
| 5 | `GET /tasks/99999` → `404 {"detail":"Tarea no encontrada"}`, sin errores 500 | `core/error_handlers.py` | `tests/test_error_handling.py` |

Extras: edición de tareas, paginación `limit`/`offset`, filtro por categoría, migraciones con Alembic, Docker Compose, CI y [despliegue emulado en Google Cloud](docs/deploy-gcp.md).

## Inicio rápido con Docker

Requisito: Docker con Compose v2.

```bash
docker compose up --build
```

| Servicio | URL |
|---|---|
| Aplicación | http://localhost:8080 |
| API (Swagger) | http://localhost:8000/docs |

El contenedor del backend espera a PostgreSQL, aplica las migraciones y carga las categorías antes de arrancar. Para detenerlo y borrar los datos: `docker compose down --volumes`.

## Instalación local paso a paso

Requisitos: **Python 3.10+** y **Node.js 20.19+, 22.12+ o 24+** (los que soporta Angular 21). No hace falta instalar ninguna base de datos: por defecto se usa SQLite.

### 1. Backend (terminal 1)

```bash
cd backend
python -m venv .venv
```

Activar el entorno virtual:

```bash
# Windows (PowerShell)
.venv\Scripts\Activate.ps1
# Linux / macOS
source .venv/bin/activate
```

Instalar, crear el esquema, cargar las categorías y levantar la API:

```bash
pip install -r requirements-dev.txt
alembic upgrade head
python seed.py
uvicorn main:app --reload
```

La API queda en http://localhost:8000 y la documentación interactiva en http://localhost:8000/docs.

> `requirements.txt` tiene solo lo necesario para ejecutar; `requirements-dev.txt` agrega pytest y ruff. La configuración es opcional: los valores por defecto sirven para desarrollo, y `.env.example` muestra cómo apuntar a PostgreSQL o cambiar los orígenes de CORS.

### 2. Frontend (terminal 2)

```bash
cd frontend
npm install
npm start
```

Abrir http://localhost:4200. En desarrollo, el frontend llama directamente a `http://localhost:8000`.

## Tests

```bash
# Backend: 54 tests (API, servicio con repositorios en memoria, migraciones)
cd backend
pytest
ruff check . && ruff format --check .

# Frontend: 59 tests (componentes, store, servicios, integración con rutas)
cd frontend
npm test -- --watch=false
```

Los tests del backend usan SQLite en memoria, así que no tocan `flowtask.db`. El [pipeline de CI](.github/workflows/ci.yml) corre ambos (backend con Python 3.10 y 3.13), compila el frontend y ejecuta la colección Bruno contra el stack completo de Docker Compose.

## Colección Bruno

La carpeta [`bruno/`](bruno) es una colección de [Bruno](https://www.usebruno.com/) con 12 requests y 24 aserciones, agrupadas en `Categorias`, `Tareas` (flujo completo: crear → obtener → filtrar → paginar → completar → eliminar) y `Errores` (los 422 y 404 de la prueba). Los requests se encadenan: el id de la tarea creada se reutiliza en los siguientes.

| Entorno | Apunta a |
|---|---|
| `local` | http://localhost:8000 (instalación local) |
| `docker` | http://localhost:8080/api (a través de nginx) |
| `floci-gcp` | El servicio web desplegado en el emulador de GCP |

Abrir la carpeta desde la app de Bruno, o correrla desde la terminal con la API levantada:

```bash
cd bruno
npx @usebruno/cli@4.2.1 run --env local
```

## API

| Método | Ruta | Respuesta |
|---|---|---|
| `GET` | `/categories` | `200` lista de categorías |
| `GET` | `/tasks?status=&category_id=&limit=20&offset=0` | `200 {items, total, limit, offset}`, ordenado por fecha límite |
| `GET` | `/tasks/{id}` | `200` · `404 {"detail":"Tarea no encontrada"}` |
| `POST` | `/tasks` | `201` · `422` si el título está vacío, el estado no existe, la fecha es pasada o la categoría no existe |
| `PATCH` | `/tasks/{id}` | `200` (actualización parcial) · `404` · `422` |
| `DELETE` | `/tasks/{id}` | `204` · `404` |
| `GET` | `/health` | `200` (lo usan los healthchecks de Docker) |

Estados válidos: `Pendiente`, `En Progreso`, `Completada`. `limit` acepta de 1 a 100.

## Estructura del repositorio

```text
flowtask/
├── backend/
│   ├── app/
│   │   ├── core/            # configuración, excepciones de dominio y su traducción a HTTP
│   │   ├── models/          # tablas SQLAlchemy
│   │   ├── schemas/         # contratos Pydantic de entrada y salida
│   │   ├── repositories/    # acceso a datos (+ protocolos)
│   │   ├── services/        # reglas de negocio
│   │   ├── routers/         # endpoints
│   │   ├── database.py
│   │   └── dependencies.py  # inyección de dependencias de FastAPI
│   ├── alembic/             # migraciones
│   ├── tests/
│   ├── main.py
│   └── seed.py
├── frontend/src/app/
│   ├── core/                # modelos, servicios HTTP, interceptor, utilidades
│   ├── features/tasks/      # TaskBoard + TaskStore y componentes de presentación
│   └── shared/              # diálogo de confirmación, i18n, validadores
├── bruno/                   # colección de la API
├── deploy/gcp/              # despliegue emulado con floci-gcp
├── docs/                    # arquitectura y despliegue
└── docker-compose.yml
```

Más detalle, con diagramas de capas y del modelo de datos, en [`docs/architecture.md`](docs/architecture.md).

## Decisiones de Diseño y Arquitectura

**Arquitectura en capas con dependencias hacia adentro.** Los routers solo traducen HTTP; los servicios concentran las reglas y lanzan excepciones de dominio (`NotFoundError`, `InvalidReferenceError`) que un único módulo convierte en respuestas HTTP. Los servicios dependen de protocolos y no de los repositorios concretos, lo que permite probar las reglas con repositorios en memoria.

**SQLAlchemy 2.0 y Pydantic por separado, en lugar de SQLModel.** La prueba pide `models/` y `schemas/` como capas distintas, y separarlos permite que el contrato de la API (por ejemplo, `TaskUpdate` con todos los campos opcionales) evolucione sin tocar la tabla.

**`422` para una categoría inexistente.** La prueba admite `404` o `422`. Se eligió `422` porque el recurso pedido (`/tasks`) existe: lo que falla es un dato del cuerpo. `404` queda reservado para "la tarea de la URL no existe", y así el frontend puede distinguir ambos casos.

**Validaciones en la API y en la base.** Pydantic valida título, estado y que la fecha no sea pasada. Además, el estado se guarda como `VARCHAR` con `CHECK` y la categoría es una FK con `ON DELETE RESTRICT`: la base protege la integridad aunque alguien escriba sin pasar por la API. Se evitó un `ENUM` nativo para que el mismo esquema funcione en SQLite y PostgreSQL.

**Una sola variable para elegir la base de datos.** `DATABASE_URL` decide entre SQLite (cero instalación para quien revise el proyecto) y PostgreSQL (Docker y GCP). El esquema lo crean las migraciones de Alembic, y un test comprueba que la migración y los modelos no se desincronicen.

**`PATCH` con actualización parcial.** Solo se modifican los campos enviados; enviar `null` en un campo obligatorio devuelve `422`. El botón "Completar" envía únicamente `{"status": "Completada"}`, y la edición envía solo lo que cambió: así una tarea vencida puede corregirse sin reenviar su fecha, que la API rechazaría.

**Paginación con total.** `GET /tasks` devuelve `{items, total, limit, offset}` para que el paginador muestre la cantidad real de páginas. Las tareas se ordenan por fecha límite, que es la información más útil del tablero, y se cargan con su categoría en la misma consulta (`joinedload`) para evitar el problema N+1.

**Frontend con patrón contenedor/presentacional y signals.** `TaskBoard` es el único componente que conoce el estado (`TaskStore`) y los servicios; el resto recibe datos y emite eventos. El estado usa signals, y `switchMap` descarta respuestas viejas si el usuario cambia de filtro rápido. El cambio de estado es optimista y se revierte si la API falla. Un interceptor traduce cualquier error HTTP a un mensaje comprensible.

**Angular 21 LTS en lugar de 22.** El CLI de Angular 22.2 exige Node 24.15 o superior; la 21 es LTS, funciona con Node 20, 22 y 24, y reduce las fricciones para quien clone el repositorio.

**Fechas sin zona horaria.** La fecha límite viaja como `YYYY-MM-DD` y el frontend la interpreta en hora local, porque `new Date('2026-10-23')` se interpreta en UTC y en Lima mostraría el día anterior. El selector acepta fechas escritas como `dd/mm/aaaa`.

**Un solo origen en producción.** En Docker, nginx sirve el frontend y reenvía `/api` al backend, así el navegador no necesita CORS. En desarrollo, CORS está limitado a los orígenes y métodos que la aplicación usa realmente.

**Las mismas imágenes en todos los entornos.** Docker Compose y el despliegue emulado en Cloud Run usan las mismas imágenes; solo cambian las variables de entorno. El detalle y las diferencias con GCP real están en [`docs/deploy-gcp.md`](docs/deploy-gcp.md).

**Fuera de alcance.** Autenticación y usuarios, y el ABM de categorías: la prueba no los pide y las categorías base cubren los casos.
