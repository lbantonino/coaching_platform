# Coory — Design System v2 « Graphite & Or »

> **À donner à Claude Code** pour redesigner toute l'application Coory (coach, sportif, admin) dans le style du nouveau tableau de bord.
> **Références visuelles qui font foi** (dans ce dossier) :
> - `reference-dashboard-desktop.png` — tableau de bord coach, 1440 px
> - `reference-dashboard-mobile.png` — tableau de bord coach, 390 px
> - Source HTML : `Coory App v2.dc.html` (ouvrir dans un navigateur pour inspecter les valeurs exactes)
>
> Ce document **remplace** les anciens design systems (rouge vif, jaune, noir pur). Garde toute la logique métier existante : tu changes uniquement la présentation.

---

## 1. Principes

1. **Graphite, pas noir.** Fond gris anthracite légèrement chaud, cartes un ton au-dessus. Jamais de `#000`.
2. **Monochrome d'abord.** L'interface est en gris et blanc chaud. La couleur est **rare et significative**.
3. **L'or est la signature Coory.** Discret mais présent sur chaque écran : logo, élément actif, action principale, « aujourd'hui / maintenant ». Jamais en grande surface.
4. **Les couleurs de discipline** (Running, Musculation, Hyrox, Hybride) apparaissent **uniquement** dans : les cases de séance de l'agenda, les badges de discipline, les petites barres de liste, les barres de progression des programmes.
5. **Aplats.** Pas de dégradé, pas d'ombre portée, pas de liseré gauche coloré sur les cartes ou les séances, pas d'emoji.
6. **Dense et calme**, façon Linear : textes 12–14 px, bordures fines, beaucoup d'alignement, peu d'effets.
7. **Mobile first**, cibles tactiles ≥ 44 px, texte ≥ 4,5:1 de contraste.

---

## 2. Couleurs

### 2.1 Neutres

| Jeton | Valeur | Usage |
|---|---|---|
| `--page` | `#0c0d0f` | Derrière l'app (hors cadre) |
| `--bg` | `#141518` | Fond de l'application |
| `--topbar` | `#17181b` | Barre de navigation du haut |
| `--card` | `#1b1c20` | Cartes, panneaux, agenda |
| `--card-hover` | `#212226` | Survol de ligne dans une carte |
| `--field` | `#1d1e22` | Champs, recherche |
| `--chip` | `#25262b` | Badges neutres, case de séance en style neutre |
| `--avatar` | `#2a2b30` | Avatars à initiales, piste des barres de progression, filtre actif |
| `--bar-idle` | `#34363c` | Barres de graphique inactives |
| `--line` | `rgba(255,255,255,.07)` | Bordure des cartes |
| `--line-soft` | `rgba(255,255,255,.05–.06)` | Séparateurs internes, grille de l'agenda |
| `--line-strong` | `rgba(255,255,255,.09–.12)` | Bordure des boutons secondaires, champs |
| `--text` | `#f5f5f2` | Texte principal (blanc chaud) |
| `--text-2` | `#e6e6e3` / `#c8c9cc` | Texte de bouton secondaire, icônes |
| `--muted` | `#9a9ca3` | Texte secondaire, libellés, heures |
| `--checkbox` | `#55575e` | Contour de case à cocher vide |

### 2.2 Or — couleur de marque

| Jeton | Valeur | Usage |
|---|---|---|
| `--gold` | `#e2c47a` | Couleur Coory |
| `--gold-line` | `color-mix(in srgb, #e2c47a 38%, transparent)` | Contour de la carte « Prochaine séance », anneau de l'avatar |
| `--gold-soft` | `color-mix(in srgb, #e2c47a 9%, transparent)` | Fond de l'en-tête du jour actuel |
| `--gold-surface` | `#1d1c19` | Fond de la carte « Prochaine séance » |
| `--on-gold` | `#141518` | Texte sur fond or |

