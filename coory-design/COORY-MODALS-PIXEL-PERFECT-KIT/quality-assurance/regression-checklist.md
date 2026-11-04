# regression-checklist

- [ ] Routes, API, permissions, validations et actions métier inchangées
- [ ] tests existants verts
- [ ] pas de modification hors des 36 boîtes.

## Suivi par phase

### Phase A : coque commune (04/11/2026)
Vérifié sur la coque partagée (menu « Créer », formulaire « Nouvelle tâche », confirmation « Supprimer ce document ? », panneau « Paramètres »). La liste ci-dessus reste à cocher boîte par boîte (phases B à H), puis globalement (phase I).

- [x] Routes, API, permissions, validations et actions métier inchangées (seules la présentation de overlay.tsx et deux classes de mise en page ont changé)
- [x] tests existants verts : Vitest 264/264 ; Playwright 171 réussis + 17 ignorés ; Documents rejoués verts sous Node 24. Un échec ANTÉRIEUR à la phase A : « la recherche… » sur téléphone (échoue aussi sur le code d'avant, 2 fois sur 2), signalé à Antonino
- [x] pas de modification hors des boîtes, sauf deux dépendances de l'ancien défilement : retour en haut des Paramètres, pied fixe de « Nouvelle séance »

### Phase B : menus simples 36, 30, 17, 05, 22, 09 (04/11/2026)
- [x] aucune action métier modifiée ; seuls les textes des menus (sous-titres réels, descriptions, « Supprimer la séance ») et une entrée « Modifier » vers une page existante (17)

### Phase C : confirmations 11, 12, 18, 20, 25, 29, 31, 35 (04/11/2026)
- [x] textes : « ses documents restent » corrigé pour les catégories de dépenses (défaut réel, signalé)

### Phase I : validation globale (04/11/2026)
- [x] suite Playwright complète (voir SUIVI, D-116) ; échec instable de l'invitation résolu (le menu du compte se ferme au moment de « Se déconnecter »)
