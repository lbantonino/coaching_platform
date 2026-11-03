# Coory — Page « Détail d'une séance » (brief pixel-perfect)

> **Pour Claude Code.** Refais la page de détail d'une séance de l'agenda coach (`/coach/…/agenda/seances/[id]`) **au pixel près**, en desktop ET en mobile.
> - Desktop = maquette **1a** → `reference-seance-desktop-1a.png` (rendu à 1280 px, capture @2x)
> - Mobile = maquette **1e** → `reference-seance-mobile-1e.png` (rendu à 390 px, capture @3x)
> - Source exacte : `Coory Seance Detail.dc.html` (sections `#1a` et `#1e`). En cas de doute, **les valeurs de ce fichier font foi**.

---

## 0. Règles

1. **Ne change rien au design system existant** (couleurs, police, sidebar, header, boutons). Tu changes **uniquement la structure de la page séance** (ordre, regroupement, tailles et positions des cartes).
2. Ne touche pas à la logique : données, routes, appels API, modale « Modifier », suppression, messagerie.
3. Toutes les valeurs ci-dessous sont en **px CSS**. Les captures sont à 2x (desktop) et 3x (mobile) : divise les mesures par 2 ou par 3.
4. Breakpoint : **< 1024 px = mobile (1e)**, **≥ 1024 px = desktop (1a)**.
5. Avant de coder, liste-moi les fichiers que tu vas modifier et attends ma validation.

---

## 1. Tokens utilisés (existants — ne pas en créer d'autres)

