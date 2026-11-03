# 2i — Fiche sportif · Notes

## A. Identification
| | |
|---|---|
| Fiche | 2i |
| Nom | Fiche sportif · Notes |
| Objectif | Blessures (avec accord santé), notes privées, message au sportif. |
| Utilisateur | Coach |
| Route existante | `?onglet=notes` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Depuis 2a « Notes du coach ». |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête de fiche + onglets (onglet courant actif).
2. **Blessures et points d’attention** (pleine largeur) : sous-titre ; bandeau vert bouclier « Accord en cours depuis le … · donné, noté par le coach (formulaire signé). » ; textarea ; « Enregistrer les blessures » (noir) + « Retirer l’accord » (contour) ; aide « Retirer l’accord à la demande du sportif efface ce qui a été noté. » ; accordéon « Historique de l’accord (1) ».
3. 2 colonnes : **Notes libres** (sous-titre, textarea, « Enregistrer », « Mise à jour le … » à droite) | **Message au sportif** (sous-titre, textarea placeholder « Ex. : semaine de reprise, garde l’endurance vraiment facile », « Envoyer le message »).

## E. Contenu exact (libellés de la maquette)
Blessures et points d’attention · Ce qui change l’entraînement : blessures, douleurs, zones à ménager. Pas de diagnostic ni de traitement. · Enregistrer les blessures · Retirer l’accord · Historique de l’accord · Notes libres · Caractère, préférences, logistique… Visible seulement par les coachs de ton organisation. · Enregistrer · Message au sportif · Le sportif le lit dans son espace, sous « Message de ton coach ». · Envoyer le message.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
