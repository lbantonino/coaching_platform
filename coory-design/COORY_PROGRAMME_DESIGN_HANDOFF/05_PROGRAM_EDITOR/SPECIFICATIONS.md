# 03 · Éditeur de programme + 03b · Jours fixes — spécifications

Sources : `Coory Programmes.dc.html` (EDT), `CooryJoursFixes.dc.html`, `CooryJourPicker.dc.html`, `CooryJourPropose.dc.html` (FIX). **EXACT**.

## EDT-01 Desktop 1280 × 860 (interactif : semaine, séance)
| Élément | Position / style |
|---|---|
| Header | « ← Programmes · Prépa HYROX Gand » · Assistant IA · cloche (pastille 9) · **Publier** noir |
| Bandeau programme | flex none, r20, padding 16 18 16 20, gap 14 : avatar 46 · titre 19/600 + pilule discipline · méta 13 · pilule état « Publié v1 · ● Modifications non publiées » (#f6f5fa) · Aperçu · PDF · ··· (32) |
| Menu ··· ouvert | absolu right 18 top 58, 260 large, r14, padding 6, ombre popover ; items 38 : **Enregistrer comme modèle** (fond #f1edfc), Dupliquer le programme, Renommer, Archiver (#b51f39) |
| Grille | 196 / 1fr / 304, gap 12, hauteur restante |
| Colonne Semaines | r20, padding 14 10 ; titre « Semaines 12 » ; **phase** « BASE · S1–4 » 11/600 MAJ #8a8896 + ··· ; semaine 36 haut r10 (active #f1edfc 600 ; point violet 6 = en cours ; pilule « allégée ») ; pied « + Semaine » « + Phase » (30, #6a3ee0) |
| Colonne Semaine | r20 padding 18 ; « Semaine 2 » 17/600 + « En cours » (violet 10 %) + phase (#f3f2f7) ; « 2 – 8 nov. · 4 séances · dans l'ordre, sans jour fixe » ; Dupliquer + ··· ; cartes séance r15 padding 14 12 14 8 : poignée · « SÉANCE n » kicker · pastille + nom 15/600 · « Running · Endurance » · résumé 12.5 + badge « Avec le coach · Sam 7 · 10:00 » · flèches ↑ ↓ (28 × 24, désactivées #d6d4dd) ; sélectionnée = anneau violet ; pied : « + Ajouter une séance » et « Depuis un modèle » (2 boutons 48 contour 1.5) |
| Panneau séance | r20 padding 18 : kicker discipline · nom 21/700 · type · 2 stats (#f6f5fa r12) · blocs (r12, barre 3 px couleur discipline ou #c9c7d1, titre + durée 13.5/600, détail 12.5) · bas : « Modifier la séance » noir 40 + copier + supprimer (rouge) |

## EDT-02 Desktop · modèle Coory (lecture seule)
Mêmes dimensions. Différences : fil d'Ariane « ← Modèles », titre « Prépa Hyrox · 12 semaines », icône document violette au lieu de l'avatar, pilule « Coory · 🔒 Lecture seule », bouton principal **« Dupliquer dans Mes modèles »**, semaines sans dates (« 4 séances »), pas de ··· de phase, pas de + Semaine / + Phase, pas de Dupliquer, pas de poignées ni flèches, pas d'ajout de séance ; panneau : bandeau « 🔒 Duplique le modèle pour le modifier ».

## EDT-03 à 05 Mobile (pile de navigation)
1. **Semaines** (« ← Programmes ») : titre 24/700, méta, pilules (Hyrox, Publié v1, Non publié) ; Publier / Aperçu / ··· (44) ; libellé de phase « BASE · SEMAINES 1 À 4 » + ··· ; cartes semaine r20 (en cours = anneau violet) avec liste des séances (34 haut).
2. **Une semaine** (« ← Semaines ») : titre, « Dupliquer vers… » + ··· ; cartes séance r18 avec flèches 44 × 40 ; FAB « + ».
3. **Une séance** (« ← Semaine 2 ») : kicker, nom 24/700, résumé écrit ; carte stats + blocs ; « Modifier la séance » 48 + ···.

## 03b · Fixer les jours (FIX-01 à 05)
| Écran | Contenu |
|---|---|
| FIX-01 Desktop modale | voile .32 ; carte 540 r22 padding 26 : « Fixer les jours · semaine 2 » 21/700, sous-texte ; **disponibilités** 7 cases 46 (indispo #f6f5fa gris, coach violet 12 %, dispo vert 10 %) ; liste des 4 séances (rond numéroté couleur discipline 26, nom, raison 12, sélecteur jour 38 « Mar 3 ▾ » ; coach « Sam 7 · 10:00 🔒 » fond #f6f5fa) ; « Appliquer à » chips (Cette semaine / Phase Base · S1–4 [actif] / Tout le programme) + règle « les semaines passées ne changent pas » ; « Fixer les jours » noir + « Garder dans l'ordre » |
| FIX-02 Desktop éditeur | colonne Semaines : icône calendrier violette sur S1–S4 + légende « Violet = jours fixes » ; colonne Semaine : segmenté **« Dans l'ordre | Jours fixes »** (actif Jours fixes) ; **bandeau 7 jours** (grille 7, gap 5, cases ≥82 r12 : jour + pastille « S1 » couleur discipline 24 haut + heure coach ; « Repos » contour ; « Indisponible » hachuré ; séance sélectionnée anneau violet) ; texte d'aide ; cartes séance avec **pavé jour 62 × 56** (« MER / 4 ▾ », noir si sélectionnée, violet + 🔒 pour le coach) ; panneau droit = **CooryJourPicker compact** |
| FIX-03 Mobile semaine | segmenté pleine largeur ; mini-bandeau 7 colonnes (lettre, date, carré 26 × 22 couleur avec n°) ; cartes avec pavé jour 58 × 58 |
| FIX-04 Mobile proposition | feuille du bas avec CooryJourPropose mobile (boutons empilés 48) |
| FIX-05 Mobile choisir le jour | feuille avec CooryJourPicker complet |

**CooryJourPicker** : en-tête séance · « Jour de la séance » 7 boutons (62 haut, 52 en compact) : choisi noir + « S2 », pris « S1/S3/S4 » violet, indisponible barré · aide (complet seulement) · option radio « Sans jour · Dans l'ordre, au choix d'Inès » · Heure (complet seulement, select « Pas d'heure ») · « Appliquer ce jour à » 3 radios (Cette semaine / Toute la phase Base [choisi] / Tout le programme) · toggle « Inès peut déplacer la séance · Dans la même semaine. Tu reçois une notification. » · Valider / Annuler.