**Où mettre l'or (liste exhaustive) :**
- boucle ∞ du logo ;
- onglet actif de la navigation : soulignement de 2 px ;
- **bouton principal** « Créer » et les CTA primaires (fond or, texte `--on-gold`) — **un seul par écran** ;
- surtitre de date au-dessus du H1 (« Jeudi 29 octobre · semaine 44 ») ;
- carte « Prochaine séance » : contour + libellé ;
- agenda : trait de 2 px en haut de l'en-tête du jour actuel, texte du jour, fond `--gold-soft`, ligne « maintenant » de 1,5 px et pastille de 8 px ;
- heure de la prochaine séance dans la liste « Aujourd'hui » ;
- dernière barre (période en cours) des graphiques, tendance « ↗ +12 % » ;
- case à cocher cochée (fond or, ✓ `--on-gold`) ;
- pastille de notification (6 px) ;
- anneau de l'avatar de l'utilisateur connecté.

**Interdit :** fonds de section en or, texte de paragraphe en or, icônes en or hors élément actif, or + couleur de discipline sur un même élément.

### 2.3 Disciplines

| Discipline | Couleur | Fond de case teinté |
|---|---|---|
| Running | `#7a9cf0` | `color-mix(in srgb, #7a9cf0 16%, #1b1c20)` |
| Musculation | `#a490ee` | `color-mix(in srgb, #a490ee 16%, #1b1c20)` |
| Hyrox | `#e0975f` | `color-mix(in srgb, #e0975f 16%, #1b1c20)` |
| Hybride | `#4fc2ae` | `color-mix(in srgb, #4fc2ae 16%, #1b1c20)` |

Badge de discipline : fond `color-mix(c 14%, transparent)`, texte = couleur éclaircie (ex. Musculation `#b9a9f3`), 12 px 500, padding 4×10, rayon 7.

### 2.4 Statuts (sobres)

- Succès / payé : `#4cc38a`
- Attention / en retard : `#f0a43c`
- Erreur / destructif : `#e5484d`

Affichés en **petit point de 6 px** ou en texte 12 px, jamais en grand fond.

---

## 3. Typographie

| Rôle | Police | Taille / graisse / interlettrage |
|---|---|---|
| Logo | Space Grotesk 700 | 22 px desktop, 20 px mobile, −0.03em |
| H1 de page | Space Grotesk 600 | **40 px** desktop / **30 px** mobile, lh 1.05, −0.04em, `nowrap` |
| Surtitre de date | Geist 500 | 13 px, or |
| Titre de carte | Space Grotesk 600 | 15–17 px, −0.01 à −0.02em |
| Grand chiffre (KPI) | Space Grotesk 600 | 30 px desktop / 22 px mobile, −0.035em, `tabular-nums` |
| Heure géante (prochaine séance) | Space Grotesk 600 | 44 px desktop / 36 px mobile, −0.04em |
| Numéro de jour (agenda) | Space Grotesk 600 | 18 px desktop / 16 px mobile |
| Texte UI | Geist 500 | 13–13.5 px (desktop), 14–15 px (mobile) |
| Texte secondaire | Geist 400 | 12–13 px, `--muted` |
| Heures, compteurs, « Sem. 6/12 », ⌘K | Geist Mono 400/500 | 10.5–12 px |

Google Fonts : `Space Grotesk:500,600,700`, `Geist:400,500,600`, `Geist Mono:400,500`.
Règle : tout libellé court dans un conteneur flex (titres, dates, en-têtes de jours, montants) en `white-space: nowrap`.

---

## 4. Espacements, rayons, bordures

- Échelle : 4 · 6 · 8 · 10 · 12 · 14 · 16 · 18 · 22 · 24 · 28 · 32. Toujours `flex`/`grid` + `gap`.
- Page desktop : padding 32 × 28, gap vertical 24 entre rangées.
- Page mobile : padding 14 × 16, gap 16.
- Rayons : 5 (case à cocher) · 7 (badge, case de séance) · 8–10 (boutons, champs) · 12 (bouton mobile) · **14 (KPI, carte programme)** · **16 (cartes principales)** · 18 (carte mobile) · 50 % (avatars).
- Bordure de carte : 1 px `--line`. Pas d'ombre.

