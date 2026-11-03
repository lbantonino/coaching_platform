# 2h — Fiche sportif · Disponibilités

## A. Identification
| | |
|---|---|
| Fiche | 2h |
| Nom | Fiche sportif · Disponibilités |
| Objectif | Saisir le temps disponible du sportif. |
| Utilisateur | Coach |
| Route existante | `?onglet=disponibilites` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Depuis 2a. |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête de fiche + onglets (onglet courant actif).
2. Carte « Disponibilités » + « Le temps dont le sportif dispose. Ce sont des repères pour construire son programme, pas une prescription. » : Séances par semaine · Durée maximale d’une séance (min) · Jours disponibles (pastilles « ✓ Lundi » … « Dimanche ») · Contraintes d’organisation (textarea) · « Enregistrer les disponibilités ».

## E. Contenu exact (libellés de la maquette)
Disponibilités · Séances par semaine · Durée maximale d’une séance (min) · Jours disponibles · Lundi … Dimanche · Contraintes d’organisation · Enregistrer les disponibilités.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
