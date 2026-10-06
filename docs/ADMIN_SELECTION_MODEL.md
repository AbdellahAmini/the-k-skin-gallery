# Admin V2 — Selection model

## Selection scope

The product/stock selection applies only to the current server query: search and all active product filters. The API reconstructs this filter predicate from request fields at mutation time. It does not trust a client-supplied total or an array of all IDs.

Changing search or a filter resets selection. Changing sort keeps selection because it changes row order, not membership. Page-level checkbox controls the currently loaded rows; individual checkboxes control one product.

## Request forms

Explicit selection:

```json
{
  "selection": {
    "mode": "explicit",
    "ids": [12, 18]
  }
}
```

All matching, with exceptions:

```json
{
  "selection": {
    "mode": "all_matching",
    "filters": { "brand_slug": "anua", "publication_status": "draft" },
    "excluded_ids": [18]
  }
}
```

The response reports server-computed `matched`, `updated`, `skipped`, and `errors`. Legacy `product_ids` requests remain accepted for compatibility.

## Supported product actions

- Set publication state, subject to the same per-product publication blockers as single-record editing.
- Set featured state.
- Set low-stock threshold.
- Assign a product type.

Blocked publication candidates are skipped with reasons; the API does not bypass price, identity, media, or content checks. Stock-only selection exposes only the threshold action. There is no delete operation.

## Confirmation and commerce boundary

The UI displays the current selection count and selected query scope before an action. Order confirmation, cancellation, shipping, and other COD transitions remain single-order actions with a required note; they are not part of product bulk selection.