---

## 5. Logo

`C` + boucle ∞ + `ry`, Space Grotesk 700. Boucle en SVG inline, trait or :

```html
<span class="logo">C<svg viewBox="-4 -4 1140 532" fill="none" aria-hidden="true"
  style="height:.532em;width:1.140em;vertical-align:-.018em;margin:0 -.018em 0 .042em">
  <path d="M390.6 108.8C440.4 150.6 510 166 566 166C622 166 691.6 150.6 741.4 108.8A200 200 0 1 1 741.4 415.2C691.6 373.4 622 358 566 358C510 358 440.4 373.4 390.6 415.2A200 200 0 1 1 390.6 108.8Z"
    stroke="var(--gold)" stroke-width="124" stroke-linejoin="round"/></svg>ry</span>
```

Lettres en `--text`, boucle en `--gold`. Sur fond clair : lettres `#141518`, boucle or ancien `#c9a24a`.

---

## 6. Composants

### Barre du haut (desktop ≥ 1024)
Hauteur 60, fond `--topbar`, bordure basse `--line`, padding 0 28, gap 28.
Logo · **onglets** (Tableau de bord, Sportifs, Programmes, Agenda, Séances, Facturation, Bibliothèque, Messages) — 13.5 px 500, padding 0 12, pleine hauteur ; inactif `--muted`, hover `--text`, **actif `--text` + soulignement or 2 px** (`box-shadow: inset 0 -2px 0 var(--gold)`) · espace · recherche 220×34 (fond `--field`, « Rechercher », ⌘K mono) · cloche 34×34 (pastille or) · avatar 34 (anneau or).
Les pages secondaires (Comptabilité, Tâches, Documents, Assistant IA, Paramètres, Notifications) passent par un menu « Plus » ou l'avatar.

### Barre du haut (mobile)
Barre d'état 44, puis barre 52 : logo 20 · espace · cloche 44×44 · **hamburger** 44×44. Le hamburger ouvre un panneau plein écran : `--bg`, liste des sections 16 px avec 52 px de hauteur, section active en `--text` + petit point or, autres en `--muted`.

### En-tête de page
Surtitre or 13 px (date ou contexte) · H1 40/30 · à droite (desktop) : bouton secondaire (« Assistant ») + **bouton principal or**. Sur mobile, le bouton principal passe en bas de page, pleine largeur, 50 px de haut.

### Boutons
| Type | Style |
|---|---|
| Principal | fond `--gold`, texte `--on-gold` 600 13.5 px, hauteur 38 (desktop) / 50 (mobile), rayon 10 / 12, icône + 14 px |
| Clair | fond `--text`, texte `--on-gold`, 600 — pour l'action d'une carte (« Ouvrir la séance ») |
| Secondaire | transparent, bordure 1 px `rgba(255,255,255,.1)`, texte `--text-2` 500 |
| Icône | 34×34 (desktop) / 44×44 (mobile), rayon 9, bordure `--line-strong` |
| Filtre | 30 px, padding 0 11, rayon 8, 12.5 px ; actif fond `--avatar` + bordure `rgba(255,255,255,.12)` + `--text` ; inactif transparent `--muted` |

### Carte KPI
Padding 18, rayon 14, fond `--card`, bordure `--line`, gap 12 : libellé 12.5 `--muted` · chiffre 30 Space Grotesk · précision 12.5 `--muted`. 4 colonnes en desktop, 2×2 en mobile (chiffre 22).

### Carte « Prochaine séance » (signature)
Fond `--gold-surface`, bordure 1 px `--gold-line`, rayon 16, padding 22, gap 16.
Ligne 1 : « Prochaine séance · dans 20 min » (or 12.5) + « 1 / 6 » mono à droite · Ligne 2 : heure géante + nom 17/600 + détail 13 `--muted` · badges (discipline + neutre) · boutons « Ouvrir la séance » (clair, flex 1, 40 px) + « Message » (secondaire). Largeur 440 desktop, pleine largeur mobile.

