# Analyse des écarts fonctionnels

> **Le code de COORY n’a pas été consulté** pour produire ce dossier. Toutes les comparaisons avec l’existant sont donc **« À vérifier par Claude Code »**. Les éléments ci-dessous sont ce que la maquette montre ; Claude Code doit, pour chacun, indiquer : *existe déjà* / *à modifier visuellement* / *nouveau* / *existe mais absent de la maquette (à conserver)*.

| Page | Élément de la maquette | Probabilité (indice visuel) | Statut |
|---|---|---|---|
| 01 | Filtres Statut / Programme en menus déroulants avec compteurs | — | À vérifier par Claude Code |
| 01 | Recherche « Rechercher un sportif » | — | À vérifier |
| 01 | Tri par colonne (flèches ↑ / ↕), libellé « Trié par nom, croissant » | — | À vérifier |
| 01 | Sélection multiple + barre d’actions (Changer le statut / Changer le programme / Inviter / Annuler) | probablement nouveau | À vérifier |
| 01 | Bouton « Inviter » / état « Invité » / bouton message par ligne | — | À vérifier |
| 01 | « Choisir » (programme non attribué), « Fiche à compléter » | — | À vérifier |
| 01 | Résumé mobile « 18 sportifs · 16 actifs · 9 compétitions à venir » | — | À vérifier |
| 2a | Vue d’ensemble en 7 cartes (Profil, Prochaines séances, Repères, Objectif actuel, Disponibilités, Notes, Historique récent) | — | À vérifier |
| 2a | « 1 autre objectif en cours » | — | À vérifier |
| 2b | Photo de profil (Changer / Retirer, JPEG/PNG/WebP 2 Mo, stockage privé) | — | À vérifier |
| 2b | Champs Adresse (rue, CP, ville, pays) « Reprise sur ses factures » | — | À vérifier |
| 2b | Statut Actif / En pause / Archivé en segmenté | — | À vérifier |
| 2c | Agenda : vue « Semaine » / « Toutes les semaines », navigation semaine ‹ › + menu « Semaine n / 12 », retour à la semaine actuelle, séances numérotées 1→5 sans date sauf séances avec coach, compétitions | probablement nouveau | À vérifier |
| 2d | Détail d’une séance : blocs empilés, « Répéter 5 fois », mini-timeline « Déroulé de la séance », Récapitulatif, Conseil du coach | probablement nouveau (vue) | À vérifier |
| 2e | Résumé programme + « Voir le programme semaine par semaine » | — | À vérifier |
| 2f | Objectif principal en carte jaune, Atteint / Abandonné / Rendre principal / Supprimer, Objectifs passés, formulaire d’ajout (type, date, temps visé, priorité, compétition, description) | — | À vérifier |
| 2g | **Deux cartes de repère interchangeables** (menu « Changer » listant tous les repères running + charges), « Inverser les deux cartes » | **nouveau** (demande explicite) | À vérifier |
| 2g | Graphique d’évolution avec **menu repère** + **menu période** (1 semaine, 4 semaines, 1 mois, 6 mois, 1 an) | **nouveau** (demande explicite) | À vérifier |
| 2g | Tableau des valeurs, Historique et corrections, Calculateur Cooper/5 km, Ajouter une mesure, Records personnels, Ajouter une performance | — | À vérifier |
| 2h | Disponibilités : séances/semaine, durée max, jours, contraintes | — | À vérifier |
| 2i | Blessures (avec **accord santé** + historique de l’accord + retrait), Notes libres, Message au sportif | — | À vérifier |
| 2j | Documents liés + Importer + Voir dans Documents | — | À vérifier |
| 2k | Historique : 6 derniers événements + **« Voir tout l’historique (n) » / « Réduire »** | **nouveau** (demande explicite) | À vérifier |

## Liste des repères attendus (2g, demande explicite de l’utilisateur)
Running : Endurance (zone 2), Tempo, Seuil, Allure 5 km, Allure 10 km, Allure semi-marathon, Allure marathon, Race pace (Hyrox), FC max, FC repos.
Musculation (charges de référence) : Wall ball, Back squat, Soulevé de terre — **exemples de la maquette ; la liste réelle vient de l’app**.

## Données de démo de la maquette (à ne pas coder en dur)
Noms des 18 sportifs, Inès Benali et son contenu, Gianluca Lo Bianco, dates (oct.–nov. 2026), valeurs d’allure et historiques des courbes (générés), compteurs de badges.
