# Points à terminer avant production

- **Données officielles** : le lot pilote utilise des fiches historiques UNVERIFIED. Compléter et contrôler les URL fabricant, INCI, précautions, traductions et associations avant de les certifier. Les stocks échantillons déjà présents doivent être remplacés par un inventaire réel.
- **Telegram** : `app/worker.py` consomme effectivement NotificationOutbox si lancé avec `python -m app.worker`. Il lit les credentials Telegram, traite les événements par lots et réessaie les échecs. Aucun service worker supervisé n’est défini dans compose et aucun dispatch réel configuré n’a été prouvé ici. Configurer credentials, supervision et contrôle de livraison avant lancement ; ne bloque pas l’import.
- **Réassort** : les abonnements sont réellement enregistrés, mais aucun service de notification e-mail de réassort n’est raccordé. Le texte de confirmation indique une inscription, sans affirmer qu’un e-mail a déjà été envoyé.
- **Médias** : stockage local opérationnel ; adaptateur S3 compatible implémenté et testé avec client simulé. Un bucket/CDN réel, credentials, politiques d’accès, sauvegardes et droits des images doivent être configurés et validés.
- **PostgreSQL** : migrations SQLite contrôlées ; exécuter la répétition sur clone PostgreSQL et le contrôle des sauvegardes avant déploiement. Aucun serveur PostgreSQL de production n’a été modifié.
- **SEO statique** : reconstruire/prérendre après publication ou modification des produits. Les coûts restent exclus du payload public. Les pages produits en rupture restent indexables.
- **Charge** : pagination SQL et index présents ; mesurer temps de réponse et plans sur le volume et l’infrastructure réels. Aucun résultat de charge à grande échelle n’est revendiqué.

Les avis restent désactivés. Aucun paiement en ligne ni confirmation de commande par WhatsApp n’a été ajouté.
