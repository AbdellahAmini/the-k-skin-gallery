# The K-Skin Gallery — Catalog Research Database

Generated: 2026-10-02
Schema version: 1.0

## Scope
This research database contains **265 selected facial-skincare products across 9 priority Korean brands**.

Brand coverage:
- ANUA: 36 products
- COSRX: 33 products
- SKIN1004: 34 products
- Beauty of Joseon: 24 products
- Medicube: 30 products
- Dr. Althea: 25 products
- AXIS-Y: 28 products
- SOME BY MI: 30 products
- Arencia: 25 products

## Important publication rules

1. **`price_mad` is intentionally blank.**
   Official USD prices are research/reference prices only and are not proposed Moroccan retail prices.
2. **`stock` is intentionally blank** so an upsert can preserve stock already present in the store.
   For a newly created row, use `initial_stock_if_new = 0`.
3. New researched rows are intentionally `DRAFT`.
   The intended state after commercial price/media checks is recorded in:
   `desired_visibility = PUBLISHED_OUT_OF_STOCK_WHEN_PRICED`.
4. Out-of-stock products should remain published/indexable after pricing and should show
   **Rupture de stock** + **Me prévenir du réassort**.
5. **Official facts and Gallery curation are separated.**
   - Official facts: name, official summary where available, size where available, source URL,
     INCI/how-to when individually verified.
   - Gallery curation: product type, skin type, concern, key ingredients, routine step, AM/PM,
     French short merchandising text.
6. Curation fields are conservative but still require merchant review before presenting them as factual claims.

## Verification status

- VERIFIED: 4
- PARTIAL: 261
- UNVERIFIED: 0
- NEEDS_REVIEW: 0

`VERIFIED` means an individual official product page was used for detailed fields.
`PARTIAL` means the product is confirmed from an official current catalog/collection, but the individual PDP still needs
full official INCI/how-to/size/media enrichment before the storefront PDP should be considered complete.

## Files

- `k_skin_gallery_catalog_master.xlsx` — review/editing workbook
- `k_skin_gallery_products_import.csv` — flat importer-friendly file
- `k_skin_gallery_products_import.json` — JSON representation
- `k_skin_gallery_catalog.sqlite` — normalized relational research DB

## Recommended importer behavior

- Match by `external_id`, then SKU if populated.
- On update, blank commercial fields MUST NOT overwrite existing `price_mad`, stock, SKU/barcode, or media.
- New products default to stock 0.
- Do not publish a new row unless at minimum:
  - `price_mad` is set
  - at least one approved product image exists
  - product classification is reviewed
  - PDP content status is acceptable for the intended page
- Existing store products may retain their current publication/stock/price state.

## Product-type distribution
- Contour des yeux: 9
- Crèmes hydratantes: 49
- Exfoliants: 4
- Huiles & Baumes démaquillants: 10
- Masques: 21
- Nettoyants: 28
- Protection solaire: 14
- Soins ciblés: 7
- Sérums & Ampoules: 71
- Toners & Essences: 52

## Source policy
Every researched product row includes an `official_source_url`. Sources are official brand/manufacturer websites.
Do not replace official source data with random retailer descriptions.

## Next enrichment pass
The `Enrichment Queue` sheet identifies products that are catalog-confirmed but still need individual official PDP
verification (full INCI, official usage instructions, exact size/variant mapping, and approved media asset ingestion).
