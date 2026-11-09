# Design system — Programmes (EXACT, extrait du code)

Toutes les valeurs proviennent du code source des maquettes (`13_HTML_PREVIEWS/source`). Statut **EXACT** sauf mention PROPOSED.

## 1. Règles du client (non négociables)
- **Noir & blanc + violet**. Les couleurs de discipline n'apparaissent que sur les séances, repères et pastilles.
- **Aucun graphique de séance** : ni barres de déroulé, ni courbes, ni aperçu en barres. Le contenu est écrit.
- **Une info = une ligne** : « 20 min @ 6:00 », « 5 × 4 min @ 4:55 », « récup 1:45 ». Si c'est trop long : 2 lignes **sémantiques** (jamais un retour à la ligne automatique). `white-space:nowrap; overflow:hidden; text-overflow:ellipsis` en sécurité.
- **Menus déroulants** (bouton + chevron) plutôt que des rangées de 4 boutons ou plus.
- Retour arrière : flèche + **nom du panneau précédent** (« ← Programmes », « ← Semaines »).
- Pas de dégradés décoratifs, pas d'emoji, pas de nouvelles couleurs.

## 2. Couleurs (`colors.json`, `tokens.css`)
| Rôle | Valeur |
|---|---|
| Texte principal | #17151d |
| Texte secondaire | #4a4855 · #64626e · tertiaire #8a8896 · désactivé #c9c7d1 / #d6d4dd |
| Fond app | #f3f2f7 · cartes #ffffff · fond doux #f6f5fa · piste de segmenté #e8e7ee |
| Bordures | inputs rgba(22,18,40,.12) · cartes rgba(22,18,40,.08) · séparateurs #f0eff4 · PDF #dcdae3 |
| Violet | #8b5cf6 (fond bouton IA, accent, sélection) · texte #6a3ee0 · fond sélection #f1edfc · 12 % / 10 % pour badges |
| Running | #7776FF · texte #4f4ed6 |
| Musculation | #DD2D4A · texte #b51f39 |
| Hyrox | #FEC14F · texte #8a6200 · texte posé sur fond Hyrox plein : #17151d |
| Hybride | #26CBB8 (officielle, usage marginal) |
| Danger / Succès | #b51f39 / #1f9d55 |
| Voile modale | rgba(22,18,40,.32) desktop · .34 mobile |

Teintes : `color-mix(in srgb, COULEUR N%, #fff)` — 14 % cartes agenda et en-têtes PDF Running/Musculation, 24 % en-tête PDF Hyrox, 45 % bordure PDF Running/Musculation, 70 % bordure PDF Hyrox, 9 % groupes d'éditeur.

## 3. Typographie (`typography.json`)
Famille unique **Plus Jakarta Sans** (400, 500, 600, 700, 800).
| Style | Taille / graisse / interligne / interlettrage |
|---|---|
| Titre page mobile | 24 / 700 / 1.15 / -0.02em |
| Titre assistant desktop, titre séance | 26 / 700 / 1.15–1.2 / -0.025em |
| Titre programme (bandeau) | 19 / 600 / -0.015em |
| Titre panneau | 19 / 700 / 1.2 / -0.015em ; grand 21 / 700 |
| Titre section (semaine) | 17 / 600 |
| Titre carte | 16.5 / 600 / 1.25 (mobile 16) |
| Nom séance | 15 / 600 (mobile 16) |
| Corps | 14 / 400 / 1.5 · 13.5 / 400 / 1.55 |
| Méta | 13 / 400 #64626e |
| Légende | 12.5 / 400 · 12 / 400 |
| Kicker | 11.5 / 600 / MAJ / +0.05em #8a8896 |
| Libellé phase | 11 / 600 / MAJ / +0.06em |
| Navigation | 13.5 / 500 |
| Bouton desktop | 12.5 / 600, hauteur 32 |
| Bouton mobile | 14–15 / 600, hauteur 44–52 |
| Input | 15–16 / 500, hauteur 44–46 (16 px minimum sur mobile) |
| PDF H1 / kicker / corps / pied | 30/800/-0.03em · 10/800/MAJ/+0.07em · 11–11.5 · 10 |

## 4. Layout (`spacing.json`)
- Desktop : cadre 1280, padding 14, sidebar **236** (padding 24/14/16, items 36), gap sidebar↔contenu **20**, gap vertical **12**, header **64** (radius 20, padding 0 16 0 20).
- Éditeur de programme : grille **196px / 1fr / 304px**, gap 12. Éditeur de séance : **1fr / 340px**, gap 12. Liste programmes : 3 colonnes, gap 12.
- Mobile : 390 × 844, contenu padding 20 / 14 / 110–130 (espace pour FAB ou barre d'action), gap 12, FAB 60 radius 18 à 14 / 28 du bord, feuille du bas inset 8 radius 30 poignée 38 × 5, barre d'action du bas padding 12 14 30 boutons 52.
- PDF : page 620 × 877 CSS (A4 portrait), padding 28 36 18.

## 5. Arrondis (`radii.json`) et ombres (`shadows.json`)
Rayons 3 · 4 · 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 18 · 20 · 22 · 30 · pilule = hauteur/2.
Les cadres « appareil » (rayon 18/40 + grande ombre) sont **la planche, pas l'app**.

## 6. États
| État | Rendu (EXACT) |
|---|---|
| Carte séance sélectionnée | anneau 1.5 px rgba(139,92,246,.55) + 0 10px 24px -16px |
| Étape sélectionnée (éditeurs) | anneau 1.5 px #8b5cf6 + 0 8px 20px -12px violet |
| Option choisie (cartes radio) | anneau 1.5 px #17151d |
| Chip / jour / toggle actif | fond #17151d, texte #fff |
| Segment actif | fond #fff + 0 1px 2px rgba(22,18,40,.10) ; inactif #64626e |
| Input actif | anneau 1.5 px #8b5cf6 |
| Désactivé | texte #c9c7d1, contour #ecebf1 ; jour indisponible : fond #f6f5fa + chiffre barré |
| Verrouillé (séance avec coach) | cadenas + fond rgba(139,92,246,.10), texte #6a3ee0 |
| Hover (PROPOSED) | fond #f6f5fa sur items ; bouton noir → #2a2733 |
| Focus clavier (PROPOSED) | outline 2px #8b5cf6, offset 2px |
