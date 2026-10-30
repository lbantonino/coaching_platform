# Images Hyrox de Coory

Dépose ici les images Hyrox, **un dossier par exercice**, nommé avec sa clé exacte.

**Format attendu**
- PNG, fond transparent si possible ;
- même cadrage pour toutes les images ;
- style Coory : personnage 3D semi-réaliste, t-shirt jaune, short noir, chaussures blanches, matériel noir ou gris.

**Images par exercice**
- `main.png` : l'image principale, obligatoire.
- `start.png` et `end.png` : le début et la fin du mouvement, facultatifs.

**Liste des fichiers attendus** (les 8 images principales sont importées ; début et fin restent facultatifs) : `catalog/illustrations-hyrox.csv`.

```
ski-erg/main.png
sled-push/main.png, start.png, end.png
sled-pull/main.png, start.png, end.png
burpee-broad-jump/main.png, start.png, end.png
rowing-machine/main.png
kettlebell-farmers-walk/main.png, start.png, end.png
sandbag-walking-lunge/main.png, start.png, end.png
wall-ball/main.png, start.png, end.png
```

**Règle de licence** : ne jamais donner une image RepDB à ChatGPT ou à une autre IA, même comme exemple de style. Décris seulement le mouvement avec des mots.

**La suite** : `node scripts/catalog-images.mjs` (à la racine de l'app) convertit les images en WebP dans `public/exercises/<clé>/<pose>.webp` ; la correspondance fichier → clé est dans `curation/illustrations-hyrox.json`. Dans l'app, elles sont posées sur le même bleu clair que les images RepDB.
