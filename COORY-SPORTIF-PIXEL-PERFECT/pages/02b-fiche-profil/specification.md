# 2b — Fiche sportif · Profil

## A. Identification
| | |
|---|---|
| Fiche | 2b |
| Nom | Fiche sportif · Profil |
| Objectif | Modifier les informations du sportif. |
| Utilisateur | Coach |
| Route existante | `/coach/sportifs/:id?onglet=profil` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Depuis 2a « Modifier » (Profil). |

## B. Architecture (haut → bas, gauche → droite)
1. Coque + en-tête + onglets (Profil actif).
2. **Carte Photo de profil** (une ligne) : avatar 64 + pastille appareil photo noire 24 · « Photo de profil » + « JPEG, PNG ou WebP, 2 Mo maximum. Stockée en privé. » · boutons « Changer la photo » (noir) + « Retirer » (contour, icône poubelle) à droite.
3. **Carte Informations**, groupes :
   - IDENTITÉ : Prénom · Nom de famille · Sexe (facultatif, select).
   - CONTACT : Adresse e-mail (verrouillée, aide « Identifiant de connexion du sportif : non modifiable ici. ») · Téléphone (placeholder « +32 … ») · Canal de contact préféré (select).
   - ADRESSE : Rue et numéro (pleine largeur, aide « Reprise sur ses factures. ») · Code postal · Ville · Pays (select).
   - PROFIL SPORTIF : Niveau (select) · Expérience (textarea) · Lieux d’entraînement (pastilles multi : Salle de sport, Extérieur (route, trail), Piste d’athlétisme, Domicile, Box Hyrox / CrossFit) · Matériel disponible (textarea).
   - STATUT : segmenté Actif / En pause / Archivé + aide « Archiver retire le sportif de la liste active sans rien effacer ; tu peux le restaurer à tout moment. »
   - Bouton **Enregistrer**.

## E. Contenu exact (libellés de la maquette)
Photo de profil · JPEG, PNG ou WebP, 2 Mo maximum. Stockée en privé. · Changer la photo · Retirer · Informations · IDENTITÉ · Prénom · Nom de famille · Sexe (facultatif) · CONTACT · Adresse e-mail · Identifiant de connexion du sportif : non modifiable ici. · Téléphone · Canal de contact préféré · ADRESSE · Rue et numéro · Reprise sur ses factures. · Code postal · Ville · Pays · PROFIL SPORTIF · Niveau · Expérience · Lieux d’entraînement · Matériel disponible · STATUT · Statut · Actif · En pause · Archivé · Enregistrer.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
