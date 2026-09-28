# Deployment notes

## Build prerequisites

1. Provision PostgreSQL, set `APP_ENV=production` and `DATABASE_URL`, then run `python -m alembic upgrade head` from `backend/`. Import the catalog once with `python -m app.catalog` while the source catalog and images are available. Create the first administrator with `python -m app.create_admin EMAIL --first-name FIRST --last-name LAST`; it prompts for a password. Use verified inventory rather than sample quantities.
2. Make the API reachable to the build process; set `GALLERY_API_ORIGIN` to its origin.
3. Set `PUBLIC_SITE_URL` to the canonical HTTPS storefront origin.
4. Run `npm run build`; it fetches live public catalog data, pre-renders pages, and prepares the existing Sites asset package.
5. Deploy `dist/client/` as the static storefront.
6. Configure clean product/category routes to serve their matching nested `index.html` before the generic app-shell fallback. Deploy FastAPI with PostgreSQL separately and route storefront `/api/*` requests to it through the CDN, edge worker, or reverse proxy.
7. Run `python -m app.worker` as a separate process when Telegram order notifications are configured.

## Required production settings

- `APP_ENV=production`
- `DATABASE_URL=postgresql+psycopg://...`
- `AUTO_IMPORT_CATALOG=0` after the initial catalog import; this avoids coupling every restart to the source JSON and image folder
- `JWT_SECRET` set to a unique random secret of at least 32 characters
- `GALLERY_DEMO_STOCK=0` until real stock counts are imported
- `CORS_ORIGINS` limited to the actual storefront origin(s) when API and storefront are cross-origin
- `GALLERY_API_ORIGIN` available to the pre-render build process
- `PUBLIC_SITE_URL` set to the canonical storefront origin
- Optional `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `ADMIN_PUBLIC_URL`

Keep database credentials and Telegram/JWT secrets on the backend. Never pass them through Vite `VITE_*` variables or rendered storefront data.

## Caching and media

The static build is suitable for CDN caching. Fingerprinted Vite JS/CSS assets can be cached for a long duration; pre-rendered product and collection HTML should be revalidated when product price, stock, or description changes. The hero uses eager loading and high fetch priority; product images lazy-load below the fold. Product image conversion to responsive AVIF/WebP derivatives and object-storage delivery remain a deployment optimization task.

## Launch blockers

- Sites hosting in this repository is a static asset worker and does not run the FastAPI service. API hosting and `/api` routing must be configured separately before real customer orders can be accepted.
- Add rate limiting, CSRF review for the chosen origin/cookie topology, uptime/error monitoring, and database backup/restore checks before public launch.
- Replace demo catalog stock with verified inventory. The source product prices and product details also need business verification before launch.
