# Stratégie de 20 packs — The K-Skin Gallery

**Date de recherche : 2026-10-10. Statut : proposition commerciale, aucun pack créé dans la base.**

## Décision immédiate

Les **20 concepts** sont cohérents et chiffrés pour revue commerçant, mais **0 n'est prêt à publier**. La base contient 323 produits, dont 96 avec un stock positif enregistré; 94 d'entre eux sont marqués `stock_is_sample=1`. Les deux autres (Skinoren et Acretin) ne sont pas retenus dans une offre cosmétique tant que leur statut réglementaire et commercial marocain n'est pas établi. Aucun stock vendable n'est indépendamment confirmé.

Les prix proposés ne remplacent pas un comptage physique, une facture fournisseur récente et des frais réels de livraison/retours. Lancer d'abord cinq packs pilotes **après** ces contrôles; ne pas activer automatiquement les vingt.

## Périmètre et méthode

- Source unique pour nos SKU, noms, prix, coûts et stocks : `the-k-skin-gallery/backend/gallery.db`, requêtes en lecture seule.
- `price_dh` = prix de vente détail; `cost_dh` = prix d'achat par unité; `wholesale_dh` = prix de vente en gros. `compare_at_dh` est seulement un contexte et ne sert pas à fabriquer des remises.
- Le coût en base est pris **tel quel**. La négociation fournisseur de 10 DH déjà discutée n'est pas soustraite une deuxième fois.
- `stock_is_sample=1` signifie stock de démonstration dans `backend/app/catalog.py` (`stock=10 if demo_stock else 0`). Un `stock>0` de ce type est une disponibilité provisoire, pas une preuve de produit physiquement expédiable.
- Les réservations non libérées portent sur les IDs 6, 61 et 62 (2 unités chacun); leur décrément est déjà reflété dans `products.stock` par `backend/app/api/commerce.py`. Les soustraire à nouveau créerait un double décompte.
- Recherche officielle produit, guidance dermatologique et prix affichés chez des détaillants marocains. Les prix du marché sont des observations ponctuelles de page, hors validation panier/livraison et susceptibles de changer.

## Analyse de Beautyvana

Le fichier déclare **127 offres**, mais contient **51 objets pack**. Les 76 manquants ne sont pas reconstitués. Tous les objets présents ont été parcourus. Empreinte SHA-256 de l'instantané analysé : `4924843a4d2fbcec21fb672b6483d57072393bb14b6539b325e5ed4bcd1140b8`.

Répartition par références : 1 produits : 4, 2 produits : 26, 3 produits : 13, 4 produits : 5, 5 produits : 3. Disponibilité annoncée : {'available': 30, 'out_of_stock': 21}. Remises affichées parmi les pages chiffrées : -4.2 % à 38.6 %; médiane observée ≈ 19.2 %. Les descriptions insistent sur taches/éclat, hydratation, pores et routines courtes. Certaines promettent un effet très rapide : nous retenons le format lisible et la pédagogie d'usage, pas ces promesses ni les prix barrés non vérifiés.

## Hypothèses financières modifiables

| Variable | Base de calcul | Statut |
| --- | --- | --- |
| Marge brute cible | ≥35 %, viser 40 % quand possible | objectif de planification |
| Emballage | 10 DH/pack | hypothèse |
| Acquisition | 20 DH/commande | hypothèse |
| Paiement COD | 5 DH/commande | hypothèse |
| Réserve échec/retour | 10 DH/commande | hypothèse |
| Subvention livraison dès 500 DH | 36 DH/commande | hypothèse arrondie; seuil 500 DH présent dans la configuration |

Ainsi, frais variables estimés = **45 DH** pour une commande contenant seulement un pack sous 500 DH et **81 DH** à partir de 500 DH. `Contribution` = prix − coût produits − ces frais. Si un autre article fait franchir 500 DH, retirer encore **36 DH** à la contribution d'un pack initialement sous le seuil. La livraison facturée au client sous le seuil n'est pas prise comme revenu. Douanes, TVA, frais fixes et remises de fournisseurs futures ne sont pas modélisés, faute de chiffres contrôlés. Réestimer avant publication.

Le `prix régulier du pack` des fichiers = somme des prix détail individuels actuels dans la base. Il s'agit d'un **repère de planification**, pas de l'ancien prix de ce pack. N'afficher un prix barré ou un pourcentage promotionnel que si le prix de référence est réellement appliqué et conforme aux règles commerciales.