| Rôle | Valeur |
|---|---|
| Fond de page | `#F3F2F7` |
| Carte | `#FFFFFF` |
| Contour carte | `box-shadow: inset 0 0 0 1px rgba(22,18,40,.05)` |
| Contour encadré interne / bouton outline | `inset 0 0 0 1px rgba(22,18,40,.09)` (encadré) · `rgba(22,18,40,.14)` (bouton) |
| Séparateur fin | `1px solid rgba(22,18,40,.07)` |
| Séparateur vertical (méta) | `1px × 22px` desktop / `1px × 18px` mobile, `rgba(22,18,40,.12)` |
| Texte | `#17151D` |
| Texte secondaire | `#4A4855` |
| Texte discret (labels) | `#64626E` |
| Chevron | `#8B8996` |
| Violet (marque) | `#8B5CF6` |
| Violet texte (heure, liens, pastille) | `#6A3EE0` |
| Violet doux (pastille « Aujourd'hui ») | `rgba(139,92,246,.10)` |
| Timeline : trait | `#E6E1F7` · point : fond blanc + anneau `inset 0 0 0 2.5px #B9A3FF` |
| Série : passées / actuelle / à venir | `#D9D2F2` / `#8B5CF6` / `#ECEBF1` |
| Hybride (point discipline) | `#2DD4BF` |
| Rouge (supprimer) | `#D4223D` |
| Bouton principal (Modifier mobile) | fond `#17151D`, texte `#FFFFFF` |
| Avatar sans photo | fond `#2A2733`, initiales blanches (si une photo existe : l'afficher, même taille, `border-radius:50%`, `object-fit:cover`) |

**Police** : celle du projet (maquette en *Plus Jakarta Sans*). Graisses utilisées : 400, 500, 600. Chiffres de l'heure : `font-variant-numeric: tabular-nums`.

**Icônes** : style Lucide, trait 1.8 (2 pour les flèches et chevrons) :
`calendar` · `map-pin` · `clock` · `message-circle` · `chevron-right` · `pencil` · `trash-2` · `arrow-left`.

---

## 2. DESKTOP (1a) — largeur de référence 1280 px

### 2.1 Coquille (inchangée)
- Page : fond `#F3F2F7`, padding `14px`, `display:flex; gap:20px; align-items:flex-start`.
- **Sidebar** : existante, **largeur 236 px**, aucune modification (item « Agenda » actif).
- **Zone principale** : `flex:1; display:flex; flex-direction:column; gap:16px`.

### 2.2 Header (carte) — existant, seul le titre change
- Carte blanche, radius `20px`, padding `16px 18px 16px 22px`, `display:flex; align-items:center; gap:10px`.
- Gauche (colonne, gap 6) :
  - Lien retour : icône `arrow-left` 14 + « Agenda » — 13.5px/400, `#64626E`.
  - Ligne titre (gap 10) : « Coaching hybride » **15px/600** (rétrogradé : le grand titre est dans la carte héro) + point 7×7 `#2DD4BF` + « Hybride · Individuelle » 13.5px/400 `#64626E`.
- Droite : recherche ⌘K (200×32), **Assistant IA** (violet plein, h 32), cloche 32×32 + badge 16 px violet, **Modifier** (noir, h 32), menu `···` 32×32. Tous radius `9px`. → **inchangés**.
- Menu `···` : Dupliquer la séance · Annuler cette date · **Supprimer la séance** (rouge, icône corbeille).

### 2.3 Carte héro (pleine largeur)
```
display:grid; grid-template-columns: minmax(0,1fr) 280px; gap:28px; align-items:start;
padding: 28px 28px 24px; border-radius:20px; background:#fff; box-shadow: inset 0 0 0 1px rgba(22,18,40,.05);
```
**Colonne gauche** (`display:flex; flex-direction:column; gap:20px`) :
1. **Titre** (gap 8) :
   - H2 « Coaching hybride » — **30px / 600**, line-height 1.1, letter-spacing −0.025em.
   - Ligne discipline : point 8×8 `#2DD4BF` + « Hybride · Individuelle » 14.5px/400 `#4A4855`, gap 7.
2. **Bloc horaire** (gap 6) :
   - Ligne date (gap 8, 14.5px/500) : icône `calendar` 15 + « Lundi 2 novembre » + **pastille « Aujourd'hui »** (h 22, padding 0 9px, radius 11, fond `rgba(139,92,246,.10)`, texte `#6A3EE0` 12px/500). La pastille n'apparaît que si la séance est aujourd'hui (sinon « Demain » ou rien).
   - Ligne heure (`display:flex; align-items:center; gap:18px; flex-wrap:wrap`) :
     - « **17:30** » **52px / 600**, line-height 1, letter-spacing −0.03em, `#6A3EE0` + « – 18:30 » 20px/400 `#64626E` (gap 8, alignés sur la ligne de base).
     - séparateur vertical 1×22.
     - icône `map-pin` 15 + « Salle de sport » 14.5px/400 (gap 7).
     - séparateur vertical 1×22.
     - icône `clock` 15 + « 1 h » 14.5px/400.
3. **Bouton « Écrire »** : aligné à gauche, h **40**, padding 0 16px, radius 11, fond blanc, contour `rgba(22,18,40,.14)`, icône `message-circle` 15 + texte 14px/500, gap 8.

**Colonne droite (280 px) — encadré Sportif**, aligné en **haut** avec le titre :
- radius 16, padding 16, contour `inset 0 0 0 1px rgba(22,18,40,.09)`, fond blanc, `gap:12px`, cliquable (→ fiche sportif). Survol : contour `rgba(139,92,246,.45)`.
- Label « Sportif » 13px/500 `#64626E`.
- Ligne (gap 12) : avatar **42×42** · nom « Lucas Janssens » 15px/600 (`flex:1`) · chevron 15 `#8B8996`.

### 2.4 Rangée de 2 colonnes
```
display:grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap:16px; align-items:stretch;
```
Les deux colonnes ont **toujours la même hauteur** : la carte « Prochaines dates » s'étire jusqu'au bas de « Détails » (et inversement).

**Colonne gauche** (`flex column; gap:16px`) :

**a) Prix et paiements** — padding 22, gap 10
- Titre 17px/600, letter-spacing −0.01em.
- Texte 14px/400, line-height 1.55, `#4A4855` : « Pas de prix pour cette séance. Ajoute-le avec « Modifier » : chaque date payée comptera dans l'encaissé de la semaine. »
- (Si un prix existe : afficher le montant et l'état payé ou non, avec le même style de ligne que Détails.)

**b) Détails** — `flex:1` (pour l'alignement bas), padding `22px 22px 18px`, gap 4
- Titre 17px/600.
- Ligne « Rythme » : grid `150px minmax(0,1fr)`, gap 12, padding `12px 0`, séparateur bas. Label 14px/400 `#64626E`, valeur 14.5px/500, line-height 1.45 → « Chaque lundi à 17:30 · 1 h ».
- Ligne « Période » : même grid, padding `12px 0 4px`, sans séparateur. Valeur : « Depuis le 7 septembre 2026, jusqu'au 17 janvier 2027 », puis (gap 10) :
  - **Barre de série** : `display:flex; gap:2px`, **un segment par occurrence** (ici 19), `flex:1; height:6px; border-radius:2px`. Couleurs : passées `#D9D2F2`, séance affichée `#8B5CF6`, à venir `#ECEBF1`.
  - Légende 12.5px/400 `#64626E` : « Séance 9 sur 19 » (index calculé = rang de cette date dans la série).
  - Séance non récurrente → masquer Rythme / Période et la barre.

**Colonne droite — Prochaines dates** — padding `22px 22px 10px`, gap 6
- En-tête (`space-between; gap:12px`) : titre 17px/600 (nowrap) + lien « Toutes les dates » 13px/400 `#6A3EE0` (nowrap).
- **Timeline** : 4 prochaines dates. Chaque ligne = grid `22px minmax(0,1fr) auto`, `column-gap:14px`, cliquable (survol fond `#FAF9FC`) :
  - Col. 1 : rail. Trait vertical 2px `#E6E1F7` à `left:10px`. Il commence au centre du 1er point (`top:28px` sur la 1re ligne) et s'arrête au centre du dernier (`bottom: calc(100% − 28px)` sur la dernière). Point 10×10 rond, fond blanc, anneau `inset 0 0 0 2.5px #B9A3FF`, `margin-top:24px`.
  - Col. 2 : padding `13px 0`, gap 2 → « Lundi 9 novembre » 15px/500 + « 17:30 – 18:30 » 13px/400 `#64626E`. Séparateur bas `1px rgba(22,18,40,.07)` sauf la dernière.
  - Col. 3 : chevron 15, même séparateur bas.

### 2.5 Barre d'actions (carte pleine largeur, en bas)
- padding `14px 22px`, `display:flex; align-items:center; gap:16px`.
- Texte (`flex:1`) 13.5px/400 `#64626E` : « Les changements s'appliquent à cette date ou à toute la série. »
- **Modifier** : h 42, padding 0 22px, radius 11, outline (`rgba(22,18,40,.14)`), icône crayon 15 + 14px/500.
- **Supprimer la séance** : h 42, padding 0 14px, sans fond, texte et icône `#D4223D` 14px/500 → ouvre la confirmation existante.

### 2.6 Responsive desktop
- 1024 → 1280 : même structure ; la colonne Sportif garde 280 px, le reste se contracte.
- > 1440 : zone principale limitée à `max-width: 1180px` (optionnel, à aligner sur les autres pages).

---

## 3. MOBILE (1e) — largeur de référence 390 px

### 3.1 Coquille (inchangée)
- Fond `#F3F2F7`.
- **Barre du haut existante** (padding `10px 12px 0`) : bouton menu 44×44 radius 14 à gauche ; à droite groupe blanc radius 16 (padding 4, gap 4) = bouton Assistant IA 40×40 violet radius 12 + cloche 40×40 avec badge 15 px. → **inchangée**.
- Contenu : padding `14px 14px 120px` (120 = place de la barre fixe), `display:flex; flex-direction:column; gap:12px`.

### 3.2 Lien retour
- padding `0 4px` ; icône `arrow-left` 14 + « Agenda » 13.5px/400 `#64626E`, gap 6.

### 3.3 Carte héro
- radius 20, padding **20**, gap **16**, fond blanc, contour `.05`.
1. **Titre** (gap 6) : H1 « Coaching hybride » **24px/600**, line-height 1.15, letter-spacing −0.025em · point 8×8 + « Hybride · Individuelle » 14px/400 `#4A4855` (gap 7).
2. **Bloc horaire** (gap 6) :
   - Ligne date : icône `calendar` 15 + « Lundi 2 novembre » 14px/500 + pastille « Aujourd'hui » (mêmes specs que desktop), gap 8.
   - Heure (`white-space:nowrap`, gap 8, baseline) : « 17:30 » **46px/600** `#6A3EE0`, line-height 1, letter-spacing −0.03em + « – 18:30 » **19px/400** `#64626E`.
   - Méta (gap 14, padding-top 4, 14px/400) : `map-pin` 15 + « Salle de sport » · séparateur 1×18 · `clock` 15 + « 1 h » (chaque item en nowrap).
3. **Encadré Sportif** : radius 16, padding 14, contour `.09`, gap 10 · label « Sportif » 13px/500 `#64626E` · ligne (min-height 44, gap 12) : avatar **40×40** + nom 15px/600 (`flex:1`) + chevron 15.
   - Pas de bouton « Écrire » ici : il est dans la barre fixe du bas.

### 3.4 Carte « Détails »
- radius 20, padding `18px 18px 14px`, gap 2.
- Titre 16px/600, letter-spacing −0.01em.
- Lignes : grid **`76px minmax(0,1fr)`**, gap 12. Label 13.5px/400 `#64626E`, valeur 14px/500, line-height 1.45.
  - Rythme : padding `12px 0` + séparateur bas.
  - Période : padding `12px 0 4px`, valeur + (gap 10) barre de série (segments h 6, gap 2, radius 2) + « Séance 9 sur 19 » 12.5px.

### 3.5 Carte « Prochaines dates »
- radius 20, padding `18px 18px 6px`, gap 4.
- En-tête `space-between; gap:12px` : titre 16px/600 (nowrap) + « Toutes les dates » 13px `#6A3EE0` (nowrap).
- Timeline : mêmes règles que le desktop, avec ces écarts : `column-gap:10px`, point `margin-top:20px`, padding de ligne `11px 0`, date **14.5px/500** (nowrap), horaire 13px.

### 3.6 Carte « Prix et paiements » — **dernière carte**
- radius 20, padding 18, gap 8.
- Titre 16px/600 · texte 13.5px/400, line-height 1.55, `#4A4855`.

### 3.7 Lien « Supprimer la séance »
- Centré (`align-self:center`), min-height 44, gap 8, icône corbeille 15 + texte 14px/500 `#D4223D`.

### 3.8 Barre d'actions fixe (bas d'écran)
```
position:fixed; left:0; right:0; bottom:0;
padding: 12px 14px calc(14px + env(safe-area-inset-bottom));
background: rgba(243,242,247,.92); backdrop-filter: blur(12px);
border-top: 1px solid rgba(22,18,40,.06);
display:grid; grid-template-columns:1fr 1fr; gap:10px;
```
- **Écrire** : h **50**, radius **13**, fond blanc, contour `rgba(22,18,40,.14)`, icône `message-circle` 16 + 15px/500, gap 8.
- **Modifier** : h **50**, radius **13**, fond `#17151D`, texte blanc, icône crayon 16 + 15px/500.

### 3.9 Ordre mobile (résumé)
Barre du haut → ← Agenda → **Héro (titre, date, heure, lieu/durée, sportif)** → **Détails** → **Prochaines dates** → **Prix et paiements** → Supprimer → *(barre fixe : Écrire · Modifier)*

---

## 4. Ce qui a été ajouté par rapport à l'ancienne page

| Ajout | Où | Règle |
|---|---|---|
| Grand titre + discipline dans une **carte héro** | D + M | Le titre du header desktop passe en 15px pour éviter la redite. |
| Pastille **« Aujourd'hui »** | D + M | Visible seulement si la date est aujourd'hui. |
| Lieu et durée **sur la ligne de l'heure** (desktop) / sous l'heure (mobile), séparés par des traits | D + M | Remplacent les anciennes lignes empilées. |
| **Encadré Sportif** dans la carte héro | D + M | Remplace la carte « Sportif » séparée. |
| **Barre de série** + « Séance X sur N » | D + M | Calculée à partir de la récurrence. |
| **Timeline** sur les prochaines dates + lien « Toutes les dates » | D + M | 4 dates max. |
| **Barre d'actions** en bas (Modifier + Supprimer + phrase d'aide) | D | Le bouton Modifier du header reste aussi. |
| **Barre fixe** Écrire + Modifier | M | Remplace les boutons en bas de page. |
| Hauteurs égales des 2 colonnes | D | `align-items:stretch` + `flex:1` sur Détails. |

---

## 5. États à gérer

- **Séance non récurrente** : pas de Rythme / Période ni de barre de série ; la carte « Prochaines dates » est masquée (desktop : Prix + Détails passent en pleine largeur, ou en 2 colonnes Prix | Détails).
- **Séance passée** : pas de pastille ; l'heure reste en `#6A3EE0`.
- **Séance collective** : l'encadré Sportif devient « Participants (n) » avec des avatars empilés (32 px, chevauchement −8 px) et un chevron.
- **Prix renseigné** : afficher le montant (15px/600) et le statut (Payé / En attente) dans la carte Prix.
- **Chargement** : squelettes aux mêmes dimensions que les cartes.

---

## 6. Checklist pixel-perfect

- [ ] Superposer la page à `reference-seance-desktop-1a.png` (1280 px, zoom 50 %) : écart ≤ 2 px.
- [ ] Superposer la page à `reference-seance-mobile-1e.png` (390 px, zoom 33 %) : écart ≤ 2 px.
- [ ] Desktop : l'encadré Sportif est aligné en haut avec le titre ; les bas de « Détails » et « Prochaines dates » sont alignés.
- [ ] Mobile : « 17:30 – 18:30 » ne passe jamais à la ligne ; la barre fixe ne masque pas « Supprimer » (padding bas 120 px).
- [ ] Aucun dégradé, aucune nouvelle couleur, police inchangée.
- [ ] Tous les éléments cliquables mobiles font au moins 44 px de haut.
- [ ] Logique existante intacte.
