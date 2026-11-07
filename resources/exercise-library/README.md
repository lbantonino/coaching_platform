# Bibliothèque d'exercices de Coory : sources et fabrication

Mis à jour le 06/11/2026 (nettoyage du dossier). Décisions : D-75, D-76, D-142 et D-148 dans `00_INDEX.md`.

## Ce que contient ce dossier

- `data/source/` : le jeu de données RepDB (textes uniquement) et sa licence. Usage dans l'application seulement ; jamais republié en jeu de données ; images jamais données à une IA.
- `data/coory_extensions.json` : les exercices proposés par Coory (kit du 30/10).
- `data/repdb-images/` : les images RepDB d'origine (cache ignoré par Git, retéléchargé au besoin).
- `curation/` : nos décisions (périmètre visible, traductions, vocabulaires, doublons, images Hyrox).
- `catalog/` : le catalogue produit (JSON et CSV) et ses rapports.
- `illustrations/hyrox/` : les illustrations Hyrox d'Antonino, sur fond transparent (originaux).
- `illustrations/hyrox-lavande/` : les versions affichées dans l'app, sur fond lavande.

## Refaire le catalogue et les images

Depuis la racine du projet (Node 24) :

```bash
# 1. Catalogue (depuis ce dossier)
cd resources/exercise-library && node scripts/build-master-catalog.mjs && cd ../..
# 2. Images de public/exercises (RepDB recolorées en lavande, Hyrox converties)
node scripts/catalog-images.mjs
# 3. Migration SQL du catalogue
node scripts/catalog-to-sql.mjs supabase/migrations/20261030100100_catalogue_exercices.sql
```
