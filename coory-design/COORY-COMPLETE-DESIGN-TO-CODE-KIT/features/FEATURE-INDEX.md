# FEATURE-INDEX — toutes les fonctionnalités des maquettes « Coory Pages »

**69 fonctionnalités** recensées. Classification : EXISTING (existante vérifiée) · DESIGN-CHANGE (visuel seulement) · NEW-VALIDATED (nouvelle, validée par le propriétaire dans les maquettes/notes) · PROPOSED (proposée, non confirmée) · TO-VERIFY (à vérifier dans le code) · À COMPLÉTER (pas encore dessinée). Une fonctionnalité peut cumuler deux statuts (ex. « EXISTING (TO-VERIFY) » = probablement existante, à confirmer).

Répartition (statut principal) : TO-VERIFY 5 · NEW-VALIDATED 35 · EXISTING 9 · DESIGN-CHANGE 18 · PROPOSED 2.

Priorité : P1 = indispensable à la page · P2 = important · P3 = confort.

## Tableau récapitulatif

| ID | Nom | Page | Priorité | Statut |
|---|---|---|---|---|
| [F-01.1](#f-011) | Listes intelligentes | 01 | P1 | TO-VERIFY (existence dans l’app) |
| [F-01.2](#f-012) | Listes personnalisées colorées | 01 | P1 | NEW-VALIDATED |
| [F-01.3](#f-013) | Ajout rapide de tâche | 01 | P1 | NEW-VALIDATED (TO-VERIFY : la modale « Nouvelle tâche » existante reste accessible) |
| [F-01.4](#f-014) | Cocher une tâche | 01 | P1 | EXISTING (TO-VERIFY) |
| [F-01.5](#f-015) | Navigation mobile listes → liste | 01 | P2 | DESIGN-CHANGE |
| [F-01.6](#f-016) | FAB Nouvelle tâche | 01 | P2 | NEW-VALIDATED |
| [F-02.1](#f-021) | Boîte de dialogue Assistant | 02 | P1 | EXISTING (bouton) + NEW-VALIDATED (boîte) |
| [F-02.2](#f-022) | Suggestions et raccourcis | 02 | P2 | NEW-VALIDATED |
| [F-02.3](#f-023) | Contexte « Sportif » | 02 | P2 | PROPOSED (sélecteur non dessiné) |
| [F-02.4](#f-024) | Actions proposées à valider | 02 | P1 | NEW-VALIDATED (TO-VERIFY API) |
| [F-02.5](#f-025) | Page complète Assistant | 02 | P1 | NEW-VALIDATED |
| [F-02.6](#f-026) | Historique des conversations | 02 | P1 | NEW-VALIDATED (visuel desktop) · À COMPLÉTER (ouverture, mobile) |
| [F-02.7](#f-027) | Nouvelle conversation | 02 | P1 | NEW-VALIDATED |
| [F-02.8](#f-028) | Saisie mobile collée au clavier | 02 | P1 | NEW-VALIDATED |
| [F-02.9](#f-029) | Joindre / Dicter | 02 | P3 | PROPOSED (statiques) |
| [F-03.1](#f-031) | « Tout marquer comme lu » déplacé | 03 | P1 | DESIGN-CHANGE |
| [F-03.2](#f-032) | Onglets Toutes / Non lues / Masquées | 03 | P1 | NEW-VALIDATED |
| [F-03.3](#f-033) | Menu « … » par notification | 03 | P1 | NEW-VALIDATED |
| [F-03.4](#f-034) | Masquer ≠ Supprimer + Annuler | 03 | P1 | NEW-VALIDATED (TO-VERIFY champ masqué / suppression API) |
| [F-03.5](#f-035) | Sélection multiple | 03 | P2 | NEW-VALIDATED |
| [F-03.6](#f-036) | Compteurs live | 03 | P1 | NEW-VALIDATED |
| [F-04.1](#f-041) | Sélecteur de période | 04 | P1 | NEW-VALIDATED (TO-VERIFY) |
| [F-04.2](#f-042) | Barres mensuelles cliquables | 04 | P2 | NEW-VALIDATED |
| [F-04.3](#f-043) | Répartition par mode de paiement | 04 | P2 | NEW-VALIDATED |
| [F-04.4](#f-044) | Mouvements en onglets + filtres + Voir plus | 04 | P1 | NEW-VALIDATED |
| [F-04.5](#f-045) | Tableau 12 mois repliable | 04 | P2 | NEW-VALIDATED |
| [F-04.6](#f-046) | FAB Nouveau paiement / dépense | 04 | P1 | NEW-VALIDATED |
| [F-04.7](#f-047) | Retrait de « Facturation » du menu | 04 | P3 | NEW-VALIDATED (page supprimée de l’app — retirer l’entrée) |
| [F-05.1](#f-051) | Stats remplacées par un sous-titre | 05 | P2 | DESIGN-CHANGE |
| [F-05.2](#f-052) | Menu déroulant de catégories + Gérer | 05 | P1 | DESIGN-CHANGE |
| [F-05.3](#f-053) | Tableau trié | 05 | P1 | NEW-VALIDATED |
| [F-05.4](#f-054) | Voir plus / Réduire | 05 | P2 | NEW-VALIDATED |
| [F-05.5](#f-055) | FAB Importer | 05 | P2 | DESIGN-CHANGE |
| [F-06.1](#f-061) | Récurrence en interrupteur | 06/12 | P1 | DESIGN-CHANGE |
| [F-06.2](#f-062) | Paiement segmenté Virement · Espèces | 06/12/13 | P1 | DESIGN-CHANGE |
| [F-06.3](#f-063) | Calcul TVA en direct | 06/12 | P1 | NEW-VALIDATED |
| [F-06.4](#f-064) | Card récap pleine largeur | 06/12 | P1 | DESIGN-CHANGE (validé 4 nov.) |
| [F-06.5](#f-065) | Supprimer la séance | 06/12 | P1 | EXISTING (TO-VERIFY) + DESIGN-CHANGE |
| [F-07.1](#f-071) | Nouveau message / Nouveau groupe | 07 | P1 | NEW-VALIDATED |
| [F-07.2](#f-072) | Feuille « Nouveau message » mobile | 07 | P1 | NEW-VALIDATED |
| [F-07.3](#f-073) | Conversations de groupe | 07 | P1 | NEW-VALIDATED (TO-VERIFY modèle de données) |
| [F-07.4](#f-074) | Création de groupe | 07 | P1 | NEW-VALIDATED |
| [F-07.5](#f-075) | Bandeau prochaine séance | 07 | P2 | NEW-VALIDATED |
| [F-07.6](#f-076) | Filtres de conversations | 07 | P2 | NEW-VALIDATED |
| [F-07.7](#f-077) | Actions du fil + composer | 07 | P1 | NEW-VALIDATED (TO-VERIFY pièces jointes) |
| [F-08.1](#f-081) | Aperçu en direct | 08/11 | P2 | NEW-VALIDATED |
| [F-08.2](#f-082) | Bandeau de variante | 08 | P1 | DESIGN-CHANGE |
| [F-08.3](#f-083) | Pilules rubrique / muscles | 08/11 | P1 | DESIGN-CHANGE |
| [F-08.4](#f-084) | Aide sous Consignes | 08/11 | P3 | DESIGN-CHANGE |
| [F-09.1](#f-091) | Card sportif + pastille d’état | 09 | P1 | DESIGN-CHANGE |
| [F-09.2](#f-092) | État « Lien généré » + partage | 09 | P1 | NEW-VALIDATED (liens wa.me / mailto / sms) |
| [F-09.3](#f-093) | Révoquer / régénérer | 09 | P1 | EXISTING (TO-VERIFY) |
| [F-09.4](#f-094) | Compte activé : actions | 09 | P2 | NEW-VALIDATED |
| [F-10.1](#f-101) | Cards numérotées pleine largeur | 10 | P1 | DESIGN-CHANGE |
| [F-10.2](#f-102) | Pilules lieux / jours + statut segmenté | 10 | P1 | DESIGN-CHANGE |
| [F-10.3](#f-103) | Accord explicite pour les blessures | 10 | P1 | TO-VERIFY (règle existante ?) |
| [F-10.4](#f-104) | Bouton désactivé sans prénom | 10 | P1 | EXISTING (règle) + DESIGN-CHANGE |
| [F-11.1](#f-111) | Photo de l’exercice | 11 | P1 | EXISTING (TO-VERIFY) + DESIGN-CHANGE |
| [F-11.2](#f-112) | Lien vidéo | 11 | P2 | EXISTING (TO-VERIFY) |
| [F-11.3](#f-113) | Supprimer l’exercice | 11 | P2 | TO-VERIFY (API) |
| [F-12.1](#f-121) | Sportifs inscrits (collective) | 12 | P1 | NEW-VALIDATED (TO-VERIFY modèle) |
| [F-12.2](#f-122) | Prix pour toute la séance + prix par inscrit | 12 | P2 | NEW-VALIDATED |
| [F-12.3](#f-123) | Note du coach | 12 | P3 | TO-VERIFY (champ existant ?) |
| [F-13.1](#f-131) | Paramètres en modale à rubriques | 13 | P1 | DESIGN-CHANGE ✅ fenêtre par-dessus la page (validé) |
| [F-13.2](#f-132) | Un seul Enregistrer par rubrique | 13 | P1 | DESIGN-CHANGE (TO-VERIFY API par card) |
| [F-13.3](#f-133) | Préférences (thème, défauts, agenda, notifications) | 13 | P1 | EXISTING (TO-VERIFY) |
| [F-13.4](#f-134) | TVA conditionnelle | 13 | P1 | DESIGN-CHANGE |
| [F-13.5](#f-135) | Sécurité (e-mail, mot de passe, appareils) | 13 | P1 | EXISTING (TO-VERIFY) |
| [F-13.6](#f-136) | Menu déroulant de rubriques (mobile) | 13 | P1 | DESIGN-CHANGE (validé 4 nov.) |

## Fiches détaillées

<a id="f-011"></a>
### F-01.1 · Listes intelligentes

| Champ | Valeur |
|---|---|
| 1. Nom | Listes intelligentes |
| 2. Objectif utilisateur | Voir d’un coup les tâches du jour, à venir, toutes, terminées |
| 3. Page | [01](../pages/01-taches/overview.md) |
| 4. Déclencheur | Clic sur une tuile |
| 5. Comportement attendu | Filtre la liste de droite, titre + compteur |
| 6. Données nécessaires | tâches (échéance, statut) |
| 7. États possibles | Aujourd’hui · À venir · Toutes · Terminées |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | aucune donnée modifiée |
| 11. Interactions avec | F-01.4 |
| 12. Desktop | grille 2×2 colonne gauche |
| 13. Mobile | grille 2×2 accueil |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | TO-VERIFY (existence dans l’app) |

<a id="f-012"></a>
### F-01.2 · Listes personnalisées colorées

| Champ | Valeur |
|---|---|
| 1. Nom | Listes personnalisées colorées |
| 2. Objectif utilisateur | Ranger les tâches par thème (Programmes, Facturation…) |
| 3. Page | [01](../pages/01-taches/overview.md) |
| 4. Déclencheur | Clic « + Nouvelle liste » |
| 5. Comportement attendu | Input inline, Entrée crée la liste avec la couleur suivante |
| 6. Données nécessaires | listes (nom, couleur, ordre) |
| 7. États possibles | vide · saisie · créée |
| 8. Validations | nom non vide |
| 9. Messages d’erreur | nom vide → ignoré |
| 10. Conséquences | nouvelle liste |
| 11. Interactions avec | F-01.3 |
| 12. Desktop | colonne gauche |
| 13. Mobile | card « Mes listes » |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-013"></a>
### F-01.3 · Ajout rapide de tâche

| Champ | Valeur |
|---|---|
| 1. Nom | Ajout rapide de tâche |
| 2. Objectif utilisateur | Créer une tâche sans ouvrir de fenêtre |
| 3. Page | [01](../pages/01-taches/overview.md) |
| 4. Déclencheur | « Nouvelle tâche » (header, ligne, FAB) |
| 5. Comportement attendu | Ligne de saisie en bas de la vue ; Entrée ajoute dans la liste courante |
| 6. Données nécessaires | titre, liste |
| 7. États possibles | inactif · actif · enregistré |
| 8. Validations | titre non vide |
| 9. Messages d’erreur | — |
| 10. Conséquences | tâche créée |
| 11. Interactions avec | F-01.2 |
| 12. Desktop | ligne inline |
| 13. Mobile | ligne inline + FAB |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (TO-VERIFY : la modale « Nouvelle tâche » existante reste accessible) |

<a id="f-014"></a>
### F-01.4 · Cocher une tâche

| Champ | Valeur |
|---|---|
| 1. Nom | Cocher une tâche |
| 2. Objectif utilisateur | Marquer une tâche terminée |
| 3. Page | [01](../pages/01-taches/overview.md) |
| 4. Déclencheur | Clic sur le rond |
| 5. Comportement attendu | Bascule terminée, compteurs à jour |
| 6. Données nécessaires | statut |
| 7. États possibles | à faire · terminée |
| 8. Validations | — |
| 9. Messages d’erreur | échec API → décocher + toast |
| 10. Conséquences | tâche terminée |
| 11. Interactions avec | F-01.1 |
| 12. Desktop | rond 22 px |
| 13. Mobile | idem |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | EXISTING (TO-VERIFY) |

<a id="f-015"></a>
### F-01.5 · Navigation mobile listes → liste

| Champ | Valeur |
|---|---|
| 1. Nom | Navigation mobile listes → liste |
| 2. Objectif utilisateur | Passer d’une liste à l’autre rapidement |
| 3. Page | [01](../pages/01-taches/overview.md) |
| 4. Déclencheur | Tap liste / onglet |
| 5. Comportement attendu | Écran liste avec onglets de listes défilants + retour « ‹ Listes » |
| 6. Données nécessaires | listes |
| 7. États possibles | accueil · liste |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-01.2 |
| 12. Desktop | — |
| 13. Mobile | 2 écrans |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-016"></a>
### F-01.6 · FAB Nouvelle tâche

| Champ | Valeur |
|---|---|
| 1. Nom | FAB Nouvelle tâche |
| 2. Objectif utilisateur | Créer une tâche depuis le mobile |
| 3. Page | [01](../pages/01-taches/overview.md) |
| 4. Déclencheur | Tap FAB |
| 5. Comportement attendu | Ouvre l’ajout rapide |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-01.3 |
| 12. Desktop | — |
| 13. Mobile | SH-08 |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-021"></a>
### F-02.1 · Boîte de dialogue Assistant

| Champ | Valeur |
|---|---|
| 1. Nom | Boîte de dialogue Assistant |
| 2. Objectif utilisateur | Demander quelque chose sans quitter la page |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Bouton global ✦ |
| 5. Comportement attendu | Ouvre la boîte par-dessus la page ; Échap/overlay ferme |
| 6. Données nécessaires | brouillon, conversation courante |
| 7. États possibles | fermée · vide · conversation |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-02.5 |
| 12. Desktop | overlay + boîte centrée |
| 13. Mobile | boîte ancrée sous ✦ |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | EXISTING (bouton) + NEW-VALIDATED (boîte) |

<a id="f-022"></a>
### F-02.2 · Suggestions et raccourcis

| Champ | Valeur |
|---|---|
| 1. Nom | Suggestions et raccourcis |
| 2. Objectif utilisateur | Démarrer vite (Programmer, Analyser, Administratif) |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Clic pilule / card |
| 5. Comportement attendu | Envoie le prompt associé |
| 6. Données nécessaires | liste de suggestions |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | nouveau message |
| 11. Interactions avec | F-02.4 |
| 12. Desktop | pilules + 3 cards |
| 13. Mobile | menu « + Plus d’options » |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-023"></a>
### F-02.3 · Contexte « Sportif »

| Champ | Valeur |
|---|---|
| 1. Nom | Contexte « Sportif » |
| 2. Objectif utilisateur | Lier la demande à un sportif |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Clic pilule Sportif |
| 5. Comportement attendu | Choix d’un sportif, pilule = son nom, joint à la requête |
| 6. Données nécessaires | id sportif |
| 7. États possibles | aucun · choisi |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | contexte envoyé |
| 11. Interactions avec | — |
| 12. Desktop | pilule |
| 13. Mobile | pilule |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | PROPOSED (sélecteur non dessiné) |

<a id="f-024"></a>
### F-02.4 · Actions proposées à valider

| Champ | Valeur |
|---|---|
| 1. Nom | Actions proposées à valider |
| 2. Objectif utilisateur | L’assistant ne fait rien seul |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Réponse avec actions |
| 5. Comportement attendu | Card de cases cochées ; « Valider N actions » exécute les cochées |
| 6. Données nécessaires | actions (libellé, payload) |
| 7. États possibles | proposées · validées · ignorées |
| 8. Validations | N ≥ 1 |
| 9. Messages d’erreur | échec → message d’erreur dans le fil |
| 10. Conséquences | actions exécutées |
| 11. Interactions avec | F-02.1 |
| 12. Desktop | card dans le fil |
| 13. Mobile | idem |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (TO-VERIFY API) |

<a id="f-025"></a>
### F-02.5 · Page complète Assistant

| Champ | Valeur |
|---|---|
| 1. Nom | Page complète Assistant |
| 2. Objectif utilisateur | Travailler longuement avec l’assistant |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Menu « Assistant IA » ou « Plein écran » |
| 5. Comportement attendu | Page avec historique + conversation |
| 6. Données nécessaires | conversations |
| 7. États possibles | vide · conversation |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-02.6 |
| 12. Desktop | 2 colonnes |
| 13. Mobile | plein écran (EX-01) |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-026"></a>
### F-02.6 · Historique des conversations

| Champ | Valeur |
|---|---|
| 1. Nom | Historique des conversations |
| 2. Objectif utilisateur | Retrouver et reprendre une ancienne conversation |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Ouverture page / bouton Historique |
| 5. Comportement attendu | Liste groupée par date ; clic = ouvre la conversation |
| 6. Données nécessaires | conversations (id, titre, date, messages) |
| 7. États possibles | chargement · vide · liste · conversation ouverte |
| 8. Validations | — |
| 9. Messages d’erreur | chargement échoué → réessayer |
| 10. Conséquences | conversation rouverte |
| 11. Interactions avec | F-02.7 |
| 12. Desktop | colonne 250 px |
| 13. Mobile | panneau à compléter |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (visuel desktop) · À COMPLÉTER (ouverture, mobile) |

<a id="f-027"></a>
### F-02.7 · Nouvelle conversation

| Champ | Valeur |
|---|---|
| 1. Nom | Nouvelle conversation |
| 2. Objectif utilisateur | Repartir de zéro |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Bouton « Nouvelle conversation » |
| 5. Comportement attendu | Archive le fil courant dans l’historique, vide la zone |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | nouveau fil |
| 11. Interactions avec | F-02.6 |
| 12. Desktop | bouton noir colonne |
| 13. Mobile | bouton noir en-tête |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-028"></a>
### F-02.8 · Saisie mobile collée au clavier

| Champ | Valeur |
|---|---|
| 1. Nom | Saisie mobile collée au clavier |
| 2. Objectif utilisateur | Écrire confortablement |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Focus saisie |
| 5. Comportement attendu | Zone fixée en bas, au-dessus du clavier ; messages défilent |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | — |
| 13. Mobile | EX-01 |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-029"></a>
### F-02.9 · Joindre / Dicter

| Champ | Valeur |
|---|---|
| 1. Nom | Joindre / Dicter |
| 2. Objectif utilisateur | Pièce jointe et dictée |
| 3. Page | [02](../pages/02-assistant-ia/overview.md) |
| 4. Déclencheur | Clic icônes |
| 5. Comportement attendu | — |
| 6. Données nécessaires | fichier, audio |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | icônes |
| 13. Mobile | icônes |
| 14. Priorité | P3 |
| 15. Validation fonctionnelle | PROPOSED (statiques) |

<a id="f-031"></a>
### F-03.1 · « Tout marquer comme lu » déplacé

| Champ | Valeur |
|---|---|
| 1. Nom | « Tout marquer comme lu » déplacé |
| 2. Objectif utilisateur | Action de masse sans encombrer le header |
| 3. Page | [03](../pages/03-notifications/overview.md) |
| 4. Déclencheur | Clic bouton barre d’outils / icône mobile |
| 5. Comportement attendu | Marque tout ; toast Annuler |
| 6. Données nécessaires | notifications |
| 7. États possibles | actif · grisé |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | tout lu |
| 11. Interactions avec | F-03.6 |
| 12. Desktop | bouton secondaire |
| 13. Mobile | icône ✓✓ |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-032"></a>
### F-03.2 · Onglets Toutes / Non lues / Masquées

| Champ | Valeur |
|---|---|
| 1. Nom | Onglets Toutes / Non lues / Masquées |
| 2. Objectif utilisateur | Filtrer |
| 3. Page | [03](../pages/03-notifications/overview.md) |
| 4. Déclencheur | Clic onglet |
| 5. Comportement attendu | Filtre, sections vides cachées |
| 6. Données nécessaires | statut lu/masqué |
| 7. États possibles | 3 onglets |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-03.4 |
| 12. Desktop | segmenté |
| 13. Mobile | segmenté |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-033"></a>
### F-03.3 · Menu « … » par notification

| Champ | Valeur |
|---|---|
| 1. Nom | Menu « … » par notification |
| 2. Objectif utilisateur | Agir sur une notification |
| 3. Page | [03](../pages/03-notifications/overview.md) |
| 4. Déclencheur | Clic « … » |
| 5. Comportement attendu | Lu/non lu · Masquer/Afficher · Supprimer |
| 6. Données nécessaires | — |
| 7. États possibles | fermé · ouvert |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-03.4 |
| 12. Desktop | M-MENU 36 px |
| 13. Mobile | items 46 px |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-034"></a>
### F-03.4 · Masquer ≠ Supprimer + Annuler

| Champ | Valeur |
|---|---|
| 1. Nom | Masquer ≠ Supprimer + Annuler |
| 2. Objectif utilisateur | Éviter les pertes |
| 3. Page | [03](../pages/03-notifications/overview.md) |
| 4. Déclencheur | Masquer / Supprimer |
| 5. Comportement attendu | Masquer = onglet Masquées ; Supprimer = définitif après 5 s ; toast Annuler |
| 6. Données nécessaires | champ masqué, suppression |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | échec → restaurer |
| 10. Conséquences | — |
| 11. Interactions avec | F-03.5 |
| 12. Desktop | toast |
| 13. Mobile | toast 54 px |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (TO-VERIFY champ masqué / suppression API) |

<a id="f-035"></a>
### F-03.5 · Sélection multiple

| Champ | Valeur |
|---|---|
| 1. Nom | Sélection multiple |
| 2. Objectif utilisateur | Traiter en lot |
| 3. Page | [03](../pages/03-notifications/overview.md) |
| 4. Déclencheur | « Sélectionner » |
| 5. Comportement attendu | Cases + actions groupées Lu / Masquer / Supprimer |
| 6. Données nécessaires | sélection |
| 7. États possibles | off · on |
| 8. Validations | ≥ 1 sélectionné |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-03.4 |
| 12. Desktop | barre d’outils |
| 13. Mobile | barre noire fixe |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-036"></a>
### F-03.6 · Compteurs live

| Champ | Valeur |
|---|---|
| 1. Nom | Compteurs live |
| 2. Objectif utilisateur | Cohérence des badges |
| 3. Page | [03](../pages/03-notifications/overview.md) |
| 4. Déclencheur | Toute action |
| 5. Comportement attendu | Cloche, menu, pastilles suivent les non lues |
| 6. Données nécessaires | compteur non lues |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | SH-04 |
| 12. Desktop | badges |
| 13. Mobile | badges |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-041"></a>
### F-04.1 · Sélecteur de période

| Champ | Valeur |
|---|---|
| 1. Nom | Sélecteur de période |
| 2. Objectif utilisateur | Lire ses chiffres par semaine, mois, année |
| 3. Page | [04](../pages/04-comptabilite/overview.md) |
| 4. Déclencheur | Clic segment |
| 5. Comportement attendu | Recalcule tous les chiffres |
| 6. Données nécessaires | paiements, dépenses |
| 7. États possibles | Semaine · Mois · Année |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-04.2 |
| 12. Desktop | segmenté |
| 13. Mobile | segmenté pleine largeur |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (TO-VERIFY) |

<a id="f-042"></a>
### F-04.2 · Barres mensuelles cliquables

| Champ | Valeur |
|---|---|
| 1. Nom | Barres mensuelles cliquables |
| 2. Objectif utilisateur | Aller sur un mois |
| 3. Page | [04](../pages/04-comptabilite/overview.md) |
| 4. Déclencheur | Clic barre |
| 5. Comportement attendu | Période Mois + mois surligné (graphique + tableau) |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-04.5 |
| 12. Desktop | graphique |
| 13. Mobile | graphique |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-043"></a>
### F-04.3 · Répartition par mode de paiement

| Champ | Valeur |
|---|---|
| 1. Nom | Répartition par mode de paiement |
| 2. Objectif utilisateur | Voir comment on est payé |
| 3. Page | [04](../pages/04-comptabilite/overview.md) |
| 4. Déclencheur | Bascule icônes |
| 5. Comportement attendu | Anneau ou barres ; %, montants |
| 6. Données nécessaires | montants par mode |
| 7. États possibles | circulaire · barres |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-04.1 |
| 12. Desktop | card |
| 13. Mobile | card |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-044"></a>
### F-04.4 · Mouvements en onglets + filtres + Voir plus

| Champ | Valeur |
|---|---|
| 1. Nom | Mouvements en onglets + filtres + Voir plus |
| 2. Objectif utilisateur | Parcourir les mouvements |
| 3. Page | [04](../pages/04-comptabilite/overview.md) |
| 4. Déclencheur | Onglets / pilules / bouton |
| 5. Comportement attendu | Paiements · Dépenses · À encaisser ; filtres ; 5 puis tout |
| 6. Données nécessaires | mouvements |
| 7. États possibles | replié · déplié |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | card |
| 13. Mobile | card |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-045"></a>
### F-04.5 · Tableau 12 mois repliable

| Champ | Valeur |
|---|---|
| 1. Nom | Tableau 12 mois repliable |
| 2. Objectif utilisateur | Vue comptable détaillée |
| 3. Page | [04](../pages/04-comptabilite/overview.md) |
| 4. Déclencheur | Afficher / Masquer |
| 5. Comportement attendu | Tableau + mois vides masqués + total |
| 6. Données nécessaires | agrégats mensuels |
| 7. États possibles | replié · déplié · mois vides visibles |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-04.2 |
| 12. Desktop | tableau |
| 13. Mobile | tableau défilant |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-046"></a>
### F-04.6 · FAB Nouveau paiement / dépense

| Champ | Valeur |
|---|---|
| 1. Nom | FAB Nouveau paiement / dépense |
| 2. Objectif utilisateur | Saisir vite sur mobile |
| 3. Page | [04](../pages/04-comptabilite/overview.md) |
| 4. Déclencheur | Tap FAB |
| 5. Comportement attendu | Menu 2 choix → modales existantes |
| 6. Données nécessaires | — |
| 7. États possibles | fermé · ouvert |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | kit Modals |
| 12. Desktop | — |
| 13. Mobile | SH-08 |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-047"></a>
### F-04.7 · Retrait de « Facturation » du menu

| Champ | Valeur |
|---|---|
| 1. Nom | Retrait de « Facturation » du menu |
| 2. Objectif utilisateur | Simplifier la navigation |
| 3. Page | [04](../pages/04-comptabilite/overview.md) |
| 4. Déclencheur | — |
| 5. Comportement attendu | Entrée absente |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | SH-01 |
| 12. Desktop | menu |
| 13. Mobile | menu |
| 14. Priorité | P3 |
| 15. Validation fonctionnelle | NEW-VALIDATED (page supprimée de l’app — retirer l’entrée) |

<a id="f-051"></a>
### F-05.1 · Stats remplacées par un sous-titre

| Champ | Valeur |
|---|---|
| 1. Nom | Stats remplacées par un sous-titre |
| 2. Objectif utilisateur | Gagner de la place |
| 3. Page | [05](../pages/05-documents/overview.md) |
| 4. Déclencheur | — |
| 5. Comportement attendu | « N documents · X utilisés » |
| 6. Données nécessaires | nb, taille totale |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | header |
| 13. Mobile | header |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-052"></a>
### F-05.2 · Menu déroulant de catégories + Gérer

| Champ | Valeur |
|---|---|
| 1. Nom | Menu déroulant de catégories + Gérer |
| 2. Objectif utilisateur | Filtrer par catégorie |
| 3. Page | [05](../pages/05-documents/overview.md) |
| 4. Déclencheur | Clic « Catégorie ▾ » |
| 5. Comportement attendu | Menu avec couleur, nombre, coche ; « Gérer les catégories » à côté |
| 6. Données nécessaires | catégories |
| 7. États possibles | fermé · ouvert |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | filtre |
| 11. Interactions avec | kit Modals |
| 12. Desktop | bouton + lien |
| 13. Mobile | « Gérer » |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-053"></a>
### F-05.3 · Tableau trié

| Champ | Valeur |
|---|---|
| 1. Nom | Tableau trié |
| 2. Objectif utilisateur | Trouver un document |
| 3. Page | [05](../pages/05-documents/overview.md) |
| 4. Déclencheur | Clic en-tête |
| 5. Comportement attendu | Tri Catégorie A→Z/Z→A, Ajouté le récent/ancien |
| 6. Données nécessaires | — |
| 7. États possibles | asc · desc |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | tableau |
| 13. Mobile | cards |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-054"></a>
### F-05.4 · Voir plus / Réduire

| Champ | Valeur |
|---|---|
| 1. Nom | Voir plus / Réduire |
| 2. Objectif utilisateur | Liste courte par défaut |
| 3. Page | [05](../pages/05-documents/overview.md) |
| 4. Déclencheur | Clic |
| 5. Comportement attendu | 7 puis tout |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | bouton gris à droite |
| 13. Mobile | lien violet centré |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-055"></a>
### F-05.5 · FAB Importer

| Champ | Valeur |
|---|---|
| 1. Nom | FAB Importer |
| 2. Objectif utilisateur | Importer sur mobile |
| 3. Page | [05](../pages/05-documents/overview.md) |
| 4. Déclencheur | Tap FAB |
| 5. Comportement attendu | Sélecteur de fichier existant |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | bouton header |
| 13. Mobile | SH-08 |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-061"></a>
### F-06.1 · Récurrence en interrupteur

| Champ | Valeur |
|---|---|
| 1. Nom | Récurrence en interrupteur |
| 2. Objectif utilisateur | Rendre la récurrence évidente |
| 3. Page | [06](../pages/06-modifier-seance/overview.md) · [12](../pages/12-modifier-seance-collective/overview.md) |
| 4. Déclencheur | Clic sur la ligne |
| 5. Comportement attendu | Affiche « Jusqu’au » + aide si actif |
| 6. Données nécessaires | récurrence, date de fin |
| 7. États possibles | off · on |
| 8. Validations | date fin ≥ 1re séance |
| 9. Messages d’erreur | message sous champ |
| 10. Conséquences | séance récurrente |
| 11. Interactions avec | F-06.4 |
| 12. Desktop | ligne switch |
| 13. Mobile | idem 56 px |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-062"></a>
### F-06.2 · Paiement segmenté Virement · Espèces

| Champ | Valeur |
|---|---|
| 1. Nom | Paiement segmenté Virement · Espèces |
| 2. Objectif utilisateur | Choisir le mode en 1 clic |
| 3. Page | [06](../pages/06-modifier-seance/overview.md) · [12](../pages/12-modifier-seance-collective/overview.md) · [13](../pages/13-parametres/overview.md) |
| 4. Déclencheur | Clic segment |
| 5. Comportement attendu | Change le mode, récap à jour |
| 6. Données nécessaires | mode de paiement |
| 7. États possibles | Virement · Espèces |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-06.3 |
| 12. Desktop | segmenté 44 px |
| 13. Mobile | 48 px |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-063"></a>
### F-06.3 · Calcul TVA en direct

| Champ | Valeur |
|---|---|
| 1. Nom | Calcul TVA en direct |
| 2. Objectif utilisateur | Voir ce que paie le sportif |
| 3. Page | [06](../pages/06-modifier-seance/overview.md) · [12](../pages/12-modifier-seance-collective/overview.md) |
| 4. Déclencheur | Saisie prix / case TVA |
| 5. Comportement attendu | « X € HTVA : le sportif paie Y €, TVA de 21 % comprise. » |
| 6. Données nécessaires | prix, taux TVA (13) |
| 7. États possibles | avec prix · sans prix |
| 8. Validations | prix ≥ 0 |
| 9. Messages d’erreur | — |
| 10. Conséquences | affichage seul |
| 11. Interactions avec | F-13.4 |
| 12. Desktop | ligne F-CALC |
| 13. Mobile | idem |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-064"></a>
### F-06.4 · Card récap pleine largeur

| Champ | Valeur |
|---|---|
| 1. Nom | Card récap pleine largeur |
| 2. Objectif utilisateur | Vérifier avant d’enregistrer |
| 3. Page | [06](../pages/06-modifier-seance/overview.md) · [12](../pages/12-modifier-seance-collective/overview.md) |
| 4. Déclencheur | Toute saisie |
| 5. Comportement attendu | Quand · Durée · Jusqu’au · Prix TTC · Paiement en direct + Enregistrer/Annuler |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | C-RECAP au-dessus |
| 13. Mobile | card qui en tête |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE (validé 4 nov.) |

<a id="f-065"></a>
### F-06.5 · Supprimer la séance

| Champ | Valeur |
|---|---|
| 1. Nom | Supprimer la séance |
| 2. Objectif utilisateur | Changer de type/sportif |
| 3. Page | [06](../pages/06-modifier-seance/overview.md) · [12](../pages/12-modifier-seance-collective/overview.md) |
| 4. Déclencheur | Lien rouge / corbeille |
| 5. Comportement attendu | Confirmation puis suppression |
| 6. Données nécessaires | séance |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | échec → toast |
| 10. Conséquences | séance supprimée |
| 11. Interactions avec | kit Modals |
| 12. Desktop | C-FOOT |
| 13. Mobile | corbeille en-tête |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | EXISTING (TO-VERIFY) + DESIGN-CHANGE |

<a id="f-071"></a>
### F-07.1 · Nouveau message / Nouveau groupe

| Champ | Valeur |
|---|---|
| 1. Nom | Nouveau message / Nouveau groupe |
| 2. Objectif utilisateur | Démarrer une conversation |
| 3. Page | [07](../pages/07-messages/overview.md) |
| 4. Déclencheur | Bouton header, « + », FAB |
| 5. Comportement attendu | Menu 2 choix |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-07.4 |
| 12. Desktop | bouton + menu |
| 13. Mobile | FAB + feuille |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-072"></a>
### F-07.2 · Feuille « Nouveau message » mobile

| Champ | Valeur |
|---|---|
| 1. Nom | Feuille « Nouveau message » mobile |
| 2. Objectif utilisateur | Choisir un destinataire |
| 3. Page | [07](../pages/07-messages/overview.md) |
| 4. Déclencheur | Tap FAB |
| 5. Comportement attendu | Recherche + « Créer un groupe » + sportifs |
| 6. Données nécessaires | sportifs |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | ouvre le fil |
| 11. Interactions avec | F-07.4 |
| 12. Desktop | — |
| 13. Mobile | M-SHEET |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-073"></a>
### F-07.3 · Conversations de groupe

| Champ | Valeur |
|---|---|
| 1. Nom | Conversations de groupe |
| 2. Objectif utilisateur | Écrire à tout un cours |
| 3. Page | [07](../pages/07-messages/overview.md) |
| 4. Déclencheur | Ouverture d’un groupe |
| 5. Comportement attendu | Avatar carré, expéditeur sur les bulles, « N membres · Voir les membres », note de visibilité |
| 6. Données nécessaires | groupe (membres, séance liée) |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-07.5 |
| 12. Desktop | fil |
| 13. Mobile | écran 1c |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (TO-VERIFY modèle de données) |

<a id="f-074"></a>
### F-07.4 · Création de groupe

| Champ | Valeur |
|---|---|
| 1. Nom | Création de groupe |
| 2. Objectif utilisateur | Créer un small group |
| 3. Page | [07](../pages/07-messages/overview.md) |
| 4. Déclencheur | « Nouveau groupe » |
| 5. Comportement attendu | Nom, séance liée facultative (inscrits proposés), membres à cocher, « Créer le groupe (N) » |
| 6. Données nécessaires | nom, membres, séance |
| 7. États possibles | — |
| 8. Validations | nom requis, ≥ 2 membres |
| 9. Messages d’erreur | message sous champ |
| 10. Conséquences | groupe créé |
| 11. Interactions avec | F-07.3 |
| 12. Desktop | M-DIALOG |
| 13. Mobile | M-SHEET 780 px |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-075"></a>
### F-07.5 · Bandeau prochaine séance

| Champ | Valeur |
|---|---|
| 1. Nom | Bandeau prochaine séance |
| 2. Objectif utilisateur | Rappeler le contexte du groupe |
| 3. Page | [07](../pages/07-messages/overview.md) |
| 4. Déclencheur | Fil de groupe |
| 5. Comportement attendu | Date, lieu, inscrits |
| 6. Données nécessaires | séance liée |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-07.3 |
| 12. Desktop | bandeau |
| 13. Mobile | bandeau |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-076"></a>
### F-07.6 · Filtres de conversations

| Champ | Valeur |
|---|---|
| 1. Nom | Filtres de conversations |
| 2. Objectif utilisateur | Trier la liste |
| 3. Page | [07](../pages/07-messages/overview.md) |
| 4. Déclencheur | Clic pilule |
| 5. Comportement attendu | Toutes · Non lues (N) · Sportifs · Groupes + recherche |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | pilules |
| 13. Mobile | pilules |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-077"></a>
### F-07.7 · Actions du fil + composer

| Champ | Valeur |
|---|---|
| 1. Nom | Actions du fil + composer |
| 2. Objectif utilisateur | Agir depuis la conversation |
| 3. Page | [07](../pages/07-messages/overview.md) |
| 4. Déclencheur | Boutons |
| 5. Comportement attendu | « Planifier » / « Voir la séance » ; trombone ; Entrée envoie ; Envoyer grisé si vide |
| 6. Données nécessaires | pièces jointes |
| 7. États possibles | — |
| 8. Validations | message non vide |
| 9. Messages d’erreur | envoi échoué → réessayer |
| 10. Conséquences | message envoyé |
| 11. Interactions avec | kit Modals |
| 12. Desktop | en-tête du fil |
| 13. Mobile | en-tête 1c |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (TO-VERIFY pièces jointes) |

<a id="f-081"></a>
### F-08.1 · Aperçu en direct

| Champ | Valeur |
|---|---|
| 1. Nom | Aperçu en direct |
| 2. Objectif utilisateur | Voir l’exercice avant de le créer |
| 3. Page | [08](../pages/08-creer-exercice/overview.md) · [11](../pages/11-modifier-exercice/overview.md) |
| 4. Déclencheur | Saisie |
| 5. Comportement attendu | Nom, rubrique, muscles, matériel + boutons |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | card au-dessus |
| 13. Mobile | masqué |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-082"></a>
### F-08.2 · Bandeau de variante

| Champ | Valeur |
|---|---|
| 1. Nom | Bandeau de variante |
| 2. Objectif utilisateur | Savoir qu’on crée une copie |
| 3. Page | [08](../pages/08-creer-exercice/overview.md) |
| 4. Déclencheur | Route ?variante= |
| 5. Comportement attendu | « Variante de … L’exercice d’origine reste inchangé. » + « Voir l’original » |
| 6. Données nécessaires | exercice d’origine |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | variante liée |
| 11. Interactions avec | — |
| 12. Desktop | C-INFO |
| 13. Mobile | bandeau |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-083"></a>
### F-08.3 · Pilules rubrique / muscles

| Champ | Valeur |
|---|---|
| 1. Nom | Pilules rubrique / muscles |
| 2. Objectif utilisateur | Choisir vite |
| 3. Page | [08](../pages/08-creer-exercice/overview.md) · [11](../pages/11-modifier-exercice/overview.md) |
| 4. Déclencheur | Clic |
| 5. Comportement attendu | Rubrique unique, muscles multiples + compteur |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | rubrique requise (TO-VERIFY) |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-08.1 |
| 12. Desktop | 34 px |
| 13. Mobile | 40 px |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-084"></a>
### F-08.4 · Aide sous Consignes

| Champ | Valeur |
|---|---|
| 1. Nom | Aide sous Consignes |
| 2. Objectif utilisateur | Guider la saisie |
| 3. Page | [08](../pages/08-creer-exercice/overview.md) · [11](../pages/11-modifier-exercice/overview.md) |
| 4. Déclencheur | — |
| 5. Comportement attendu | « Une étape par ligne… » / « 15 au maximum » |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | ≤ 15 lignes |
| 9. Messages d’erreur | message si dépassé |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | aide |
| 13. Mobile | aide |
| 14. Priorité | P3 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-091"></a>
### F-09.1 · Card sportif + pastille d’état

| Champ | Valeur |
|---|---|
| 1. Nom | Card sportif + pastille d’état |
| 2. Objectif utilisateur | Comprendre où en est l’invitation |
| 3. Page | [09](../pages/09-inviter-sportif/overview.md) |
| 4. Déclencheur | Ouverture |
| 5. Comportement attendu | Avatar, nom, e-mail, pastille |
| 6. Données nécessaires | invitation (statut, expiration) |
| 7. États possibles | 4 états |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-09.2 |
| 12. Desktop | card 560 |
| 13. Mobile | card |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-092"></a>
### F-09.2 · État « Lien généré » + partage

| Champ | Valeur |
|---|---|
| 1. Nom | État « Lien généré » + partage |
| 2. Objectif utilisateur | Envoyer le lien facilement |
| 3. Page | [09](../pages/09-inviter-sportif/overview.md) |
| 4. Déclencheur | Après génération |
| 5. Comportement attendu | Lien affiché une fois, Copier, WhatsApp / E-mail / SMS |
| 6. Données nécessaires | lien, téléphone, e-mail |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | copie refusée → sélectionner le texte |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | grille 3 |
| 13. Mobile | grille 3 + barre fixe |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (liens wa.me / mailto / sms) |

<a id="f-093"></a>
### F-09.3 · Révoquer / régénérer

| Champ | Valeur |
|---|---|
| 1. Nom | Révoquer / régénérer |
| 2. Objectif utilisateur | Gérer un lien perdu |
| 3. Page | [09](../pages/09-inviter-sportif/overview.md) |
| 4. Déclencheur | Boutons état 3 |
| 5. Comportement attendu | Confirmation, invalide l’ancien |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | lien révoqué |
| 11. Interactions avec | kit Modals |
| 12. Desktop | boutons |
| 13. Mobile | idem |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | EXISTING (TO-VERIFY) |

<a id="f-094"></a>
### F-09.4 · Compte activé : actions

| Champ | Valeur |
|---|---|
| 1. Nom | Compte activé : actions |
| 2. Objectif utilisateur | Continuer après activation |
| 3. Page | [09](../pages/09-inviter-sportif/overview.md) |
| 4. Déclencheur | État 4 |
| 5. Comportement attendu | « Voir la fiche » / « Envoyer un message » |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | navigation |
| 11. Interactions avec | 07 |
| 12. Desktop | boutons |
| 13. Mobile | barre fixe |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-101"></a>
### F-10.1 · Cards numérotées pleine largeur

| Champ | Valeur |
|---|---|
| 1. Nom | Cards numérotées pleine largeur |
| 2. Objectif utilisateur | Formulaire lisible |
| 3. Page | [10](../pages/10-nouveau-sportif/overview.md) |
| 4. Déclencheur | — |
| 5. Comportement attendu | 6 sections empilées, titres clairs ; sommaire supprimé |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | cards |
| 13. Mobile | cards |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-102"></a>
### F-10.2 · Pilules lieux / jours + statut segmenté

| Champ | Valeur |
|---|---|
| 1. Nom | Pilules lieux / jours + statut segmenté |
| 2. Objectif utilisateur | Saisie rapide |
| 3. Page | [10](../pages/10-nouveau-sportif/overview.md) |
| 4. Déclencheur | Clic |
| 5. Comportement attendu | Multiples / unique |
| 6. Données nécessaires | lieux, jours, statut |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | 34 px |
| 13. Mobile | 40 px |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-103"></a>
### F-10.3 · Accord explicite pour les blessures

| Champ | Valeur |
|---|---|
| 1. Nom | Accord explicite pour les blessures |
| 2. Objectif utilisateur | Respect des données de santé |
| 3. Page | [10](../pages/10-nouveau-sportif/overview.md) |
| 4. Déclencheur | Interrupteur |
| 5. Comportement attendu | Champ blessures visible seulement si accord ; retrait = effacement |
| 6. Données nécessaires | consentement, blessures |
| 7. États possibles | sans accord · avec accord |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | données de santé |
| 11. Interactions avec | C-HEALTH |
| 12. Desktop | encadré |
| 13. Mobile | idem |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | TO-VERIFY (règle existante ?) |

<a id="f-104"></a>
### F-10.4 · Bouton désactivé sans prénom

| Champ | Valeur |
|---|---|
| 1. Nom | Bouton désactivé sans prénom |
| 2. Objectif utilisateur | Éviter les erreurs |
| 3. Page | [10](../pages/10-nouveau-sportif/overview.md) |
| 4. Déclencheur | Saisie prénom |
| 5. Comportement attendu | Enregistrer grisé tant que vide |
| 6. Données nécessaires | prénom |
| 7. États possibles | — |
| 8. Validations | prénom requis |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | pied de page |
| 13. Mobile | barre fixe |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | EXISTING (règle) + DESIGN-CHANGE |

<a id="f-111"></a>
### F-11.1 · Photo de l’exercice

| Champ | Valeur |
|---|---|
| 1. Nom | Photo de l’exercice |
| 2. Objectif utilisateur | Illustrer l’exercice |
| 3. Page | [11](../pages/11-modifier-exercice/overview.md) |
| 4. Déclencheur | Dépôt / Parcourir |
| 5. Comportement attendu | Upload, vignette, Remplacer/Retirer |
| 6. Données nécessaires | image |
| 7. États possibles | vide · chargée |
| 8. Validations | JPEG/PNG/WebP |
| 9. Messages d’erreur | format invalide |
| 10. Conséquences | stockée en privé |
| 11. Interactions avec | — |
| 12. Desktop | F-DROP |
| 13. Mobile | bouton |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | EXISTING (TO-VERIFY) + DESIGN-CHANGE |

<a id="f-112"></a>
### F-11.2 · Lien vidéo

| Champ | Valeur |
|---|---|
| 1. Nom | Lien vidéo |
| 2. Objectif utilisateur | Montrer l’exécution |
| 3. Page | [11](../pages/11-modifier-exercice/overview.md) |
| 4. Déclencheur | Saisie |
| 5. Comportement attendu | URL ouverte dans un nouvel onglet |
| 6. Données nécessaires | url |
| 7. États possibles | — |
| 8. Validations | URL http(s) |
| 9. Messages d’erreur | URL invalide |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | champ icône |
| 13. Mobile | idem |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | EXISTING (TO-VERIFY) |

<a id="f-113"></a>
### F-11.3 · Supprimer l’exercice

| Champ | Valeur |
|---|---|
| 1. Nom | Supprimer l’exercice |
| 2. Objectif utilisateur | Nettoyer la bibliothèque |
| 3. Page | [11](../pages/11-modifier-exercice/overview.md) |
| 4. Déclencheur | Lien rouge / corbeille |
| 5. Comportement attendu | Confirmation puis suppression |
| 6. Données nécessaires | — |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | supprimé |
| 11. Interactions avec | kit Modals |
| 12. Desktop | card aperçu |
| 13. Mobile | corbeille |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | TO-VERIFY (API) |

<a id="f-121"></a>
### F-12.1 · Sportifs inscrits (collective)

| Champ | Valeur |
|---|---|
| 1. Nom | Sportifs inscrits (collective) |
| 2. Objectif utilisateur | Gérer les participants |
| 3. Page | [12](../pages/12-modifier-seance-collective/overview.md) |
| 4. Déclencheur | Pilules |
| 5. Comportement attendu | Recherche, multi-sélection, compteur, Tout désélectionner |
| 6. Données nécessaires | inscriptions |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | F-12.2 |
| 12. Desktop | section |
| 13. Mobile | card |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | NEW-VALIDATED (TO-VERIFY modèle) |

<a id="f-122"></a>
### F-12.2 · Prix pour toute la séance + prix par inscrit

| Champ | Valeur |
|---|---|
| 1. Nom | Prix pour toute la séance + prix par inscrit |
| 2. Objectif utilisateur | Comprendre le coût par personne |
| 3. Page | [12](../pages/12-modifier-seance-collective/overview.md) |
| 4. Déclencheur | Saisie prix |
| 5. Comportement attendu | « X € TTC pour la séance, soit Y € par inscrit. » |
| 6. Données nécessaires | prix, N |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | affichage seul |
| 11. Interactions avec | F-06.3 |
| 12. Desktop | F-CALC |
| 13. Mobile | idem |
| 14. Priorité | P2 |
| 15. Validation fonctionnelle | NEW-VALIDATED |

<a id="f-123"></a>
### F-12.3 · Note du coach

| Champ | Valeur |
|---|---|
| 1. Nom | Note du coach |
| 2. Objectif utilisateur | Se laisser un mémo |
| 3. Page | [12](../pages/12-modifier-seance-collective/overview.md) |
| 4. Déclencheur | Saisie |
| 5. Comportement attendu | Texte libre enregistré avec la séance |
| 6. Données nécessaires | note |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | section |
| 13. Mobile | card |
| 14. Priorité | P3 |
| 15. Validation fonctionnelle | TO-VERIFY (champ existant ?) |

<a id="f-131"></a>
### F-13.1 · Paramètres en modale à rubriques

| Champ | Valeur |
|---|---|
| 1. Nom | Paramètres en modale à rubriques |
| 2. Objectif utilisateur | Tout régler au même endroit |
| 3. Page | [13](../pages/13-parametres/overview.md) |
| 4. Déclencheur | Ouverture depuis le menu utilisateur |
| 5. Comportement attendu | Menu 5 rubriques avec sous-titres, contenu défilant |
| 6. Données nécessaires | — |
| 7. États possibles | 5 rubriques |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | M-DIALOG 1000×690 |
| 13. Mobile | plein écran |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE ✅ fenêtre par-dessus la page (validé) |

<a id="f-132"></a>
### F-13.2 · Un seul Enregistrer par rubrique

| Champ | Valeur |
|---|---|
| 1. Nom | Un seul Enregistrer par rubrique |
| 2. Objectif utilisateur | Moins de boutons |
| 3. Page | [13](../pages/13-parametres/overview.md) |
| 4. Déclencheur | Clic |
| 5. Comportement attendu | Pied fixe Annuler / Enregistrer |
| 6. Données nécessaires | valeurs de la rubrique |
| 7. États possibles | propre · modifié |
| 8. Validations | selon champ |
| 9. Messages d’erreur | erreurs par champ |
| 10. Conséquences | rubrique enregistrée |
| 11. Interactions avec | — |
| 12. Desktop | pied fixe |
| 13. Mobile | barre fixe |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE (TO-VERIFY API par card) |

<a id="f-133"></a>
### F-13.3 · Préférences (thème, défauts, agenda, notifications)

| Champ | Valeur |
|---|---|
| 1. Nom | Préférences (thème, défauts, agenda, notifications) |
| 2. Objectif utilisateur | Personnaliser |
| 3. Page | [13](../pages/13-parametres/overview.md) |
| 4. Déclencheur | Contrôles |
| 5. Comportement attendu | Thème Clair/Sombre/Système ; valeurs par défaut de « Nouvelle séance » ; heures de l’agenda ; 5 interrupteurs de notifications |
| 6. Données nécessaires | préférences |
| 7. États possibles | — |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | impacte 03, 06, agenda |
| 11. Interactions avec | F-03.6 |
| 12. Desktop | cards |
| 13. Mobile | cards |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | EXISTING (TO-VERIFY) |

<a id="f-134"></a>
### F-13.4 · TVA conditionnelle

| Champ | Valeur |
|---|---|
| 1. Nom | TVA conditionnelle |
| 2. Objectif utilisateur | Éviter un champ inutile |
| 3. Page | [13](../pages/13-parametres/overview.md) |
| 4. Déclencheur | Interrupteur |
| 5. Comportement attendu | Taux visible seulement si « Je facture la TVA » |
| 6. Données nécessaires | tva, taux |
| 7. États possibles | off · on |
| 8. Validations | taux numérique |
| 9. Messages d’erreur | — |
| 10. Conséquences | impacte 04, 06, 12 |
| 11. Interactions avec | F-06.3 |
| 12. Desktop | card |
| 13. Mobile | card |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE |

<a id="f-135"></a>
### F-13.5 · Sécurité (e-mail, mot de passe, appareils)

| Champ | Valeur |
|---|---|
| 1. Nom | Sécurité (e-mail, mot de passe, appareils) |
| 2. Objectif utilisateur | Protéger le compte |
| 3. Page | [13](../pages/13-parametres/overview.md) |
| 4. Déclencheur | Boutons |
| 5. Comportement attendu | Changement d’e-mail par lien, mot de passe ≥ 10, Déconnecter partout (rouge, confirmation) |
| 6. Données nécessaires | compte |
| 7. États possibles | — |
| 8. Validations | ≥ 10 car., confirmation identique |
| 9. Messages d’erreur | messages sous champ |
| 10. Conséquences | sessions révoquées |
| 11. Interactions avec | kit Modals |
| 12. Desktop | cards |
| 13. Mobile | cards |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | EXISTING (TO-VERIFY) |

<a id="f-136"></a>
### F-13.6 · Menu déroulant de rubriques (mobile)

| Champ | Valeur |
|---|---|
| 1. Nom | Menu déroulant de rubriques (mobile) |
| 2. Objectif utilisateur | Changer de rubrique simplement |
| 3. Page | [13](../pages/13-parametres/overview.md) |
| 4. Déclencheur | Tap |
| 5. Comportement attendu | Menu sous le bouton, ✓ sur l’actif |
| 6. Données nécessaires | — |
| 7. États possibles | fermé · ouvert |
| 8. Validations | — |
| 9. Messages d’erreur | — |
| 10. Conséquences | — |
| 11. Interactions avec | — |
| 12. Desktop | — |
| 13. Mobile | bouton 56 px |
| 14. Priorité | P1 |
| 15. Validation fonctionnelle | DESIGN-CHANGE (validé 4 nov.) |

