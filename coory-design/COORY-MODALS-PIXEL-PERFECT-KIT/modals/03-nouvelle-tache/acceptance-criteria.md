# 03 — Critères d’acceptation

- [x] Rendu desktop superposé à `screenshots/desktop-original.png` : écart ≤ 1 px sur positions, tailles, rayons.
- [x] Rendu mobile 390 px superposé à `screenshots/mobile-original.png`.
- [x] Textes identiques à la spec (hors données dynamiques).
- [x] Icônes Lucide indiquées, trait 1.8–2.
- [x] Ouverture / fermeture (✕, overlay, Échap, Annuler).
- [x] Fonctionnalité métier existante intacte.
- [x] Testé à 1280, 1440, 1920, 2560, 3440 px et 360, 390, 430 px.

Mesuré le 04/11/2026 (phase E) : 0 px d'écart, ordinateur (1200 × 780) et téléphone (390 × 844) : boîte, libellés, champs 46 / 50, pastilles, segments, zone de texte, pied fixe (Annuler 91 px, principal), icônes de champ. Écarts voulus : texte des champs en 16 px sur téléphone (15 dans le kit) pour que Safari n'agrandisse pas la page au toucher ; la date suit la langue du navigateur (jj/mm/aaaa en français). Erreur : message 13 px rouge sous les champs (comme avant, au niveau du formulaire, pas champ par champ).
