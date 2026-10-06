# Schéma produit

Les anciennes colonnes restent compatibles avec les commandes existantes. Les migrations sont additives. Les montants sont des entiers MAD ; le prix payé est figé dans la commande.

| Domaine | Champs / stockage |
|---|---|
| Identité | `id`, `slug` unique, `sku` unique, `barcode` unique nullable, `brand_id`, `official_name`, `display_name_fr`, ancien `name` |
| Format | `size` affiché, `size_value` décimal, `size_unit` |
| Classification | `category_id` (type de soin), `product_subtype_id`, relations `skin_types`, `concerns`, `ingredients` |
| Curation | `classification_verified`, `classification_verified_at`, métadonnées `usage_time` (`am`, `pm`, `both`), `routine_step`, `search_aliases` |
| Commerce | `price_dh`, `compare_at_dh`, `cost_dh` et `wholesale_dh` privés |
| Inventaire | `stock`, `low_stock_threshold`, `stock_is_sample` ; état calculé `in_stock`, `low_stock`, `out_of_stock` |
| Publication | `publication_status` : `draft`, `published`, `archived` ; `active` conservé comme miroir |
| Mise en avant | `featured`, `new_arrival`, date `new_until` dans ProductMetadata |
| Français | `short_description`, `description`, `benefits_fr`, `usage_instructions_fr`, `warnings_fr` |
| Fabricant | `manufacturer_description`, `manufacturer_benefits`, `usage_instructions`, `inci` |
| Provenance | `official_source_url`, `source_language`, `verification_status`, métadonnées `official_source_name`, `verified_at` |
| SEO | `seo_title`, `seo_description`, `slug` ; produits publiés en rupture conservés dans le rendu et sitemap |
| Médias | ancien `image_url` principal ; ProductImage : URL stockée, source URL, alt, position, principal, created_at |
| Dates | `created_at`, `updated_at` |

Brand : nom, slug, logo, description_fr, official_website, active, featured_homepage, homepage_order, seo_title, seo_description. ProductSubtype référence un type de soin. SkinType, Concern et Ingredient restent des vocabulaires séparés : créer une valeur ne l’associe pas automatiquement à un produit.

Les relations peau/besoins/ingrédients restent visibles dans l’admin avant validation ; elles sont exclues des filtres et des informations publiques tant que `classification_verified` est faux. Cette validation de curation est distincte de la vérification de la fiche fabricant.

L’API publique sérialise explicitement les champs autorisés. Elle ne retourne jamais `cost_dh` ni `wholesale_dh`. Le stock zéro ne modifie pas la publication.
