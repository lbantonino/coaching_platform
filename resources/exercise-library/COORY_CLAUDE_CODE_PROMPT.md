# Message pour Claude Code — intégration sans destruction

Lis `README.md`, `data/coory_extensions.json` et `scripts/build-catalog.mjs` dans ce kit. Inspecte d'abord le projet COORY réel et identifie framework, bibliothèque d'exercices, base de données, routes, thèmes et composants déjà en place. Ne présume pas que le projet est en React ni que l'exemple de composant est directement utilisable.

1. Propose un mapping entre les champs COORY existants et les champs du catalogue.
2. Préserve toutes les données, pages, actions, composants, thèmes, migrations et droits existants. N'ajoute pas de dépendances sans accord.
3. Intègre progressivement la bibliothèque avec recherche, filtres et état d'image manquante. Évite les doublons, utilise des identifiants stables et maintiens la compatibilité avec les programmes déjà créés.
4. Les 115 entrées COORY sont des propositions à valider, sans images produites. Ne crée pas de descriptions médicales ou d'instructions inventées. Les chemins PNG sont provisoires.
5. Si on utilise RepDB, récupère les données depuis la source officielle localement, respecte l'attribution, la licence d'usage in-app et l'interdiction de redistribuer un dérivé en dataset. Ne réutilise aucune image RepDB pour générer une image IA.
6. Vérifie l'affichage en dark/light, responsive, états sans image, accessibilité et tests; n'écrase pas l'ancienne bibliothèque sans migration réversible.
7. Commence uniquement par un plan technique et un prototype non destructif dans la page existante ; demande ma validation avant toute migration globale.
