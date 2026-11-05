# FUNCTIONAL-GAP-ANALYSIS

> Le code de COORY n’a **pas** été accessible pendant la conception : la ligne « Existant » est remplie par Claude Code (phase A, 04/11/2026, d'après le code et la base locale). **Ne jamais supprimer une fonctionnalité existante** parce qu’elle n’apparaît pas sur une maquette.

## 01 · Tâches

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | F-01.4 Cocher une tâche |
| Changement visuel seulement | F-01.5 Navigation mobile listes → liste |
| À ajouter (validé) | F-01.2 Listes personnalisées colorées · F-01.3 Ajout rapide de tâche · F-01.6 FAB Nouvelle tâche |
| À vérifier / confirmer | F-01.1 (TO-VERIFY (existence dans l’app)) · F-01.3 (NEW-VALIDATED (TO-VERIFY : la modale « Nouvelle tâche » existante reste accessible)) · F-01.4 (EXISTING (TO-VERIFY)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `/coach/taches` (D-59, D-84). **F-01.1 existe en onglets** Toutes · Aujourd'hui · À venir · Terminées (pas en tuiles). **F-01.4 existe** (cocher → « Terminées »). « Nouvelle tâche » ouvre la fenêtre du kit Modals (Tâche, Sportif, Échéance, priorité, Note) ; toucher une tâche la modifie ou la supprime. **Pas de listes personnalisées** : colonne `category` (5 valeurs fixes : programme, facturation, paiement, suivi, agenda) en base, masquée à l'écran depuis D-84. Pas d'ajout rapide. Téléphone : bouton pleine largeur sous l'en-tête, pas de FAB. |

## 02 · Assistant IA

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | F-02.1 Boîte de dialogue Assistant |
| Changement visuel seulement | — |
| À ajouter (validé) | F-02.2 Suggestions et raccourcis · F-02.4 Actions proposées à valider · F-02.5 Page complète Assistant · F-02.6 Historique des conversations · F-02.7 Nouvelle conversation · F-02.8 Saisie mobile collée au clavier |
| À vérifier / confirmer | F-02.3 (PROPOSED (sélecteur non dessiné)) · F-02.4 (NEW-VALIDATED (TO-VERIFY API)) · F-02.6 (NEW-VALIDATED (visuel desktop) · À COMPLÉTER (ouverture, mobile)) · F-02.9 (PROPOSED (statiques)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | Bouton global (en-tête ordinateur avec libellé, ✦ dans la barre du téléphone) = **lien vers `/coach/assistant`, page « à venir » vide** (module non construit). **Rien d'autre** : aucune API d'IA, aucune conversation enregistrée, aucune action exécutable. F-02.1 à F-02.9 sont entièrement à construire (phase G). |

## 03 · Notifications

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | — |
| Changement visuel seulement | F-03.1 « Tout marquer comme lu » déplacé |
| À ajouter (validé) | F-03.2 Onglets Toutes / Non lues / Masquées · F-03.3 Menu « … » par notification · F-03.4 Masquer ≠ Supprimer + Annuler · F-03.5 Sélection multiple · F-03.6 Compteurs live |
| À vérifier / confirmer | F-03.4 (NEW-VALIDATED (TO-VERIFY champ masqué / suppression API)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `/coach/notifications` (D-37, D-61) : notifications **calculées** (messages non lus, tâches, compétitions, fiches à compléter…) rangées par sections ; état par clé dans `coach_notification_states` (`read_at`, `dismissed_at`). Existent : lu / non lu, **Masquer avec toast « Annuler »** (restaurer), « Tout marquer comme lu » (en-tête), menu ··· par ligne (kit Modals 36), aperçu dans la cloche. N'existent pas : onglets, sélection multiple, **suppression** (une notification calculée n'a pas de ligne à supprimer). Compteurs (cloche, menu) recalculés à chaque action. |

## 04 · Comptabilité

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | — |
| Changement visuel seulement | — |
| À ajouter (validé) | F-04.1 Sélecteur de période · F-04.2 Barres mensuelles cliquables · F-04.3 Répartition par mode de paiement · F-04.4 Mouvements en onglets + filtres + Voir plus · F-04.5 Tableau 12 mois repliable · F-04.6 FAB Nouveau paiement / dépense |
| À vérifier / confirmer | F-04.1 (NEW-VALIDATED (TO-VERIFY)) · F-04.7 (TO-VERIFY (validation propriétaire)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `/coach/comptabilite` (D-36, D-72, D-73, D-90, D-118). **F-04.1 existe** (Semaine · Mois · Année, toute la page). **F-04.3 existe** (anneau « Répartition » par mode). Barres « Gagné et dépensé » par période (**non cliquables**), tableau de comptabilité, listes Paiements · Dépenses · À encaisser avec filtre compte bancaire / espèces, fenêtres Nouveau paiement / Nouvelle dépense (TVA facultative, D-118). Pas de « Voir plus », pas de FAB (boutons dans l'en-tête, pleine largeur sur téléphone). « Facturation » **déjà retirée du menu** (D-90) : F-04.7 fait. |

## 05 · Documents

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | — |
| Changement visuel seulement | F-05.1 Stats remplacées par un sous-titre · F-05.2 Menu déroulant de catégories + Gérer · F-05.5 FAB Importer |
| À ajouter (validé) | F-05.3 Tableau trié · F-05.4 Voir plus / Réduire |
| À vérifier / confirmer | — |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `/coach/documents` (D-60, D-67, D-68) : cartes de chiffres (F-05.1 : à remplacer), catégories colorées avec filtre et « Gérer les catégories » (kit Modals 26), import par zone de dépôt, aperçu, modifier, supprimer (kit Modals 21 à 23). Pas de tri par colonne, pas de « Voir plus ». Téléphone : bouton « Importer un fichier » pleine largeur, pas de FAB. |

## 06 · Modifier la séance (individuelle)

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | F-06.5 Supprimer la séance |
| Changement visuel seulement | F-06.1 Récurrence en interrupteur · F-06.2 Paiement segmenté Virement · Espèces · F-06.4 Card récap pleine largeur |
| À ajouter (validé) | F-06.3 Calcul TVA en direct |
| À vérifier / confirmer | F-06.5 (EXISTING (TO-VERIFY) + DESIGN-CHANGE) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | Page `…/agenda/seances/[id]/modifier`, formulaire « version page » (`SessionForm`) : type et sportif verrouillés ; Titre, Discipline, Lieu, Date, Heure, Durée ; **case** « Chaque semaine » + « Jusqu'au » ; Prix, **Paiement Virement · Espèces déjà segmenté** (F-06.2), case « TVA comprise » ; **phrase de calcul TVA en direct déjà là** (F-06.3) ; Note du coach. **F-06.5 existe sur la page de la séance** (menu ··· « Supprimer la séance », confirmation), pas sur la page Modifier. Pas de récap, pas d'interrupteur, pas de barre fixe (Enregistrer en fin de formulaire). |

## 07 · Messages

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | — |
| Changement visuel seulement | — |
| À ajouter (validé) | F-07.1 Nouveau message / Nouveau groupe · F-07.2 Feuille « Nouveau message » mobile · F-07.3 Conversations de groupe · F-07.4 Création de groupe · F-07.5 Bandeau prochaine séance · F-07.6 Filtres de conversations · F-07.7 Actions du fil + composer |
| À vérifier / confirmer | F-07.3 (NEW-VALIDATED (TO-VERIFY modèle de données)) · F-07.7 (NEW-VALIDATED (TO-VERIFY pièces jointes)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `/coach/messages` (D-35) : conversations **1:1 par sportif** (table `athlete_messages` : athlete_id, sender, body, read_at), filtres Toutes · Non lues, fil + réponse, lu à l'ouverture ; « ← Conversations » sur téléphone (D-117). **Le sportif ne voit pas encore ses messages** (son espace viendra plus tard). N'existent pas : **groupes** (aucun modèle), **pièces jointes**, « Nouveau message », bandeau prochaine séance, recherche, filtres Sportifs / Groupes. |

## 08 · Créer un exercice / Créer ma variante

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | — |
| Changement visuel seulement | F-08.2 Bandeau de variante · F-08.3 Pilules rubrique / muscles · F-08.4 Aide sous Consignes |
| À ajouter (validé) | F-08.1 Aperçu en direct |
| À vérifier / confirmer | — |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `/coach/bibliotheque/nouveau` et `?variante=<clé>` (D-76) : Nom, Rubrique (pastilles, une seule), Groupes musculaires (pastilles, plusieurs), Matériel, Consignes (aide « Une consigne par ligne, 15 au maximum »), Photo, Lien vidéo. Variante : la phrase « Variante de … » (bandeau F-08.2 à faire), rubrique, muscles et matériel repris. **Pas d'aperçu en direct** (F-08.1). |

## 09 · Inviter un sportif

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | F-09.3 Révoquer / régénérer |
| Changement visuel seulement | F-09.1 Card sportif + pastille d’état |
| À ajouter (validé) | F-09.2 État « Lien généré » + partage · F-09.4 Compte activé : actions |
| À vérifier / confirmer | F-09.3 (EXISTING (TO-VERIFY)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `…/sportifs/[id]/inviter` : générer le lien (7 jours, usage unique, affiché une fois), copier, **révoquer (sans confirmation)**, régénérer (remplace l'ancien) ; états : compte déjà activé, fiche sans e-mail, lien en attente, lien expiré. **F-09.3 existe** (sans la confirmation). Pas de partage WhatsApp / e-mail / SMS, pas d'actions après activation. |

## 10 · Nouveau sportif

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | F-10.4 Bouton désactivé sans prénom |
| Changement visuel seulement | F-10.1 Cards numérotées pleine largeur · F-10.2 Pilules lieux / jours + statut segmenté |
| À ajouter (validé) | — |
| À vérifier / confirmer | F-10.3 (TO-VERIFY (règle existante ?)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `…/sportifs/nouveau` (D-54) : sections Identité, Contact, Profil sportif, Objectif principal, Disponibilités, Notes. **F-10.3 existe** (D-20) : blessures notées seulement avec la case d'accord explicite, effacement au retrait. **F-10.4 en partie** : prénom obligatoire, mais message « Le prénom est obligatoire. » à l'envoi, bouton **pas** grisé. Ordinateur : colonne de droite « Données de santé » + « Enregistrer le sportif » ; téléphone : barre fixe « Enregistrer le sportif » seule. |

## 11 · Modifier l’exercice

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | F-11.1 Photo de l’exercice · F-11.2 Lien vidéo |
| Changement visuel seulement | F-08.3 Pilules rubrique / muscles · F-08.4 Aide sous Consignes |
| À ajouter (validé) | F-08.1 Aperçu en direct |
| À vérifier / confirmer | F-11.1 (EXISTING (TO-VERIFY) + DESIGN-CHANGE) · F-11.2 (EXISTING (TO-VERIFY)) · F-11.3 (TO-VERIFY (API)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | `/coach/bibliotheque/[clé]/modifier` : **même formulaire que 08**. **F-11.1 existe** (photo privée, JPEG/PNG/WebP, 5 Mo, réduite à 1 200 px). **F-11.2 existe** (https:// seulement). **F-11.3 existe sur la fiche de l'exercice** (« Supprimer » avec confirmation), pas sur la page Modifier. |

## 12 · Modifier la séance (individuelle + collective)

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | F-06.5 Supprimer la séance |
| Changement visuel seulement | F-06.1 Récurrence en interrupteur · F-06.2 Paiement segmenté Virement · Espèces · F-06.4 Card récap pleine largeur |
| À ajouter (validé) | F-06.3 Calcul TVA en direct · F-12.1 Sportifs inscrits (collective) · F-12.2 Prix pour toute la séance + prix par inscrit |
| À vérifier / confirmer | F-06.5 (EXISTING (TO-VERIFY) + DESIGN-CHANGE) · F-12.1 (NEW-VALIDATED (TO-VERIFY modèle)) · F-12.3 (TO-VERIFY (champ existant ?)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | Même page et même formulaire que 06. **F-12.1 existe** : table `coach_session_athletes`, pastilles « Sportifs inscrits » (sans recherche ni compteur ni « Tout désélectionner »). **F-12.3 existe** (colonne `notes`, « Note du coach »). Prix « pour toute la séance » existe ; **le prix par inscrit (F-12.2) n'existe pas**. |

## 13 · Paramètres

| Catégorie | Éléments |
|---|---|
| Existe déjà (à confirmer) | F-13.3 Préférences (thème, défauts, agenda, notifications) · F-13.5 Sécurité (e-mail, mot de passe, appareils) |
| Changement visuel seulement | F-06.2 Paiement segmenté Virement · Espèces · F-13.1 Paramètres en modale à rubriques · F-13.2 Un seul Enregistrer par rubrique · F-13.4 TVA conditionnelle · F-13.6 Menu déroulant de rubriques (mobile) |
| À ajouter (validé) | — |
| À vérifier / confirmer | F-13.1 (DESIGN-CHANGE (TO-VERIFY page ou modale)) · F-13.2 (DESIGN-CHANGE (TO-VERIFY API par card)) · F-13.3 (EXISTING (TO-VERIFY)) · F-13.5 (EXISTING (TO-VERIFY)) |
| À conserver | toutes les actions métier actuelles, routes, permissions, validations |
| Existant (rempli par Claude Code, 04/11/2026) | Fenêtre (D-58, D-115, kit Modals 33) ouverte par le menu du compte : colonne des rubriques (ordinateur), sommaire « façon Réglages » + retour (téléphone) ; **Profil refait** (ne pas toucher). Préférences (thème immédiat, valeurs par défaut de « Nouvelle séance », heures de l'agenda, cases de notifications) : **F-13.3 existe**. Pays, devise et TVA : **interrupteur TVA + taux existent** (F-13.4), « Changer de devise » (kit Modals 34). Sécurité : **F-13.5 existe** (e-mail par lien, mot de passe ≥ 10, « Déconnecter partout » avec confirmation). Données : export JSON (route `/coach/profil/export`). **Un bouton par carte** (pas d'Enregistrer unique, F-13.2). Existe **aussi en page** `/coach/profil?onglet=…` (ancienne mise en page), utilisée par un lien de Notifications et par les tests. |

## Risques et dépendances transverses
- **Données de santé** (10, 13) : consentement explicite, effacement au retrait.
- **Groupes de messages** (07) et **inscrits** (12) : modèle de données peut-être absent.
- **Historique Assistant** (02) : persistance peut-être absente ; panneau mobile non dessiné.
- **Masquer / Supprimer des notifications** (03) : champ « masqué » et suppression API.
- **Taux de TVA** (13) partagé par 04, 06, 12 : source unique.
- **Entrée « Facturation »** : à supprimer du menu (décidé).
- **En-têtes mobiles** : règle SH-05 (décidé) ; retour toujours « ← Nom de l’écran précédent » (règle permanente, déjà codée).
- **Paramètres > Profil** : ne pas toucher.

## Décisions du propriétaire après l'audit (04/11/2026)
| # | Point | Décision |
|---|---|---|
| 1 | Retour ordinateur | règle codée « ← Nom de l'écran précédent », sans préfixe de section |
| 2 | Retour téléphone | violet du kit, 16 px, dans l'en-tête |
| 3 | FAB | composant unique aux valeurs du kit (60×60, rayon 18, 20 / 28 px), Agenda compris |
| 4 | FAB Bibliothèque | oui (« Créer un exercice »), hors kit |
| 5 | Paramètres sans route | `/coach/profil?onglet=…` ouvre la fenêtre par-dessus le tableau de bord ; export gardé |
| 6 | Paramètres mobile | menu déroulant des rubriques à la place du sommaire |
| 7 | Enregistrer par rubrique | un seul ; le thème reste immédiat |
| 8 | Listes de tâches | nouvelle table, aucune liste au départ (démo : les 4 de la maquette) |
| 9 | Gérer une liste | renommer / recolorer / supprimer maintenant ; tâches d'une liste supprimée « sans liste » |
| 10 | Ajout rapide | « + Nouvelle tâche » et FAB → ajout rapide ; fenêtre complète pour « Créer → Tâche » et la modification |
| 11 | Supprimer une notification | cachée pour de bon, 5 s pour annuler, colonne ajoutée |
| 12 | Groupes de messages | plus tard, avec l'espace sportif |
| 13 | Pièces jointes | plus tard |
| 14 | Texte de partage (09) | « Salut {prénom}, voici ton accès personnel à Coory pour suivre tes séances : {lien} (valable 7 jours, à usage unique). » |
| 15 | Assistant IA | tout le design maintenant ; fournisseur, conversations enregistrées, actions et données plus tard ; état honnête « pas encore branché » |
| 16 (05/11) | En-tête des pages avec retour | **remplace SH-02 / le fil d'Ariane du kit** : sur ordinateur, le chemin sur UNE ligne « [icône] ← Page précédente · Page en cours », carte d'en-tête à 64 px (jamais de titre sur une deuxième ligne) ; sur téléphone, retour dans la barre et titre à 20 px sous la barre. Vaut pour toutes les pages, même si une maquette montre « ← Titre » (D-124). |
