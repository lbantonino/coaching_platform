# SOURCE FILES MANIFEST

| Fichier | Format | Origine | Interfaces | Rôle | Original ? | Usage Claude Code |
|---|---|---|---|---|---|---|
| shared/Coory Boites.dc.html | HTML + JS (Design Component) | Claude Design | 01–36 | Maquette source : gabarit + données SPECS + fonction frame() qui calcule chaque écran | **Original** | Lire les styles inline exacts ; ouvrir dans un navigateur |
| shared/support.js | JS | Runtime Claude Design | — | Moteur d’affichage du .dc.html | Original | Uniquement pour ouvrir la maquette, ne pas intégrer à COORY |
| shared/icons/*.svg (42) | SVG | Extraits des tracés de la maquette | toutes | Icônes ; la plupart = Lucide, 2 personnalisées (run, hyb) | Export dérivé | Utiliser Lucide quand indiqué, sinon ces SVG |
| shared/logo/*.svg | SVG | Kit logo Coory | fond de maquette | Logo | Original | Déjà fourni au kit logo |
| interface-NN/spec.json (36) | JSON | Extrait de SPECS + frame() | NN | Données structurées et valeurs calculées desktop/mobile | Export dérivé | Lecture machine des dimensions et contenus |

**Limite** : Claude Design ne produit pas de fichier de projet natif type Figma ; le .dc.html *est* la source native. Aucun fichier CSS séparé n’existe (styles inline).
