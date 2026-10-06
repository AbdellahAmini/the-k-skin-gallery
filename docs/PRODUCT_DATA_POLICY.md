# Politique des données

## Faits officiels

Utiliser la fiche du fabricant ou un document officiel pour le nom, le format, la formule INCI, les allégations, les instructions et les précautions. Conserver nom et URL précise de la source, langue et date de contrôle. Une URL de boutique tierce, une photo ou le nom du produit ne suffit pas à certifier une formule ou une compatibilité cutanée.

Les textes fabricant et les textes français de la Gallery ont des champs distincts. Une traduction doit préserver le sens, éviter les promesses médicales et pouvoir être reliée à sa source. Ne pas déduire un ingrédient, un bénéfice ou une formule complète du nom commercial.

## Curation de la Gallery

Prix, stock, promotion, mise en avant, type de soin, étape de routine et associations de filtres sont des décisions de la boutique. Les associations peau/besoins/ingrédients nécessitent une validation humaine explicite (`classification_verified`). Une association proposée n’est pas publiée automatiquement. Une formule changeant nécessite une nouvelle revue des associations.

## Vérification

| État | Utilisation |
|---|---|
| UNVERIFIED | Import existant ou source officielle non contrôlée ; conserver les champs inconnus vides |
| PARTIAL | Une partie des informations contrôlée ; compléter les autres avant certification |
| VERIFIED | Contrôle humain effectué ; nom et URL source requis, date conservée |
| NEEDS_REVIEW | Contradiction, changement de formule, source disparue ou contrôle à renouveler |

Le système contrôle la présence et la syntaxe de la provenance ; il ne prouve pas automatiquement que le domaine appartient au fabricant. L’admin reste responsable du statut VERIFIED. Le lot pilote récupéré du catalogue historique est UNVERIFIED : ses noms, formats, prix et images ne deviennent pas des faits certifiés par cet import.

## Inventaire et publication

Ne jamais supprimer ou archiver une fiche uniquement parce que son stock est zéro. Une fiche `published` reste consultable et propose une alerte de réassort. Les nouvelles lignes sans stock confirmé démarrent à zéro ; ne pas attribuer un stock fictif. Les jeux QA portent `stock_is_sample=true` et restent dans une base isolée.

Une réduction nécessite un prix de comparaison réel et validé. Aucun prix barré fictif n’est ajouté au catalogue local pour tester les promotions. Les avis publics restent désactivés. WhatsApp est un canal d’aide ; la commande COD passe toujours par le checkout et la confirmation téléphonique.
