# functional-checklist

- [ ] Ouverture
- [ ] fermeture ✕/overlay/Échap/Annuler
- [ ] retour sous-menu
- [ ] soumission
- [ ] validation
- [ ] erreurs
- [ ] chargement
- [ ] données conservées
- [ ] aucune régression.

## Suivi par phase

### Phase A : coque commune (04/11/2026)
Vérifié sur la coque partagée (menu « Créer », formulaire « Nouvelle tâche », confirmation « Supprimer ce document ? », panneau « Paramètres »). La liste ci-dessus reste à cocher boîte par boîte (phases B à H), puis globalement (phase I).

- [x] Ouverture (4 familles, ordinateur et téléphone, clair et sombre)
- [x] fermeture ✕ / fond / Échap / Annuler (40 contrôles sur 40) ; glissé vers le bas sur téléphone
- [ ] retour sous-menu : phase D
- [ ] soumission, validation, erreurs, chargement : phases E et F (formulaires)
- [x] données conservées : la copie animée de sortie garde la saisie et la position du défilement
- [x] aucune régression : voir regression-checklist

### Phase B : menus simples 36, 30, 17, 05, 22, 09 (04/11/2026)
- [x] chaque action garde son appel métier (notifications, paiement, séance, documents, objectifs, « Créer pour »)
- [x] tests de parcours concernés : 57 réussis, 9 ignorés, 0 échec (comptabilité, agenda, vue d'ensemble, documents, objectifs, notifications, séances, audit UX)

### Phase C : confirmations 11, 12, 18, 20, 25, 29, 31, 35 (04/11/2026)
- [x] appels de suppression inchangés ; seuls les textes (nom cité en gras) et les icônes changent

### Phase D : menus à sélection et sous-menus 07, 08, 14, 15, 06, 13, 01 (04/11/2026)
- [x] retour sous-menu : 06 → 07 / 08 et 13 → 14 / 15, flèche ← vers le menu de départ ; 14 / 15 sans retour depuis la pastille
- [x] changement de statut et de programme : mêmes appels qu'avant (setAthletesStatus, setAthletesProgramType)

### Phase E : formulaires simples 24, 03, 19, 21 (04/11/2026)
- [x] soumission par le bouton du pied (attribut form), validations et appels inchangés ; erreurs affichées ; bouton désactivé pendant l'envoi (« Enregistrement… », « Envoi… »)
- [x] tests : 24 réussis, 4 ignorés (documents, notifications, recherche, tâches, vue d'ensemble, audit)

### Phase F : formulaires riches 02, 04, 10, 27, 34, 26, 28 (04/11/2026)
- [x] tous les champs existants gardés (prix et note de la séance, forfait, répétition mensuelle, fin de répétition, nouveau sportif, sportifs inscrits) ; mêmes noms, mêmes envois
- [x] erreur de champ : bordure rouge sur le champ marqué invalide (aria-invalid, posé par la vérification existante)

### Phase G : cas à part 16, 32 (04/11/2026)
- [x] vue de l'agenda : liens, raccourcis J S M L T ← →, cases Individuelles / Collectives inchangés ; la feuille se referme quand l'adresse change
- [x] menu du compte : Mon profil, Paramètres (fenêtre), Changer de compte, thème, Se déconnecter inchangés ; ouverture au clic seulement (signalé)

### Phase H : grands panneaux 23, 33 (04/11/2026)
- [x] aperçu : Télécharger, Modifier, Supprimer, Ouvrir le PDF inchangés
- [x] Paramètres : sections, retour au sommaire (téléphone), photo, profil et organisation enregistrés comme avant ; page /coach/profil inchangée