### Agenda (composant clé)
- Plage **06:00 → 22:00**, 16 heures visibles sans défilement vertical. Hauteur d'une heure : **42 px desktop**, **40 px mobile**.
- Carte `--card`, rayon 16. En-tête : « Agenda » 17 + résumé 13 `--muted` (« 26 oct. – 1 nov. · 30 séances · 31 h ») · filtres Toutes / Individuelles / Collectives · flèches précédent / suivant.
- Colonne des heures 52 px (40 mobile), mono 11 `--muted`.
- En-têtes de jours 56 px : « Lun · 6 h » (11.5 `--muted`, `nowrap`) au-dessus du numéro 18 px. **Jour actuel** : trait or de 2 px en haut, textes or, fond `--gold-soft`, colonne légèrement éclaircie `rgba(255,255,255,.02)`.
- Grille : `repeating-linear-gradient(to bottom, rgba(255,255,255,.05) 0 1px, transparent 1px 42px)`, séparateurs verticaux `--line-soft`.
- **Case de séance** : position absolue `top = (début − 6) × H + 1.5`, `height = durée × H − 3`, marges 3 px, **rayon 7**, **fond teinté de la discipline (16 %)**, **aucune bordure, aucun liseré gauche**, padding 5×8. Contenu : heure « 07:00 – 08:00 » mono 10.5 en couleur de discipline + nom 12/500 `--text` (ellipsis). Moins de 34 px de haut : une seule ligne « 09:00 Thomas Peeters ». Séance collective : préfixe « ◦ ».
- Ligne « maintenant » : 1,5 px or + pastille 8 px, uniquement sur la colonne du jour.
- Pied : légende (carré 8 px par discipline) + « 06:00 – 22:00 » mono.
- **Mobile** : colonnes de 112 px, 3 jours visibles, défilement horizontal, colonne des heures collante, ouverture positionnée sur la veille du jour actuel, libellé « Glisse pour changer de jour ».

### Liste « Aujourd'hui »
Ligne : heure mono 12 (`--gold` pour la prochaine, `--muted` sinon) · barre verticale 3×28 couleur de discipline (rayon 2) · nom 13/500 + détail 12 `--muted`. Hover `--card-hover`. Mobile : hauteur ≥ 54.

### Carte graphique (Encaissé)
Titre + période · montant 28 Space Grotesk (`nowrap`) + tendance or 12 · barres verticales gap 6, rayon 4, `--bar-idle`, **dernière barre or** · pied : alerte en `--muted` + action texte.

### Tâches
Case 17×17 rayon 5, contour `--checkbox` ; cochée : fond + contour or, ✓ `--on-gold`, libellé barré `--muted`. Toute la ligne est cliquable.

### Carte programme
Padding 16, rayon 14 : avatar 32 + nom 13.5/500 + sous-titre 12 (ellipsis) · discipline + « Sem. 6/12 » mono · barre 4 px, piste `--avatar`, remplissage couleur de discipline. Grille de 4 en desktop, liste en mobile.

### Avatar
Rond, fond `--avatar`, initiales Geist 600 11–12. Utilisateur connecté : anneau 1,5 px `--gold-line`.

### Champs de formulaire
Hauteur 40 (desktop) / 48 (mobile), rayon 10, fond `--field`, bordure `--line-strong`, texte 14 / 16 mobile. Focus : bordure `--gold`. Erreur : bordure + message 12 px `#e5484d` sous le champ. Libellé 13/500 au-dessus.

### Tableaux / listes (Sportifs, Factures, Documents…)
Carte `--card`, en-tête de colonnes 12/500 `--muted`, lignes 52 px séparées par `--line-soft`, hover `--card-hover`, sélection fond `--gold-soft`. Mobile : cartes empilées.

