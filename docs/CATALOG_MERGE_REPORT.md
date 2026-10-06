# Rapport de fusion du catalogue K-Skin Gallery

Exécuté le 2026-10-02T18:55:12+00:00. Base examinée : SQLite locale configurée par backend/app/database.py (`backend/gallery.db` dans la configuration locale). Aucun accès à une base PostgreSQL externe n’était configuré.

## Sauvegarde et contrôles avant fusion

- Sauvegarde : `docs/merge-backups/gallery-before-research-merge-20261002-165222.db`
- SHA-256 : `b4d61f635e8a9a6b48f73efe95aca3942b2991889be9d504bc3efb780ff045fd`
- Sources concordantes : 265 identifiants dans le CSV, le JSON, le classeur de recherche et la base de recherche SQLite.
- Classeur marchand et `input/products_catalog.json` : 27 noms exacts avec prix de détail, tous déjà dans la base. Aucun tarif exact supplémentaire pour une nouvelle fiche; aucun coût fournisseur n’a été repris comme prix de vente.
- Prix MAD recherche : 0/265; image source exploitable : 0/265. Les prix officiels USD/KRW sont conservés uniquement dans `product_research` comme références privées.

| Mesure | Avant | Après |
|---|---:|---:|
| products | 96 | 323 |
| brands | 18 | 18 |
| orders | 4 | 4 |
| order_items | 2 | 2 |
| customers | 0 | 0 |
| users | 0 | 0 |
| product_images | 96 | 96 |
| inventory_reservations | 6 | 6 |
| stock_alerts | 0 | 0 |
| published | 94 | 94 |
| draft | 0 | 227 |
| archived | 2 | 2 |
| in_stock | 96 | 96 |
| out_of_stock | 0 | 227 |

## Résultat de la fusion

- Fiches existantes enrichies sans remplacer leurs prix, stocks, images ou statut : 27
- Nouvelles fiches créées : 227
- Fiches nouvelles conservées en brouillon et mises en attente de résolution d’identité après contrôle d’alias : 1
- Nouvelles fiches publiées en rupture : 0
- Nouveautés en brouillon à prix zéro : 227
- Produits sans prix MAD confirmé (file d’attente) : 227
- Produits sans média local approuvé (file d’attente) : 227
- Identités suspendues pour vérification manuelle : 12
- Groupes signalés dans l’audit de doublons (sans suppression) : 14
- Enregistrements déjà importés lors d’une relance : 254

Le prix `0` est un marqueur de prix à fournir, pas un prix gratuit : ces lignes restent `draft`, stock `0`, non achetables et absentes de l’API publique. L’admin ne peut les publier qu’après saisie d’un prix strictement positif, approbation d’un média local et présence d’un contenu produit suffisant.

## Intégrité des données opérationnelles

Les hachages avant/après des commandes, snapshots de lignes de commande, réservations d’inventaire, images existantes et champs commerciaux des 96 produits déjà présents ont été comparés à la sauvegarde :

| Données protégées | Contrôle |
|---|---|
| orders | INCHANGÉ |
| order_items | INCHANGÉ |
| inventory_reservations | INCHANGÉ |
| product_images | INCHANGÉ |
| existing_commercial_fields | INCHANGÉ |

## Vérification par état

### Publication

| État | Produits |
|---|---:|
| archived | 2 |
| draft | 227 |
| published | 94 |

### Vérification produit

| Statut | Produits |
|---|---:|
| PARTIAL | 250 |
| UNVERIFIED | 69 |
| VERIFIED | 4 |

### Marques

| Marque | Produits |
|---|---:|
| AXIS-Y | 26 |
| Acretin | 1 |
| Anua | 38 |
| Arencia | 25 |
| Beauty of Joseon | 29 |
| Biodance | 5 |
| COSRX | 34 |
| Celimax | 1 |
| Dr. Althea | 26 |
| Dr.Melaxin | 2 |
| Mary&May | 1 |
| Medicube | 36 |
| SKIN1004 | 58 |
| SOME BY MI | 35 |
| Shiseido Fino | 1 |
| Skinoren | 1 |
| got2b | 1 |
| numbuzin | 3 |

### Types de soin

| Type | Produits |
|---|---:|
| Coffrets & Autres | 9 |
| Contour des yeux | 12 |
| Crèmes | 55 |
| Exfoliants | 6 |
| Huiles & Baumes | 12 |
| Masques | 31 |
| Nettoyants | 33 |
| Protection solaire | 27 |
| Soins ciblés | 6 |
| Sérums & Ampoules | 78 |
| Toners & Essences | 54 |

## Tests et parcours navigateur

- Tests API/backend : 17 réussis (`pytest -q`), un avertissement de dépréciation Starlette/httpx.
- Playwright en lecture seule : 13 réussis, 2 échecs, 4 scénarios catalogue ignorés faute de base QA isolée. Le test du tiroir mobile expire après sa réouverture immédiate suivant une navigation; une reproduction navigateur confirme que le tiroir se rouvre et contient `Soins`, ce qui indique une course de synchronisation dans le test à investiguer. Le test du lien ANUA ne stabilise pas la cible pendant le marquee animé; la navigation demeure présente. Un snapshot mobile précédent gardait l’écran de chargement de `/soins`, mais une reproduction directe affiche `Les soins` en moins de 500 ms. Le checkout COD a été exclu de la seconde passe pour éviter d’écrire dans la base active.
- Lors du premier passage, le scénario E2E COD existant a créé une commande de test; la commande, son snapshot bundle, son historique, son outbox et ses réservations ont été supprimés, et les stocks des deux produits ont été restaurés depuis la sauvegarde. Les quatre commandes originales et leurs snapshots ont été revalidés inchangés.

## Fichiers générés

- `docs/catalog-merge-preview.csv`
- `docs/catalog-duplicate-report.csv`
- `docs/products-needing-price.csv`
- `docs/products-needing-media.csv`
- `docs/RESEARCH_IMPORT_MAPPING.md`

Les relations de curation peau/besoins/ingrédients/routine sont conservées en brouillon et cachées du storefront tant que `classification_verified` n’est pas vrai. Les commandes COD, leur historique et les avis ne sont pas modifiés.
