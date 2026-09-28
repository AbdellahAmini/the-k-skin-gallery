# Architecture

## Request and rendering path

The browser runs a React 19 storefront with React Router 7. Internal links stay in the client router, so the shared Gallery shell remains mounted during navigation. `npm run build` also requests the public catalog from FastAPI and pre-renders the homepage, product details, collections, directory pages, and customer routes into route-specific HTML. The first response contains page content and metadata; route chunks are split and preloaded for the current route; `src/main.jsx` hydrates that markup and refreshes current catalog and account state from the API. `npm run preview` resolves nested pre-rendered files and proxies `/api` for local production review.

The build pre-renders every active product page and its Product JSON-LD. When `PUBLIC_SITE_URL` is configured it also emits canonical links, `robots.txt`, and `sitemap.xml`. These are build snapshots: price, stock, and product content can change after the build, so hydration and checkout use the live API. Rebuild after important catalog changes for current crawlable metadata.

## Catalog source

`input/products_catalog.json` is an import source, not the storefront's runtime catalog. `backend/app/catalog.py` imports source rows and image references into SQLAlchemy tables. FastAPI serves public product, brand, category, city, and site-setting data. Retail price and stock are public; cost and wholesale values are restricted to admin endpoints.

SQLite is the local preview default. Production requires PostgreSQL through `DATABASE_URL`; the API rejects a production SQLite URL. The initial Alembic migration creates the complete schema. Apply `python -m alembic upgrade head` from `backend/` before starting a production API. Local SQLite can still bootstrap itself for a quick preview.

The product query service owns brand, product type, verified skin type and concern, usage, availability, price, promotion and new arrival filters, contextual facet counts, pagination and sorting. Merchants curate product mappings, routines, bundles and typed editorial sections in admin. Packs consume inventory from their component products; skin and concern mappings remain empty until source verification.

## Cart, checkout, and orders

Guest carts and wishlists are stored in browser local storage after hydration. Authenticated customer product, bundle and wishlist snapshots are stored in `cart_items`, `bundle_cart_items` and `wishlist_items`; guest state is merged after login. Checkout uses a dedicated `/checkout` route. The browser submits product or bundle IDs and quantities, while the API recalculates price, discounts, city shipping, component stock, and total from database state.

Order creation is transactional: it validates the city and stock, snapshots line details and totals, decrements inventory, writes status history and an inventory reservation, and inserts a notification outbox row. A client request ID makes retries idempotent. The Telegram worker polls unsent outbox rows when its credentials are configured. COD orders start in `a_confirmer`; phone confirmation is still an operations step.

## Security boundary

Passwords use Argon2 and sessions use signed JWTs in HTTP-only cookies. Admin endpoints require the admin role. The API validates catalog IDs, quantities, phone numbers, addresses, email shape, promotion codes, current price, city, and stock. Production must use HTTPS, a unique `JWT_SECRET`, a restrictive `CORS_ORIGINS` list, database backups, and an API host with rate limiting and request monitoring. A distributed rate limiter is not yet implemented.

## Hosting boundary

The current Sites worker serves built HTML/assets and app-shell fallback only. It does not execute the FastAPI API, connect to PostgreSQL, or run the Telegram worker. Production needs those backend processes deployed separately and `/api` routed to FastAPI. `dist/client/` contains pre-rendered files; `dist/server/index.js` remains the existing Sites static worker package entry.
