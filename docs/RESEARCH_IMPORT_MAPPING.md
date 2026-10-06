# Mapping du catalogue de recherche

Source : `k_skin_gallery_products_import.csv`, vérifiée avec le JSON, le classeur de recherche et la base de recherche SQLite. La prévisualisation `catalog-merge-preview.csv` contrôle l’identité avant l’import.

## Identité et taxonomie

| Champ recherche | Champ destination | Règle |
|---|---|---|
| `external_id` | `product_research.external_id` | Clé idempotente unique; jamais exposée au storefront. |
| `brand` | `products.brand_id` | Réutiliser la marque canonique par slug; ne pas créer de doublon de casse. |
| `official_name` | `products.official_name` | Remplir uniquement si le champ existant est vide. |
| `display_name_fr` | `products.display_name_fr`, `products.name` à la création | Valeur existante préservée; nom officiel utilisé si le nom d’affichage est vide. |
| `display_size` | `products.size`, `size_value`, `size_unit` | Taille affichée conservée; valeur/unité extraites lorsqu’elles sont explicites. |
| `product_type` | `categories` / `products.category_id` | Réutiliser les types canoniques; alias `Crèmes hydratantes` → `Crèmes`, `Huiles & Baumes démaquillants` → `Huiles & Baumes`. |
| `product_subtype` | `product_subtypes` / `products.product_subtype_id` | Réutiliser le libellé par type, sinon créer un sous-type lié au bon type. |
| `skin_types` | `product_skin_types` | Les libellés reçoivent le préfixe canonique `Peau`; relations de curation non validées. |
| `concerns` | `product_concerns` | Réutiliser les besoins normalisés; `Hydratation` reste distinct de `Déshydratation`. |
| `key_ingredients` | `product_ingredients` | Vocabulaires normalisés; associations masquées publiquement tant que non validées. |
| `routine_step`, `usage_time` | `product_metadata` | Valeurs proposées de curation; absentes des réponses publiques avant validation de classification. |

## Provenance et contenu

| Champ recherche | Champ destination | Règle |
|---|---|---|
| `official_source_name`, `official_source_url`, `source_language` | Product + ProductMetadata | Conserver la source et sa portée; compléter un champ existant uniquement s’il est vide. |
| `source_scope` | `product_research.source_scope` | Distinguer une fiche produit individuelle d’une page de collection. |
| `verification_status` | `products.verification_status` | Préserver `VERIFIED`, `PARTIAL`, `UNVERIFIED` et `NEEDS_REVIEW`; ne jamais promouvoir `PARTIAL`. |
| `verified_at` | `product_metadata.verified_at` | Importer si fourni et si la date n’existe pas déjà. |
| `store_short_description_fr` | `products.short_description` | Remplir les blancs seulement; aucun remplacement d’un texte marchand existant. |
| `official_summary_en` | `manufacturer_description` | Importer uniquement depuis une fiche individuelle `VERIFIED`, dans un champ vide. |
| `benefits_fr`, `usage_instructions_fr`, `full_inci`, `warnings_fr` | Champs produit correspondants | Importer uniquement depuis une source individuelle `VERIFIED`, dans des champs vides. |
| `seo_title`, `seo_description` | Champs SEO produit | Compléter uniquement les champs vides. |
| ligne complète source | `product_research.raw_payload_json` | Conserver l’audit et les champs non mappés dans la table privée d’administration. |

## Prix, stock et visibilité

| Champ recherche | Champ destination | Règle |
|---|---|---|
| `price_mad` | `products.price_dh` | Champ vide dans le lot; prix existant conservé pour les correspondances. |
| `official_price`, `official_price_currency`, `official_price_note` | `product_research.official_reference_*` | Référence privée seulement; aucune conversion USD/KRW vers MAD. |
| tarif marchand local exact | `products.price_dh` et `product_research.price_source` | Utiliser uniquement `retail_sell_price` si identité exacte et unique. Aucun tarif exact ne concerne les nouvelles fiches. |
| prix local absent | `products.price_dh = 0` et `price_source = USER_PLACEHOLDER_MISSING_PRICE` | Placeholder demandé par le marchand; ne signifie pas « gratuit ». |
| `initial_stock_if_new` | `products.stock` | Stock initial nul; les stocks existants restent inchangés. |
| `publication_status`, `commercial_ready` | Product + `product_research` | Nouvelles fiches sans prix, média ou contenu suffisant restent en brouillon et non achetables. |
| `media_status`, `image_source_url` | `product_research.media_status` | Aucune image source importable; aucun hotlink ou scraping. Les images des produits existants sont conservées. |
| `selection_basis`, `curation_basis`, `research_notes` | `product_research` | Provenance et notes conservées à usage admin. |

Les valeurs officielles de prix et les données de recherche sont exclues du sérialiseur public. L’API et l’admin empêchent la publication d’un prix nul; une fiche de recherche doit aussi avoir un média local approuvé et un contenu produit suffisant.

## Rapprochement

Ordre appliqué : SKU exact lorsque disponible, puis marque canonique + nom officiel normalisé (accents, casse, ponctuation, espace et suffixe de format). Les similarités floues ne sont jamais fusionnées. Les candidats proches, dont les noms SKIN1004 pouvant omettre le préfixe de gamme « Madagascar », sont signalés `MANUAL_REVIEW` dans la prévisualisation et l’audit des doublons. Une fiche déjà créée avec ce conflit reste bloquée avant publication.

Les champs commerciaux, de stock, de publication, les images, commandes et réservations des produits existants sont protégés par comparaison à `docs/merge-backups/gallery-before-research-merge-20261002-165222.db`.
