# Guide d’implémentation pour Claude Code

## Principe
Implémentation **page par page**, jamais en masse. Une page n’est terminée que si elle est **fonctionnelle ET conforme visuellement** (checklist `acceptance-criteria.md`).

## Étape 0 — Préparation (une seule fois)
1. Lire `README.md`, `MASTER-INDEX.md`, tout `design-system/` et `shared-components/`.
2. Analyser le code COORY : routes coach, layout global (sidebar, header), composants UI existants (boutons, inputs, menus déroulants, onglets, cartes, avatars, badges), modèles de données (sportif, programme, séance, objectif, repère/mesure, performance, note, document, événement d’historique).
3. Produire un tableau de correspondance « composant maquette → composant existant » (fichier `MAPPING.md` dans ce dossier). Réutiliser l’existant ; ne créer un composant que s’il n’existe pas.
4. Créer/aligner les **tokens** (`design-system/colors.md`, `typography.md`, `spacing.md`) dans le système de style du projet (variables CSS / thème Tailwind). Ne pas changer la police si le projet en utilise déjà une : la maquette utilise **Plus Jakarta Sans** — vérifier ce que l’app charge et signaler l’écart avant de modifier.
5. Aligner la coque commune (`shared-components/navigation.md`, `headers.md`) **sans modifier le panneau latéral s’il est déjà conforme**.

## Boucle par page (dans l’ordre du MASTER-INDEX)
1. Lire `pages/<page>/specification.md`, `desktop.md`, `mobile.md`, `interactions.md`, `acceptance-criteria.md`.
2. Ouvrir `screenshots/desktop.png` et `mobile.png` (capturés en 2× : 1 px CSS = 2 px image).
3. Lire `source-extract.md` pour les valeurs exactes (padding, gap, rayon, couleurs, tailles de police).
4. Lister les écarts entre le code actuel et la cible : structure, styles, contenus, comportements.
5. Lister les fonctionnalités existantes de la page et vérifier qu’aucune ne disparaît (voir `FUNCTIONAL-GAP-ANALYSIS.md`).
6. Modifier **uniquement** ce qui est nécessaire.
7. Tester les fonctionnalités existantes + nouvelles.
8. Capturer l’implémentation aux **mêmes viewports** (1280×… et 390×…) et comparer avec les références (superposition si possible).
9. Corriger les écarts. Cocher `acceptance-criteria.md`. Puis seulement passer à la page suivante.
10. Résumer à l’utilisateur : modifications, nouvelles fonctionnalités, écarts restants, points « À vérifier ».

## Interdits
- Reconstruire l’application ou une page from scratch.
- Supprimer un champ, un bouton, une validation, une permission ou un appel API parce qu’il n’apparaît pas dans la maquette → **le conserver et le signaler**.
- Coder en dur les données de démonstration.
- Positionnements absolus ou largeurs fixes propres à 1280 px pour la mise en page (sauf éléments réellement fixes : avatars, icônes, boutons).
- Inventer un état ou un écran non dessiné sans le signaler comme proposition.

## Viewports de contrôle
Desktop : 1280, 1440, 1920, 2560, 3440. Mobile : 360, 390, 430. Voir `design-system/responsive.md`.
