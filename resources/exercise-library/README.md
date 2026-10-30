# COORY — Exercise Library Starter v1

Ce kit sert **d'amorce technique**, pas de refonte de COORY. Il contient **115 entrées originales proposées** (à vérifier par un coach), un importateur optionnel de RepDB, un CSV, un JSON et un exemple de composant React. **Aucune illustration définitive COORY n'est incluse**. Le contenu du répertoire `public/exercises/` est à remplir progressivement avec nos PNG transparents originaux.

## Structure
- `data/coory_extensions.json` — 115 propositions d'exercices complémentaires avec identifiants stables.
- `data/coory_extensions.csv` — mêmes données, format tableur.
- `scripts/build-catalog.mjs` — construit `data/exercises.generated.json` et `.csv`.
- `src/components/ExerciseLibrary.tsx` + `.css` — **exemple d'interface React**, à adapter au code existant de COORY.
- `COORY_CLAUDE_CODE_PROMPT.md` — instructions d'intégration prudente.
- `public/exercises/` — destination des futures illustrations propriétaires (les chemins définis sont des placeholders).

## Génération sur ton ordinateur
À la racine de **ce dossier kit** :
```bash
node scripts/build-catalog.mjs
```
Crée le catalogue **COORY seulement** (115 entrées).

Pour combiner avec RepDB sur ton propre PC (Node.js 18+ avec accès Internet) :
```bash
node scripts/build-catalog.mjs --repdb
```
Cela télécharge les données directement depuis leur distribution officielle et génère un catalogue local fusionné. Le nombre exact dépend de la version actuellement publiée. Une déduplication simple sur le nom anglais est faite ; vérifier manuellement les synonymes et les variantes. **N'ajoute pas les données RepDB ni leurs images à un dépôt de dataset public.**

Pour utiliser les illustrations RepDB gratuites dans une application commerciale, respecter leur licence : attribution visible « Exercise data by RepDB (repdb.co) », usage dans l'application uniquement, pas de redistribution en dataset/API, et ne pas utiliser leurs images comme références d'IA. Voir https://github.com/RepDB/exercise-dataset/blob/main/LICENSE-DATA.md . Les exercices COORY doivent être illustrés indépendamment à partir des mouvements, pas des images RepDB.

## Affichage dans COORY
L'exemple React affiche les entrées du JSON généré, permet recherche et filtre, et utilise `images.main` puis `images.start`. En l'absence d'illustration, il indique « Illustration à venir ». **Il ne modifie aucun fichier de ton application actuelle automatiquement.** Demande à Claude Code de brancher ces données sur sa bibliothèque existante, sans remplacer les écrans ou les fonctions.

## Champs à finaliser avant production
Les exercices ajoutés ont `review_status=needs_coach_validation`, `primary_muscles=[]`, `instructions_fr=[]`, etc. : ces champs sont laissés volontairement incomplets plutôt que d'inventer des consignes biomécaniques. Avant publication, faire vérifier les mouvements par un coach qualifié, compléter les consignes et les traductions, contrôler les doublons, la correspondance des images et les droits des médias.

## Illustrations COORY validées
Personnage semi-réaliste 3D / studio, t-shirt jaune, short noir, chaussures blanches, équipements noirs/gris, fonds PNG réellement transparents, cadrages homogènes. Une image par pose (`main`, `start`, `end`) et identifiant stable. Nos planches précédentes sont des références de direction artistique, **pas encore 115 fichiers PNG autonomes**.
