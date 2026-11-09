# 06 · Éditeur de séance Hyrox (HYR-01 à 03)

Tronc commun : `02_COMPONENTS/SESSION_EDITOR_SHELL.md`. **EXACT**.

## Données (Circuit Hyrox, Séance 4, Semaine 2)
- Type de séance : select « Circuit » (options : Circuit, Simulation, Force, Ergomètres).
- Objectif « Enchaîner course et sled sans perte d'allure » · Conseil « Transitions rapides… ».
- Aperçu : « Échauffement · 5 tours · AMRAP 25 min » · Durée ≈ 58 min · Limite 60 min.
- Blocs : Échauffement [Run 1 000 m · 6:00] · **Circuit ×5** tours · repos 1 min [Run 600 m · 5:45 · Sled push 25 m · 102 kg (pastille jaune = station) · Transition 30 s] (sélectionné) · **AMRAP 25 min** cible 4 tours [12 BBJ · Sandbag lunges 40 m · 10 kg · Wall balls 15 · 6 kg].

## Panneau « bloc » (6a)
| Champ | Contrôle |
|---|---|
| Format du bloc | **select « Circuit ▾ »** (Circuit, For time, AMRAP, EMOM, Intervalles, Simulation) |
| Charges des stations | segmenté **« Du coach | Officielles »** + « Officielles = catégorie d'Inès (Open Femme). » |
| Champs | Tours 5 · Repos entre tours 1:00 min · Temps cible 25:00 · Limite 30:00 |
| Modèle prêt | fond #f6f5fa : « Simulation de course, 8 runs de 1 km et les 8 stations dans l'ordre officiel. » + « Insérer » |

## Feuille « Simulation de course » (6c)
- Segmenté **« Officielles | Mes charges »** (Officielles choisi) + « Officielles = catégorie d'Inès (Open Femme). Un seul choix remplit toutes les stations ; corrige ensuite chaque ligne si besoin. »
- Tableau ordre officiel : Run 1 (1 km, 5:05) · SkiErg (1 000 m · 2:10 /500 m, 4:20) · Run 2 · Sled push (50 m · 102 kg) · Run 3 · Sled pull (50 m · 78 kg) · Run 4 · Burpee broad jumps (80 m) · Run 5 · Rameur (1 000 m · 2:15 /500 m)… ; ligne 40 haut, pastille (run violet / station jaune / ergomètre gris), champ temps 62 × 30 éditable.
- Total « Temps cible total 1:18:20 » (barre noire). Bouton « Insérer la simulation ».
Ergomètres toujours en **min/500 m**, course en **min/km**.