## Classement des 20 propositions

| Rang | Pack | SKU/IDs | Coût | Détail séparé | Prix proposé | Économie | Marge brute | Contribution estimée | Score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | SPF Quotidien & Retouche | 70+73 | 285 | 509 | 459 | 50 DH (9.82 %) | 37.91 % | 129 | 84 |
| 2 | Pêche & Équilibre | 7+34 | 290 | 525 | 489 | 36 DH (6.86 %) | 40.7 % | 154 | 83 |
| 3 | Éclat Pêche & SPF | 7+70 | 290 | 495 | 469 | 26 DH (5.25 %) | 38.17 % | 134 | 83 |
| 4 | Premier Éclat à Petit Prix | 51+70 | 182 | 300 | 289 | 11 DH (3.67 %) | 37.02 % | 62 | 81 |
| 5 | Matin Pêche, Crème & SPF | 7+17+11 | 475 | 810 | 759 | 51 DH (6.3 %) | 37.42 % | 203 | 79 |
| 6 | Teint Uniforme & Barrière | 31+34 | 285 | 480 | 449 | 31 DH (6.46 %) | 36.53 % | 119 | 79 |
| 7 | La Signature Gallery | 20+7+17+70 | 705 | 1185 | 1099 | 86 DH (7.26 %) | 35.85 % | 313 | 78 |
| 8 | Lait de Riz & Glow du Matin | 79+7+70 | 475 | 785 | 749 | 36 DH (4.59 %) | 36.58 % | 193 | 78 |
| 9 | Duo Barrière Sereine | 34+17 | 300 | 510 | 469 | 41 DH (8.04 %) | 36.03 % | 124 | 78 |
| 10 | Nettoyer & Préserver | 88+34 | 310 | 510 | 489 | 21 DH (4.12 %) | 36.61 % | 134 | 77 |
| 11 | Matin Vitamine C & Soleil | 2+70 | 285 | 460 | 439 | 21 DH (4.57 %) | 35.08 % | 109 | 77 |
| 12 | Cible & Confort | 33+34 | 275 | 470 | 429 | 41 DH (8.72 %) | 35.9 % | 109 | 77 |
| 13 | Rituel Double Nettoyage & SPF | 20+71 | 395 | 650 | 609 | 41 DH (6.31 %) | 35.14 % | 133 | 76 |
| 14 | Calme & Imperfections Visibles | 5+34 | 315 | 535 | 489 | 46 DH (8.6 %) | 35.58 % | 129 | 76 |
| 15 | Hydratation & Soleil Doux | 17+11 | 325 | 535 | 509 | 26 DH (4.86 %) | 36.15 % | 103 | 76 |
| 16 | Visage & Lèvres au Soleil | 45+71 | 215 | 360 | 339 | 21 DH (5.83 %) | 36.58 % | 79 | 76 |
| 17 | Soir Panthénol & Confort | 47+17 | 310 | 505 | 479 | 26 DH (5.15 %) | 35.28 % | 124 | 75 |
| 18 | Quatre Pauses Hydratantes | 27+17 | 350 | 560 | 539 | 21 DH (3.75 %) | 35.06 % | 108 | 75 |
| 19 | Texture Douce, Semaine Claire | 35+34+70 | 430 | 710 | 679 | 31 DH (4.37 %) | 36.67 % | 168 | 72 |
| 20 | Retinal du Soir, Confort | 25+34 | 280 | 455 | 439 | 16 DH (3.52 %) | 36.22 % | 114 | 72 |

**Scores :** compatibilité/sécurité 25, rentabilité 25, attrait estimé 20, inventaire 15, différenciation 10, simplicité 5. Tous perdent beaucoup de points d'inventaire puisque les quantités sont d'exemple. L'attrait est une hypothèse de merchandising, pas une mesure de ventes.

## Cinq pilotes de lancement, sous réserve de stock confirmé