### Feuilles et fenêtres
Mobile : feuille du bas, rayon 20 20 0 0, fond `--card`, poignée 36×4 `--bar-idle`. Desktop : fenêtre centrée 560 px, rayon 16. Fond derrière : `rgba(8,9,10,.6)`. Action principale en or.

---

## 7. Mise en page du tableau de bord (à reproduire)

**Desktop 1440**
1. Barre du haut (onglets).
2. Rangée héro : à gauche, surtitre + H1 + boutons, puis **4 KPI** ; à droite, **carte Prochaine séance** (440 px).
3. Rangée principale : **Agenda** (flexible) + colonne de droite 340 px : Aujourd'hui · Encaissé · Tâches.
4. **Programmes en cours** : 4 cartes.

**Mobile 390**
Barre (logo, cloche, hamburger) → surtitre + H1 → carte Prochaine séance → KPI 2×2 → agenda 3 jours → liste Aujourd'hui → bouton « Créer » or pleine largeur.

---

## 8. Appliquer aux autres pages

- Même barre du haut, même en-tête (surtitre or + H1 + 1 bouton or).
- Contenu en cartes `--card` rayon 16, grilles 12 colonnes, gap 16–24.
- Les couleurs de discipline seulement là où il y a une séance ou un programme.
- Espace sportif : même langage ; barre du bas mobile (Aujourd'hui, Programme, Progression, Messages, Profil), onglet actif en `--text` + point or ; grande carte de séance du jour avec contour or et bouton or « Commencer ».
- Pages d'entrée (connexion, inscription) : fond `--bg`, panneau de marque `--card` avec le logo, un seul bouton or.

---

## 9. Jetons CSS prêts à coller

```css
:root{
  --page:#0c0d0f; --bg:#141518; --topbar:#17181b; --card:#1b1c20; --card-hover:#212226;
  --field:#1d1e22; --chip:#25262b; --avatar:#2a2b30; --bar-idle:#34363c; --checkbox:#55575e;
  --line:rgba(255,255,255,.07); --line-soft:rgba(255,255,255,.05); --line-strong:rgba(255,255,255,.10);
  --text:#f5f5f2; --text-2:#c8c9cc; --muted:#9a9ca3;
  --gold:#e2c47a; --gold-line:color-mix(in srgb,#e2c47a 38%,transparent);
  --gold-soft:color-mix(in srgb,#e2c47a 9%,transparent); --gold-surface:#1d1c19; --on-gold:#141518;
  --run:#7a9cf0; --mus:#a490ee; --hyr:#e0975f; --hyb:#4fc2ae;
  --ok:#4cc38a; --warn:#f0a43c; --danger:#e5484d;
  --fd:'Space Grotesk',system-ui,sans-serif; --fs:'Geist',system-ui,sans-serif; --fm:'Geist Mono',ui-monospace,monospace;
  --r-badge:7px; --r-btn:10px; --r-kpi:14px; --r-card:16px;
}
.session{ border-radius:var(--r-badge); background:color-mix(in srgb,var(--c) 16%,var(--card)); border:0; box-shadow:none; }
```

---

## 10. Checklist pour Claude Code

- [ ] Fond graphite `#141518`, cartes `#1b1c20`, aucun noir pur
- [ ] Or `#e2c47a` présent sur chaque écran, uniquement aux endroits du §2.2
- [ ] Un seul bouton or par écran
- [ ] Couleurs de discipline uniquement sur séances, badges, barres et progressions
- [ ] Cases de séance : fond teinté, **sans contour ni liseré gauche**
- [ ] Agenda 06:00–22:00, jour actuel marqué en or, ligne « maintenant » or
- [ ] Space Grotesk pour titres et chiffres, Geist pour l'UI, Geist Mono pour les heures
- [ ] Libellés courts en `nowrap`
- [ ] Desktop avec onglets en haut, mobile avec hamburger, testé à 390 et 1440 px
- [ ] Rendu comparé côte à côte avec `reference-dashboard-desktop.png` et `reference-dashboard-mobile.png`
- [ ] Logique métier inchangée
