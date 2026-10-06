# Import CSV / JSON

Exécuter depuis `backend` après `python -m alembic upgrade head`. Installer `requirements.txt` dans l’environnement Python utilisé par l’API.

```powershell
python -m app.scripts.import_products ../docs/product-import-template.csv --dry-run
python -m app.scripts.import_products ../docs/product-pilot.csv --dry-run --create-brands --create-types
python -m app.scripts.import_products ../docs/product-pilot.csv --create-brands --create-types
```

CSV UTF-8, séparateur virgule, première ligne contenant les colonnes. JSON : tableau d’objets ou `{ "products": [...] }`. Relations : listes JSON ou valeurs séparées par `;` dans le CSV.

Champs requis : `brand`, `official_name` (ancien `name` accepté), `product_type` (ancien `category` accepté), `price_dh` pour une création. SKU facultatif : un identifiant déterministe est généré. Les marques et types doivent exister, sauf création expressément demandée par les options ci-dessus. `--create-taxonomies` autorise la création explicite des vocabulaires peau/besoins/ingrédients ; les sous-types se créent dans l’admin et doivent appartenir au type fourni.

Un prix `0` est accepté comme **placeholder marchand** uniquement sur une fiche `DRAFT` avec stock `0`. Il ne signifie pas que le produit est gratuit. Les fiches `PUBLISHED` exigent un prix MAD strictement positif. Le backend les exclut du storefront, du panier, du checkout et des alertes de réassort tant que le prix vaut zéro. Pour le catalogue de recherche, utiliser `python -m app.scripts.merge_research_catalog --dry-run` puis `--apply`; les prix officiels USD/KRW restent des références privées et ne sont jamais convertis en MAD.

## Mises à jour sûres

- Correspondance par SKU, puis marque + nom officiel normalisé. Un nouvel import sans `--update-existing` indique SKIPPED pour les fiches existantes.
- Les valeurs négatives, formats incorrects, statuts inconnus, doublons de slug/code-barres et taxonomies inconnues produisent ERROR avec numéro de ligne.
- Champs vides : prix, coûts, stock, seuil, identité facultative et contenus existants préservés. Les booléens vides sont préservés ; `false` est une modification explicite.
- Les relations existantes restent intactes sans `--replace-relationships`. Avec cette option et `--update-existing`, les colonnes de relations fournies sont remplacées ; une colonne vide les efface explicitement.
- Chaque ligne possède un savepoint. Les lignes valides sont enregistrées même si d’autres échouent ; la commande retourne un code 1 si au moins une ligne échoue. Lire le rapport avant une nouvelle tentative.
- `--dry-run` effectue les validations et annule toute la transaction, créations de vocabulaires incluses. Il ne télécharge ni n’écrit de média.

## Images

`image_url` local doit être une image PNG/JPEG/WebP existante dans `public`. Les URL distantes sont uniquement téléchargées avec `--import-images`. Sans cette option elles ne sont pas utilisées comme images du storefront et le rapport le signale. Fournir des URL officielles ou approuvées, avec droit d’utilisation.

Le téléchargement contrôle le MIME et la signature, refuse les destinations réseau privées et limite chaque fichier à 12 Mo. L’image est décodée, orientée, limitée à 1800 px puis enregistrée en WebP. Le nom basé sur le contenu évite les fichiers répétés. ProductImage conserve la source et l’alt français, l’ordre et l’image principale. Un échec média est signalé sans rejeter les autres données du produit ; une image de remplacement peut être importée ensuite.

`MEDIA_STORAGE=local` (défaut) écrit dans `public/assets/catalog/imported`. `MEDIA_STORAGE=s3` utilise `MEDIA_S3_BUCKET`, `MEDIA_PUBLIC_BASE_URL`, éventuellement `MEDIA_S3_ENDPOINT_URL`, et les variables AWS standard de credentials/région. Le bucket doit être servi publiquement via le domaine/CDN configuré ; aucune ACL publique n’est créée par le code. Les credentials ne sont jamais exposés au frontend.

## Lot pilote

`product-pilot.csv` contient 16 fiches Anua, COSRX, SKIN1004 et Beauty of Joseon, extraites des identités et images historiques. Le stock fourni est zéro par prudence ; les prix viennent du catalogue existant. Les faits officiels et les associations cutanées non contrôlés restent vides / UNVERIFIED. Ne pas lancer `--update-existing` sur ce fichier pour remplacer vos stocks opérationnels. Sur la base actuelle, les 16 SKU sont reconnus et ignorés ; sur une base de staging migrée, ils sont créés.

Les variations en stock, promotions, AM/PM et associations nécessaires aux tests sont créées exclusivement par le jeu QA dans une base de staging, avec des valeurs explicitement synthétiques.