| Pack | Raison du choix | Contrôle avant vente |
| --- | --- | --- |
| Éclat Pêche & SPF | Duo facile à expliquer; besoin quotidien clair; prix 469 DH. | Comparer Anua Peach au marché et confirmer les deux lots. |
| SPF Quotidien & Retouche | Différenciation d'usage et économie visible à 459 DH. | Expliquer application généreuse du stick et vérifier SPF du lot. |
| Duo Barrière Sereine | Panier milieu de gamme doux sans actif fort. | Vérifier stock, tolérance/INCI et coûts. |
| Premier Éclat à Petit Prix | Entrée à 289 DH avec SPF quotidien et masque découverte. | Vérifier format 28 ml et délai d'usage du masque. |
| Rituel Double Nettoyage & SPF | Couvre nettoyage du soir et SPF du matin sans multiplier les SKU. | Confirmer contenu physique du SKU20 et absence de stock partagé 61/62. |

Le pack premium **La Signature Gallery** est le meilleur concept image, mais uniquement comme seconde vague : il dépend lui aussi du kit SKU20 et d'un panier à 1 099 DH; tester l'intérêt et la logistique d'abord.

## Cinq opportunités de marge brute potentielle

| Pack | Marge brute planifiée | Profit brut/pack | Réserve |
| --- | --- | --- | --- |
| Pêche & Équilibre | 40.7 % | 199 DH | Stock d'exemple; demande non mesurée |
| Éclat Pêche & SPF | 38.17 % | 179 DH | Stock d'exemple; demande non mesurée |
| SPF Quotidien & Retouche | 37.91 % | 174 DH | Stock d'exemple; demande non mesurée |
| Matin Pêche, Crème & SPF | 37.42 % | 284 DH | Stock d'exemple; demande non mesurée |
| Premier Éclat à Petit Prix | 37.02 % | 107 DH | Stock d'exemple; demande non mesurée |

**Meilleur pack budget :** Premier Éclat à Petit Prix. **Meilleur pack premium :** La Signature Gallery sous réserve de vérification du kit. **Meilleur pour débutant :** Éclat Pêche & SPF. **Meilleure campagne saisonnière :** SPF Quotidien & Retouche, avec consignes d'application honnêtes.

## Marché marocain et limites des comparaisons

- BOJ Aqua-Fresh : 215 DH KBeauty Maroc, 218 DH Parasmart, 239 DH Beautyvana, contre 220 DH dans notre base. Les sources sont dans `research_sources.md`.
- Anua Peach 70 : 249 DH Beautyvana et 294 DH Parasmart, contre 275 DH dans notre base. Le pack reste sous notre total interne, mais il ne faut pas l'afficher comme le prix absolument le plus bas du marché.
- AXIS-Y Dark Spot : 229, 239 et 245 DH observés, contre 230 DH dans notre base. Marges de manœuvre étroites pour une remise forte.
- SKIN1004 Double Cleansing Duo : 399 DH chez Beautyvana contre 430 DH pour notre SKU20. Notre pack avec SPF n'est **pas directement comparable** à leur duo seul. Vérifier l'identité exacte du kit.
- Certaines offres SKIN1004 Ampoule Foam à ~69 DH concernent le mini format 20 ml; ne pas les comparer au 125 ml. Les autres sources consultées montrent 199 DH pour 125 ml.
- Pour la plupart des assemblages, trois prix de packs strictement identiques n'existent pas ou n'ont pas été vérifiés. La compétitivité est donc jugée sur les composants exacts, la proposition d'usage et la marge, avec une confiance faible à moyenne.

## Sécurité, identité et limites de l'offre

- Retinal Celimax : seulement le soir, introduction progressive, SPF le matin; éviter grossesse/allaitement sans avis médical. Le pack 14 n'inclut pas de SPF.
- PHA AXIS-Y : usage espacé et rinçage selon notice; ne pas le juxtaposer à un rétinoïde le même soir. Le pack 13 inclut un SPF.
- Medicube 'Azelaic Acid 16' : le libellé fabricant parle d'un complexe. Ne pas annoncer '16 % d'acide azélaïque pur' sans preuve de formule.
- Baume lèvres SOME BY MI : SPF15; ne pas le présenter comme équivalent à la recommandation SPF30+ pour exposition solaire prolongée.
- BOJ Relief Sun Rice + Probiotics : le fabricant a fait évoluer certains noms/packagings. Vérifier le lot réel et ne pas fusionner avec Aqua-Fresh Rice + B5.
- Toute fiche produit sélectionnée reste `UNVERIFIED` ou sans classification vérifiée dans la base. Les sources officielles éclairent les usages, mais ne vérifient pas l'authenticité du stock ni la formule du lot reçu.
- Les deux crèmes Skinoren et Acretin sont exclues. Une recherche dans le registre AMMPS et un avis réglementaire spécifique précèdent toute décision commerciale.

