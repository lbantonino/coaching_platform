# 04 · Éditeur de séance Running (RUN-01 à 03)

Tronc commun : `02_COMPONENTS/SESSION_EDITOR_SHELL.md`. **EXACT**.

## Données affichées (exemple Endurance rapide, Semaine 2)
- Type de séance : select **« Fractionné »** (options : Endurance, Fractionné, Sortie longue, Tempo, Récupération).
- Objectif « Tenir l'allure 10 km sur des efforts courts » · Conseil « Garde les 2 min de trot vraiment lentes. »
- Aperçu : « 15 min + 5 × (2 min + 2 min) + 10 min » · Durée ≈ 45 min · Distance ≈ 8,4 km.
- Étapes : Échauffement (6:15 min/km, 15 min) · **Répéter 5 fois** [Course rapide 5:00–5:10 min/km 2 min (sélectionnée) · Récupération trot 2 min] · Retour au calme (6:35 min/km, 10 min). Méta « 3 blocs · 12 étapes au total ».

## Panneau « modifier une étape » (desktop 4a)
| Champ | Contrôle |
|---|---|
| En-tête | « BLOC RÉPÉTER 5 FOIS · ÉTAPE 1 » · « Course rapide » · « Le changement s'applique aux 5 répétitions. » |
| Type d'étape | **select « Course ▾ »** (Échauffement, Course, Récupération, Repos, Retour au calme) |
| Mesure | segmenté Durée / Distance / Libre + valeur 54 haut (anneau violet) « 2:00 min » |
| Cible | segmenté **« Allure | Zone de FC »** |
| — Allure (4a) | select « Allure en min/km » + 2 champs « 5:00 » – « 5:10 » « min/km » |
| — Zone de FC (4c) | 5 boutons Z1…Z5 (choisi noir) + 2 champs « 161 » – « 175 » « bpm » |
| Aide calcul | fond #f1edfc : « Calculée depuis la VMA d'Inès : 16 km/h (≈ 95 % VMA). » ou « Z4 · calculée depuis la FC max d'Inès : 192 bpm. Sans repère, écris la plage toi-même. » + lien « Recalculer » |
| Note | input « Relâché, foulée rapide » |
| Pied | « Valider l'étape » + « Supprimer » |

Règle : un bloc « Répéter N fois » est un **conteneur** ; modifier une étape enfant modifie toutes les répétitions.
