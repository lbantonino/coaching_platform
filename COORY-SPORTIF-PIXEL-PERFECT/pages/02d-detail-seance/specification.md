# 2d — Détail d’une séance

## A. Identification
| | |
|---|---|
| Fiche | 2d |
| Nom | Détail d’une séance |
| Objectif | Lire précisément le contenu d’une séance prescrite. |
| Utilisateur | Coach (et contenu visible par le sportif) |
| Route existante | `/coach/sportifs/:id/seances/:seanceId` (supposée) — **À vérifier par Claude Code** |
| Captures | [desktop.png](screenshots/desktop.png) (1280 px, 2×) · [mobile.png](screenshots/mobile.png) (390 px, 2×) |
| Valeurs exactes | [source-extract.md](source-extract.md) |
| Relations | Depuis 2c. Retour « ← Inès Benali ». |

## B. Architecture (haut → bas, gauche → droite)
Desktop : grille **2 colonnes** `minmax(0,1fr) 300px`, gap 16, qui **s’étire jusqu’au bas du panneau latéral**.
- **Colonne principale — carte Séance** (padding 26, gap 20) :
  1. Sur-titre « RUNNING · SÉANCE 2 SUR 5 » (`600 11.5px` `.08em` `#4f4ed6`) · titre « Endurance rapide » (`600 26px/1.2`) · « Semaine 1 · 26 oct. – 1 nov. · au jour choisi par Inès » · à droite « 3 blocs · 1 h ».
  2. **Étapes empilées** (gap 12) :
     - Bloc 1 (`#f8f7fb`, r16, `padding:18px 20px`) : rond noir « 1 » · « Échauffement » `600 16px` · « 20 min » à droite · « À 6:00 min/km, allure progressive ».
     - Bloc 2 (fond `color-mix(in srgb,#7776FF 9%,#fff)`) : rond violet « 2 » · « Bloc principal » · « ⟲ Répéter 5 fois » `#4f4ed6` ; sous-lignes blanches (indentées 42 px) : barre 4 px `#7776FF` « Effort · 4:55 min/km · 4 min » et barre `#c9c8f7` « Récupération · Trot lent · 1:45 min ».
     - Bloc 3 : « Retour au calme · 5 min · À 6:35 min/km ».
  3. **Déroulé de la séance** (en bas, `margin-top:auto`) : encadré compact `#fbfafd` r14 `padding:12px 14px` : « Déroulé de la séance » + « ≈ 54 min » + légende (Effort · 4:55/km, Récup · trot, Allure facile) ; barres h22 proportionnelles au temps (échauffement en pente montante, 5 efforts + 4 récups, retour en pente descendante) ; libellés « 1 · 20 min Échauffement », « 2 · 5 × 4 min Récup. 1:45 », « 3 · 5 min ».
- **Colonne droite** (300 px) : carte **Récapitulatif** (Durée estimée 1 h · Type de séance Intervalles · Objectif · Suivi « À faire / Ressenti et commentaire d’Inès ici », icônes 36 r11 `#f3f2f7`) puis carte **Conseil du coach** (`flex:1`, texte + signature avatar GL « Gianluca Lo Bianco · Ton coach » en bas).

## E. Contenu exact (libellés de la maquette)
RUNNING · SÉANCE 2 SUR 5 · Endurance rapide · 3 blocs · 1 h · Échauffement · Bloc principal · Répéter 5 fois · Effort · Récupération · Trot lent · Retour au calme · Déroulé de la séance · ≈ 54 min · Effort · 4:55/km · Récup · trot · Allure facile · Récapitulatif · Durée estimée · Type de séance · Intervalles · Objectif · Améliorer l’endurance à allure rapide · Suivi · À faire · Ressenti et commentaire d’Inès ici · Conseil du coach · Ton coach.

> Les noms, dates, valeurs et compteurs sont des **données de démo** : utiliser les données réelles.
