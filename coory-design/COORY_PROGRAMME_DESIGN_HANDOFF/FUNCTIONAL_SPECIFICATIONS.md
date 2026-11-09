# Spécifications fonctionnelles — Programmes

Légende : **[D]** = découle directement des maquettes · **[P]** = proposition à valider (non dessiné).

## 1. Concepts
- **Programme** : un sportif, une discipline principale (Running / Musculation / Hyrox), N semaines datées, M séances par semaine, regroupées en **phases** facultatives. [D]
- **Modèle** : un programme ou une séance **sans sportif ni dates** (Semaine 1 à N). Deux sources : **Mes modèles** (créés par le coach) et **Modèles Coory** (fournis par l'app, badge « Coory », lecture seule). [D]
- **Utiliser un modèle crée une copie** ; modifier la copie ne change jamais le modèle. [D]
- **Version** : publier fige une version (v1, v2…) visible par le sportif ; l'éditeur travaille sur un brouillon. [D]
- **Organisation de la semaine** : « Dans l'ordre, sans jour » (défaut) ou « Jours fixes ». Réglable par semaine, par phase ou pour tout le programme. [D]
- **Séance avec le coach** : date + heure de rendez-vous ; jour verrouillé. [D]

## 2. Page Programmes (01)
Onglet Programmes : liste de tous les programmes, filtres statut (Tous, En cours, Brouillons, À venir, Terminés) + discipline + sportif + recherche ; carte → éditeur 03. Onglet Modèles : filtre Tous / Coory / Mes modèles + type (Programmes et séances) + discipline + recherche ; carte « Utiliser » → assistant 02 étape 4 « Partir d'un modèle » pré-rempli [P pour le pré-remplissage] ; clic sur la carte → ouvre le modèle (03, sans sportif). États : rempli, vide (2 CTA), recherche sans résultat. [D]

## 3. Créer un programme (02)
4 étapes navigables (clic sur une étape déjà vue ou Continuer/Retour). Depuis la fiche d'un sportif, l'étape 1 arrive avec le sportif choisi. [D]
1. Sportif (recherche + liste radio) + titre.
2. Discipline, objectif de course (toggle, nom, date, catégorie), **façon de viser par défaut** (Running : allure / zones de FC ; Musculation : kg / % du max), pré-choisie selon les repères du sportif (VMA / FC max / maxima), note.
3. Date de début, nombre de semaines (fin calculée), séances par semaine (1–7), **phases** facultatives (nom + plage de semaines, ou plus tard), organisation (dans l'ordre / jour fixe par séance).
4. Point de départ : zéro / copie d'un ancien programme du sportif / **modèle** ; aperçu de la grille ; « Créer le brouillon » → éditeur 03.

## 4. Éditeur de programme (03)
- Semaines groupées par phase ; créer (+ Phase), renommer, supprimer une phase (···) ; + Semaine ; semaine « allégée » (étiquette).
- Semaine : dupliquer (vers d'autres semaines), menu ···, mode « Dans l'ordre | Jours fixes » (03b).
- Séances : sélectionner (panneau droit), réordonner (↑ ↓ ou glisser), ajouter (vide ou **depuis un modèle**), dupliquer, supprimer, modifier (→ éditeur 04/05/06 selon discipline).
- Menu ··· du programme : **Enregistrer comme modèle**, Dupliquer, Renommer, Archiver.
- Aperçu (vue sportif), PDF (génère les 2 PDF), Publier (08).
- Modèle Coory : lecture seule + « Dupliquer dans Mes modèles ».

## 5. Jours fixes (03b)
Règles 1–6 de la planche : sélecteur par semaine ; proposition automatique (disponibilités du sportif, rendez-vous coach, repos entre deux séances dures) ; changer un jour (clic sur le pavé jour ou glisser dans le bandeau) ; heure facultative ; « Sans jour » pour une séance ; portée (cette semaine / phase / programme), **semaines passées jamais modifiées** ; séance coach verrouillée ; option « le sportif peut déplacer la séance dans la même semaine » avec notification ; tout changement = modifications non publiées. Numérotation des séances = ordre des jours. [D]

## 6. Éditeurs de séance (04–06)
Communs : type de séance (select, Running/Hyrox), objectif, conseil, liste ordonnée, panneau d'édition, totaux calculés, « Terminer », menu ··· (Enregistrer comme modèle). [D]
- **Running** : étapes (Échauffement, Course, Récupération, Repos, Retour au calme) ; mesure (durée / distance / libre) ; **cible par étape : allure (min/km ou % VMA) ou zone de FC (Z1–Z5 + plage bpm)** calculées depuis les repères (« Recalculer »), saisie libre sans repère ; note ; conteneur **Répéter N fois** (modifier un enfant = toutes les répétitions).
- **Musculation** : exercices de la bibliothèque, séries (type, répétitions, charge, RIR), saisie rapide « 3 séries de 8 à 10 » → remplit le tableau, **charge en kg ou en % du max par exercice** (en % : kg calculés affichés depuis le max du sportif), repos, tempo, consigne ; groupes **Superset** (exercices reliés, repos en fin de tour) et **EMOM**.
- **Hyrox** : blocs avec format (Circuit, For time, AMRAP, EMOM, Intervalles, Simulation), tours, repos, temps cible, limite ; étapes Run / Station / Ergomètre (min/500 m) / Transition ; **charges : du coach ou officielles de la catégorie** ; **simulation** = 8 runs + 8 stations ordre officiel, un seul choix remplit les charges, temps cible par partie modifiable, total calculé.

## 7. Éditeur hybride — NON DESSINÉ [P]
Proposition minimale cohérente : une séance hybride = liste de **blocs typés** (Running, Musculation, Hyrox) réutilisant exactement les blocs des trois éditeurs ; le type de séance « Hybride » (#26CBB8) ; le panneau change selon le bloc sélectionné. **Ne pas développer sans validation du client.**

## 8. Côté sportif
- Onglet Programme (07) et Agenda (2c) : lecture des séances écrites, dépliage d'une séance, jour affiché si jours fixes, séances coach datées. [D]
- Feedback (RPE, ressenti) visible dans 07 côté coach ; saisie côté sportif **non dessinée** ici. [P]

## 9. PDF
Voir `12_PDF_SYSTEM/`. Deux PDF envoyés en une fois avec le programme complet. **Pas d'envoi automatique hebdomadaire** (retiré par le client).
