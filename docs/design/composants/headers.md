# En-têtes de page

## En-tête de la fiche sportif (2a, 2b, 2c, 2e → 2k)
Extrait exact : [source-fiche-header.md](source-fiche-header.md).

### Desktop
- Carte `#fff`, rayon 20, `padding:20px 22px`, flex-wrap, `gap:16px`, centré.
- Avatar 60×60 rond, fond `#f0e5d6`, « IB » `600 19px #2a2733`.
- Bloc identité (`flex:1 1 200px`, `gap:6px`) : ligne 1 = **Nom** `600 26px/1.15` `-.025em` nowrap + pastille sexe 22×22 ronde (♀ `#c2266b` sur `rgba(194,38,107,.10)`) ; ligne 2 = méta `400 13.5px #4a4855` : point 7 `#15803d` « Actif » · « Confirmé » · point 7 `#FEC14F` « Hyrox » (séparateurs « · » `#c9c7d1`, `gap:8px 12px`).
- Bouton « Écrire » (contour .14, h40, `padding:0 14px`, rayon 11, icône bulle 15, `500 14px`) à droite.
- Puis **barre d’onglets** (voir ../design-system/components.md § Onglets) : Vue d’ensemble · Profil · Agenda · Programme · Objectifs · Repères · Disponibilités · Notes · Documents · Historique.

### Mobile
- Carte compacte : avatar (avec point de statut), nom + ♀, méta « Confirmé · Hyrox », bouton icône « Écrire » à droite.
- Sous le séparateur : **sélecteur d’onglet** (icône grille violette + nom de l’onglet courant `600 15px` + « n / 10 » `500 12.5px #8b8996` nowrap + chevron qui pivote). Ouverture : liste des 10 onglets, actif en `rgba(139,92,246,.10)` / `#6a3ee0`, anneau du déclencheur `inset 0 0 0 1.5px rgba(139,92,246,.55)`.

## En-tête 2d (détail de séance)
Pas d’en-tête de fiche ni d’onglets : le header global affiche « ← Inès Benali » ; le titre est dans la carte Séance.
