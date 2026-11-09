# 02 · Créer un programme — spécifications (WIZ-01 à WIZ-05)

Sources : `CooryProgEcrans.dc.html` (cadre) + `CooryProgEtape.dc.html` (contenu d'étape, prop `mobile`). **EXACT**.

## Desktop 1280 × 820 (WIZ-01, interactif : clic sur une étape ou « Continuer »)
| Élément | Style |
|---|---|
| Header | « ← Programmes · Nouveau programme » |
| Section assistant | flex, r20, blanc, overflow hidden |
| Colonne étapes | 250 px, padding 24 18, bordure droite 1 px #f0eff4 ; titre « Nouveau programme » 17/600 ; 4 étapes 56 haut r12 : rond 28 (fait ✓ noir · actif violet #8b5cf6 · à venir contour .16) + libellé 14/600 + sous-libellé 12 #8a8896 ; étape active fond #f1edfc |
| Zone contenu | padding 28 36, max-width 620 ; « ÉTAPE n SUR 4 » 12/600 MAJ #8a8896 + titre 26/700 |
| Pied | padding 16 36, bordure haute ; « Retour » contour 44 (désactivé #c9c7d1 à l'étape 1) ; « Continuer → » noir 44 (« Créer le brouillon » à l'étape 4) |

## Mobile 390 × 844 (WIZ-02 à 05)
Header « ← Programmes » (16/500 #64626e) · progression 4 barres 5 px (violet = faite / en cours, #dcdae3 sinon) · « ÉTAPE n SUR 4 · LIBELLÉ » 12/600 · titre 24/700 · contenu dans carte r22 padding 18 · barre du bas fixe : « Retour » 110 × 52 + action noire 52 flex 1, fond dégradé vers #f3f2f7 (fonction de lisibilité, pas décoratif).

## Contenu des étapes
| Étape | Champs (dans l'ordre) |
|---|---|
| 1 · Pour qui | « Sportif » : recherche 46 + liste radio (avatar 34, nom 14.5/600, discipline 12.5 avec pastille ; sélection fond #f8f6fe + rond noir) · « Titre du programme » input 46 (actif anneau violet) |
| 2 · Objectif | « Discipline principale » 3 cartes 84 haut (Running, Musculation, Hyrox ; choisie anneau noir 1.5) + note « Hybride arrivera plus tard » · bloc fond #f6f5fa r14 : « Objectif de course » + toggle, nom de course + date (2 inputs 44), **Catégorie : select « Open Femme ▾ »** · **Façon de viser par défaut** : sous-texte « Pré-choisie d'après les repères d'Inès. Modifiable séance par séance. » + 2 lignes (pastille + Running 130 px / segmenté « Allure | Zones de FC » ; Musculation / « kg | % du max ») · Note (facultatif) |
| 3 · Calendrier | Date de début (input avec icône calendrier) + Nombre de semaines (stepper − 12 +) · « Se termine le … » 12.5 · Séances par semaine 1–7 (7 boutons 44, choisi noir) · **Phases (facultatif)** + lien « Le faire plus tard » : 3 cases 50 haut proportionnelles aux semaines (Base S1–4 flex 4, Spécifique S5–9 flex 5, Affûtage S10–12 flex 3) + bouton « + » 50 · Organisation de la semaine : 2 cartes radio « Dans l'ordre, sans jour » (défaut) / « Un jour fixe par séance » |
| 4 · Point de départ | 3 cartes (desktop 3 colonnes, mobile 1) : Partir de zéro · Copier un programme précédent (choisi) · **Partir d'un modèle** · sélecteur du programme source · « Aperçu » : grille semaines × séances (cellules 14 px desktop / 12 px mobile, couleur de discipline, #e6e4ec = à remplir) + légende |

Note : la grille « Aperçu » de l'étape 4 est un **plan de remplissage**, pas un graphique de séance ; elle reste autorisée.
