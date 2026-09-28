# Rebuild plan

## Current state

The storefront is a React 19 + React Router 7 app with page modules split by route, a FastAPI/SQLAlchemy API, and a local SQLite development database. The surrounding workspace has 96 catalog source rows; 94 active products are exposed after the restricted-category import rule. Orders, inventory reservations, order history, and notification jobs persist in the database. The PDF catalogue generator is separate and locked.

The production build fetches the active catalog and pre-renders 163 route pages, including product, brand, type, skin, concern, routine and pack routes, into `dist/client`. Product pages receive metadata and Product JSON-LD. Hydration refreshes public data and preserves client-side navigation. Production API hosting, rate limiting, verified taxonomy mapping, and live inventory verification remain required before launch.

## Keep

- Gallery logo, cream/blush/ink palette, editorial typography, generated hero photograph.
- Product card proportions, desktop header direction, mobile drawer restraint, cart drawer pattern, live search suggestions.
- Existing Sites build/worker files untouched.
- Dedicated `/checkout` route and the cart drawer's route navigation.

## Refactor

- Continue splitting route pages and keep the shell, shared components, API client, and cart/auth state reusable.
- Convert main navigation, search, product cards, account, wishlist, and footer to URL routes.
- Keep product pricing, stock, shipping, promotion, and order calculation on FastAPI.
- Continue checking responsive layouts and image fallback handling.

## Remove

- Five-product hardcoded array, scroll-to-results fake navigation, toast-only actions, modal checkout, fake order success.

## Implemented

- FastAPI + SQLAlchemy catalog and order data with SQLite local configuration and PostgreSQL URL support.
- Product/brand/category/city APIs, city shipping quotes, promotion calculations, persisted COD orders, inventory reservations, notification outbox, and admin order workflows.
- Dedicated `/checkout`, order receipt routes, account/admin routes, persisted guest local-storage cart/wishlist, and responsive collection/PDP/search pages.
- React Router URL navigation, route chunks with intent prefetch on desktop hover, and pre-rendered route HTML/metadata.
- Local run/build documentation and isolated checkout integration tests.
- Six-item navigation, four discovery paths, independent skin/concern taxonomies, shared URL-driven collection filters with contextual counts, curated routines, and sellable packs with component inventory.
- Admin taxonomy, product metadata, routine, pack, typed content, and advice editors; versioned initial Alembic schema; PostgreSQL-only production guard.
- Playwright coverage for browsing, responsive filters/navigation, cart, shipping quote, and COD receipt on an isolated database.

## Remaining launch work

- Deploy FastAPI and PostgreSQL separately and route `/api` to the service; the existing Sites worker is static-only.
- Verify actual stock, product descriptions, prices, and claim language with the business and official sources.
- Curate product-to-skin and product-to-concern mappings from official sources; unverified mappings deliberately remain empty.
- Add distributed API rate limiting, review CSRF for the production cookie/origin topology, backup/restore drills, uptime and error monitoring.
- Produce responsive AVIF/WebP product derivatives and object-storage/CDN delivery.
- Finish operational admin screens and account features whose data/actions are not yet backed by complete workflows.

## Implementation order

1. Import the supplied catalog and serve product data/images. Done for the provided source rows.
2. Introduce URL routes while preserving the Gallery identity. Done.
3. Persist cart/wishlist state and build product, collection, search, and checkout pages. Done for guest local storage and authenticated server state.
4. Validate and create orders through the backend; calculate city shipping and stock; queue notifications. Implemented and covered by API integration tests.
5. Add admin order handling/customer state, promotions, account pages, route chunks, and pre-rendered metadata. Core prototype flows exist; follow-on launch controls remain.
6. Run backend, Sites packaging, and browser QA; document remaining gaps. Local checks are complete; production hosting/security/inventory verification remains.
