# 2a — Fiche sportif · Vue d’ensemble

## A. Identification
| | |
|---|---|
| Fiche | 2a |
| Nom | Fiche sportif · Vue d’ensemble |
| Objectif | Synthèse du sportif en un écran. |
| Utilisateur | Coach |
| Route existante | `/coach/sportifs/:id` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Cartes → onglets 2b, 2c, 2g, 2f, 2h, 2i, 2k. |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête de fiche + onglets (Vue d’ensemble actif).
2. **Grille 2 colonnes** (`repeat(2,minmax(0,1fr))`, gap 16) :
   - L1 : **Profil du sportif** [Modifier] (lignes clé/valeur : Nom complet, Sexe, E-mail, Téléphone, Niveau, Expérience, Lieux, Matériel) | **Prochaines séances** [Agenda] (liste : jour + heure à gauche, point discipline + titre + méta ; 1ʳᵉ ligne « Aujourd’hui » mise en avant en violet clair).
   - L2 : **Repères et mesures** [Modifier] (2 sous-cartes repère : Race pace (Hyrox) jaune, Charge de référence rouge) | **Objectif actuel** [Modifier] (sous-carte : badges Hyrox, Principal, J-137 ; titre, date, détails ; lien « 1 autre objectif en cours »).
   - L3 : **Disponibilités et contraintes** [Modifier] (« Jours disponibles · 5 séances, 90 min max », 7 ronds L M M J V S D — disponibles teintés violet ; lignes Organisation, Points d’attention) | **Notes du coach** [Modifier] (sous-carte texte + « Notes libres · mises à jour le … »).
3. **Historique récent** pleine largeur [Voir tout] : timeline (icône ronde, titre fort, détail, date à droite).

## E. Contenu exact (libellés de la maquette)
Profil du sportif · Modifier · Nom complet · Sexe · E-mail · Téléphone · Non renseigné · Niveau · Expérience · Lieux · Matériel · Prochaines séances · Agenda · Aujourd’hui · Avec le coach · Collective · Compétition · Journée · Repères et mesures · Race pace (Hyrox) · min/km · Charge de référence · reps · Objectif actuel · Principal · J-137 · 1 autre objectif en cours · Disponibilités et contraintes · Jours disponibles · Organisation · Points d’attention · Notes du coach · Notes libres · Historique récent · Voir tout · Performance ajoutée · Mesure ajoutée.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
