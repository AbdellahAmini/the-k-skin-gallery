# The K-Skin Gallery

React storefront with URL-based navigation and build-time pre-rendered pages, backed by a FastAPI catalog and COD order API.

## Run locally

Use two terminals from this folder.

```powershell
# Terminal 1 — API and local SQLite catalog
Set-Location backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

For a first setup, create the virtual environment and install backend requirements from `backend/` before starting Uvicorn:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

```powershell
# Terminal 2 — Vite storefront
npm run dev -- --host 0.0.0.0
```

Open `http://localhost:5173`. The frontend proxies `/api` to the local FastAPI process. Apply `python -m alembic upgrade head` from `backend/` before starting the API. Catalog import is explicit; startup does not create products or sample stock. See [Product import](docs/PRODUCT_IMPORT.md) for CSV/JSON validation, simulation and safe updates.

To create the first administrator after the API has initialized its database, run from `backend/`:

```powershell
.\.venv\Scripts\python.exe -m app.create_admin owner@example.ma --first-name Gallery --last-name Owner
```

The command prompts for the password without placing it in shell history. Sign in at `/connexion`, then open `/admin`.

## Build and verify

The build requires the API to be reachable so it can render current catalog, brand, category, and city data into the storefront HTML.

```powershell
npm run build
npm run test:sites
Set-Location backend
.\.venv\Scripts\python.exe -m pytest -q
```

For a production-style local review, run `npm run preview` in another terminal after the build. It serves the pre-rendered route HTML and proxies `/api` to FastAPI on port 8000.

`PUBLIC_SITE_URL` is optional during development. Set it to the canonical HTTPS site origin for a deployment build; the build then adds absolute canonical URLs, `sitemap.xml`, and `robots.txt`. The current catalog builds 163 pre-rendered storefront routes from 94 active products.

To review against local PostgreSQL, run `docker compose up -d postgres`, set `DATABASE_URL=postgresql+psycopg://gallery:gallery_local_only@127.0.0.1:5432/gallery` in the backend terminal, then run `python -m alembic upgrade head` before starting Uvicorn. The Compose password is for local use only.

## Architecture and scope

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) describes rendering, catalog import, carts, orders, and admin boundaries.
- [`docs/API.md`](docs/API.md) lists the current API surface.
- [`docs/TESTING.md`](docs/TESTING.md) describes the checkout tests and browser QA.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) records environment and hosting requirements.
- [`docs/REBUILD_PLAN.md`](docs/REBUILD_PLAN.md) tracks what has been rebuilt and remaining work.
- [`docs/INFORMATION_ARCHITECTURE_V2.md`](docs/INFORMATION_ARCHITECTURE_V2.md) records the new navigation, taxonomies, routes, and filter rules.

The generated Sites worker currently serves static assets and falls back to the app shell. It does not host or proxy FastAPI. A production launch therefore needs the API and PostgreSQL on a separate backend host, with `/api` routed to that service by the edge or reverse proxy.
