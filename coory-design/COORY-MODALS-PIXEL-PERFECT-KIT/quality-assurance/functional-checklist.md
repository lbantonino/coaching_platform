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
