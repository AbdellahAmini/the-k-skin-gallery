# Audit de la fondation catalogue

État initial observé : 96 produits, 18 marques, 94 produits actifs, 4 commandes et 2 lignes de commande. Les stocks étaient principalement des stocks d’échantillon ; les associations peau/besoins étaient absentes. Deux fiches Beauty of Joseon ont le même nom sous deux SKU distincts : elles restent préservées, à contrôler humainement.

## Avant cette phase

Product contenait SKU/slug/nom, marque/type, format libre, prix/coûts, stock, active, featured/new_arrival, descriptions, instructions, INCI et URL officielle. ProductMetadata contenait usage, routine, alias, source et dates. Les relations marque/type/peau/besoins/ingrédients existaient, ainsi que commandes, réservations et alertes stock.

L’import historique lisait `input/products_catalog.json`, déduisait des informations des noms et pouvait attribuer un stock d’échantillon. Les APIs catalogue filtraient et paginaient après chargement des produits en mémoire. Le storefront demandait une grande page globale. Les alertes stock étaient enregistrées mais sans états d’interface complets.

## Ajouts

Trois migrations Alembic ajoutent identité fabricant/FR, code-barres, format structuré, sous-types, seuil stock, publication et vérification séparées, provenance, contenus fabricant, SEO, galerie média, classification validée et index de rapprochement. L’ancienne valeur active alimente la publication ; les anciennes images deviennent des images principales. Aucun produit ou commande n’est supprimé.

La liste utilise maintenant SQL pour filtres, comptages, facets et pagination ; les relations de la page seulement sont chargées. L’accueil demande deux sélections de huit produits. Les pages catalogue alimentent le cache pour panier/favoris et demandent leurs résultats à l’API. Les ruptures restent consultables et recherchables, avec formulaire de réassort et réponses succès/déjà inscrit/erreur.

L’admin possède pagination, filtres publication/vérification/stock, sections d’édition, gestion marques/sous-types et actions groupées limitées. L’import CSV/JSON offre validation par ligne, simulation, mises à jour explicites et ingestion média configurable.

## Migration locale

La base locale historique avait été créée par `create_all` sans version Alembic. Ses tables ont été comparées au schéma initial avant de la marquer au niveau initial ; les migrations additives ont ensuite été exécutées. Ne pas reproduire un `stamp` aveugle en production. Sur une base vide, exécuter simplement `alembic upgrade head`. Les démarrages normaux n’importent plus automatiquement le catalogue (`AUTO_IMPORT_CATALOG=0`).

SQLite ne reconstruit pas la table produit pour ajouter la FK du sous-type ; le lien est contrôlé par l’API/importeur. PostgreSQL reçoit la FK. Valider ces migrations sur un clone PostgreSQL avant déploiement.
