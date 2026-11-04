# 02 — Critères d’acceptation

- [ ] Rendu desktop superposé à `screenshots/desktop-original.png` : écart ≤ 1 px sur positions, tailles, rayons.
- [x] Rendu mobile 390 px superposé à `screenshots/mobile-original.png`.
- [x] Textes identiques à la spec (hors données dynamiques).
- [x] Icônes Lucide indiquées, trait 1.8–2.
- [x] Ouverture / fermeture (✕, overlay, Échap, Annuler).
- [x] Fonctionnalité métier existante intacte.
- [x] Testé à 1280, 1440, 1920, 2560, 3440 px et 360, 390, 430 px.

Mesuré le 04/11/2026 (phase F) : tous les éléments dessinés à 0 px, ordinateur et téléphone (type, titre, discipline, lieu, date, heure avec horloge, durée « min », carte « Chaque semaine… », sportif, carte « Nouveau sportif »). ⚠️ ÉCARTS : les champs Prix, Paiement, « TVA comprise » et Note du coach existent dans le code mais pas dans la maquette : gardés (le kit demande de garder les champs), au même style, sous les champs dessinés, la boîte atteint donc sa hauteur maximale et défile. La carte « Nouveau sportif » porte une vraie description (« Sa fiche est créée avec son nom, à compléter ensuite. ») au lieu du « 6 » de la maquette (erreur de données du kit). Sous-titre par défaut du kit ; quand on ouvre depuis une fiche, il dit « Avec … » (comportement existant). La page « Modifier la séance » (hors boîtes) garde son allure.