## Inventaire partagé et packs existants

Le maximum indépendant de chaque pack figure dans `recommended_packs_20.json`; il **ne se cumule pas**. Si l'on préparait une unité de chacune des 20 propositions à partir des chiffres enregistrés, les références les plus sollicitées seraient :

| ID | Produit | Demandé pour 1 exemplaire de chaque pack | Stock enregistré | Reste théorique |
| --- | --- | --- | --- | --- |
| 34 | AXIS-Y Artichoke Intensive Skin Barrier Ampoule | 8 | 10 | 2 |
| 70 | Beauty of Joseon Relief Sun Aqua-Fresh Rice + B5 SPF50+ PA++++ | 7 | 10 | 3 |
| 17 | Dr. Althea Aqua Marine Watery Cream 50ml | 6 | 10 | 4 |
| 7 | Anua Peach 70 Niacin Serum 30ml | 5 | 10 | 5 |
| 11 | Medicube Collagen Firming Sun Cream SPF50+ PA++++ 50ml | 2 | 10 | 8 |
| 20 | SKIN1004 Madagascar Centella Double Cleansing Duo | 2 | 10 | 8 |
| 71 | Beauty of Joseon Relief Sun Rice + Probiotics SPF50+ PA++++ | 2 | 10 | 8 |
| 73 | Beauty of Joseon Matte Sun Stick Mugwort + Camelia SPF50+ PA++++ | 1 | 10 | 9 |

Ces restes sont purement théoriques : les chiffres de départ sont principalement des stocks de démonstration. Il faut réserver chaque unité au pack réellement préparé. Le SKU20 pourrait contenir des articles identiques aux SKU61/62; contrôler le conditionnement avant allocation.

Pack déjà présent en base : **Duo Double Nettoyage** (actif) à 510 DH avec IDs [61, 62]. Ses composants totalisent 475 DH au détail et coûtent 340 DH; il est donc affiché **plus cher** que l'achat séparé et sa marge brute n'atteint pas la cible de 35 %. Ne pas le prendre comme prix de référence et le revoir séparément.

## Alternatives écartées

| Candidat | IDs | Motif |
| --- | --- | --- |
| R1 | 61+62 | Deux nettoyants séparés: coût 340 DH pour 475 DH de détail; 35 % de marge et une vraie remise impossibles sans remonter au-dessus du détail. |
| R2 | 21+70 | Le SKU Glow Duo a une marge produit trop faible; une remise viable n'est pas crédible. |
| R3 | 78+70 | La crème 345 Relief absorbe presque toute la capacité de remise; changer de composition. |
| R4 | 35+25 | PHA et retinal ensemble ajoutent une charge d'irritation inutile; calendrier plus complexe qu'un pack débutant. |
| R5 | 18+19 | Deux crèmes à statut potentiellement médicamenteux; exclues de l'offre cosmétique en attente de vérification réglementaire. |
| R6 | 95+70 | Ampoule à faible marge; économie pack minime au seuil de 35 %. |
| R7 | 76+88 | Deux nettoyants mais pas de soin sans rinçage; valeur et routine moins convaincantes que les 20 sélectionnés. |

Soit **27 concepts évalués** : 20 retenus, 7 écartés. Le rapport ne prétend pas mesurer la demande par ventes réelles.

## Conditions d'approbation

1. Compter physiquement chaque SKU retenu; supprimer les quantités d'exemple et confirmer l'absence de stock commun entre kit SKU20 et composants séparés.
2. Vérifier facture d'achat, emballage, livraison réellement payée, taux de refus COD et marge après ces coûts; recalculer les prix.
3. Photographier/contrôler EAN, volume, INCI, SPF et variante du lot avant de finaliser la fiche.
4. Vérifier les prix individuels effectivement affichés avant toute allégation d'économie ou de prix barré.
5. Tester cinq pilotes, suivre conversion, panier moyen, contribution et retours; ajuster ensuite le portefeuille.

## Sources et fichiers

Voir `research_sources.md` pour les liens officiels, les conseils dermatologiques, les comparateurs marocains et l'inventaire des 51 pages Beautyvana analysées. `recommended_packs_20.json` porte les fiches détaillées; `packs_pricing_analysis.csv` expose toutes les valeurs financières; `products_inventory_audit.json` recense les 323 produits; `launch_recommendations.md` donne le plan pilote.
