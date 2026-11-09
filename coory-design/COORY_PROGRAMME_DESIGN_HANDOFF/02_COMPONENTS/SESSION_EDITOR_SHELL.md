# 04–06 · Éditeurs de séance — tronc commun

Sources : `Coory Éditeurs Séance.dc.html` (cadre), `CooryEditeurListe.dc.html` (liste), `CooryEditeurPanneau.dc.html` (panneau). **EXACT**.

## Desktop 1280 (hauteur selon contenu : 900 / 1093 / 1301)
| Élément | Style |
|---|---|
| Header | « ← Prépa HYROX Gand · Séance 2 » · « Enregistré » 12.5 #8a8896 · Assistant IA · cloche · **Terminer** noir 32 |
| Grille | minmax(0,1fr) / 340, gap 12, align start |
| Carte titre | r20 padding 20 22 ; kicker discipline (pastille 7) ; titre 26/700 ; « Renommer » + ··· (menu : **Enregistrer comme modèle** surligné, Dupliquer la séance, Supprimer la séance rouge) ; « Type de séance » + **select 240** (Running, Hyrox) ; 2 champs (Objectif / Conseil du coach, ou Échauffement / Retour au calme en musculation) |
| Carte « Aperçu en direct » | r20 padding 16 20 : titre 14/600 + résumé écrit 12.5 (1 ligne, ellipsis) · totaux à droite (12 / 19/700). **Aucune barre / aucun graphique.** |
| Carte liste | r20 padding 18 : titre (Étapes / Exercices / Blocs) + méta ; `CooryEditeurListe` |
| Panneau droit | r20 padding 20, anneau 1.5 px rgba(139,92,246,.35) = « en cours de modification » ; `CooryEditeurPanneau` ; pied « Valider … » noir 46 + « Supprimer » rouge |

## Mobile 390 × 844
Header « ← Semaine 2 » · kicker + titre 24/700 · carte totaux (17/700) + résumé · liste · FAB « + » · l'édition s'ouvre en **feuille du bas** (max 760, défilable) avec le même panneau.

## Liste (`CooryEditeurListe`)
- **Étape** : barre gauche couleur (effort = discipline, récupération #c9c7d1, facile #dcdae3), titre, détail, durée à droite.
- **Exercice** : vignette grise + titre + résumé des séries.
- **Groupe** (Répéter, Superset, EMOM, Circuit, AMRAP) : fond teinte 9 %, icône (répéter / lien / horloge), libellé couleur texte discipline, **stepper** (ex. « 5 » fois / tours), méta sur une ligne (ellipsis), ···, enfants indentés, lien « Ajouter une étape / Relier un exercice ».
- Sélection : anneau 1.5 px #8b5cf6.
- Pied : 2 boutons d'ajout (Running : « Ajouter une étape », « Ajouter « Répéter » » ; Musculation : « Ajouter un exercice », « Créer un superset » ; Hyrox : « Ajouter un bloc », « Simulation de course »).
