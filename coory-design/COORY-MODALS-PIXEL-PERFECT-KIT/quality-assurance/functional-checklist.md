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
