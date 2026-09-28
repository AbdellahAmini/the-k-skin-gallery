# Testing and QA

## Automated checks

- `backend/.venv/Scripts/python.exe -m pytest -q` runs isolated SQLite integration tests for quote calculation, server-owned prices, COD order creation, Moroccan phone normalization, inventory decrement, reservation/outbox creation, idempotent retries, insufficient stock, normalized search, contextual facets, and pack component accounting.
- `npm run test:sites` checks static asset fallback behavior and required Sites packaging outputs.
- `npm run build` compiles route chunks and pre-renders pages against a reachable API. Product and collection HTML should contain visible content before JavaScript runs; product pages should contain Product JSON-LD.
- `npm run test:e2e` runs Playwright navigation, search, product/pack, responsive menu/filter, filter URL/back/forward/reload, cart, city quote, and COD receipt flows. It creates an order, so use a disposable local database.
- `npx playwright test tests/e2e/header.spec.mjs` checks the compact header at 375, 390, 430, 768, 1024, 1280, 1440, and 1600px; sticky compression without content movement; desktop and mobile navigation/search/cart; marquee hover; and reduced-motion behavior. It does not create orders.

For a disposable browser test, start Uvicorn with `DATABASE_URL=sqlite:///./gallery-e2e.db` on port `18000`, then run the preview with `GALLERY_API_ORIGIN=http://127.0.0.1:18000` and `PORT=14173`. Set `GALLERY_E2E_URL=http://127.0.0.1:14173` for the test command. The browser suite was run against this isolated setup at 375, 390, 430, 768, 1024, 1280, and 1440px widths.

## Manual browser flow

Verify desktop and a 390px mobile viewport:

1. Open the homepage and confirm the hero image, trust cues, product cards, and route navigation render before hydration.
2. Search a brand/product; open a product page from a result.
3. Add a product, change quantity, close/reopen the cart, and confirm cart state survives refresh.
4. Use “Continuer ma commande” and confirm navigation to `/checkout`.
5. Change delivery city and confirm the server quote updates shipping; submit valid COD details and check the receipt page.
6. Check stock in the admin order list and confirm the new order is visible.

The checkout tests use an isolated temporary database. A sample order created during local preview/testing can remain in the developer SQLite file; do not treat local demo data as production orders or stock counts.

## Current limits

The browser suite covers critical paths, but production payment, delivery and notification services still need environment-specific acceptance checks. The test client reports a Starlette/httpx deprecation warning; it does not fail the tests.
