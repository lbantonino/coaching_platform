# 33 — Critères d’acceptation

- [x] Rendu desktop superposé à `screenshots/desktop-original.png` : écart ≤ 1 px sur positions, tailles, rayons.
- [x] Rendu mobile 390 px superposé à `screenshots/mobile-original.png`.
- [x] Textes identiques à la spec (hors données dynamiques).
- [x] Icônes Lucide indiquées, trait 1.8–2.
- [x] Ouverture / fermeture (✕, overlay, Échap, Annuler).
- [x] Fonctionnalité métier existante intacte.
- [x] Testé à 1280, 1440, 1920, 2560, 3440 px et 360, 390, 430 px.

Mesuré le 04/11/2026 (phase H) : 0 px d'écart, ordinateur (1000 × 700 : colonne des sections de 250 px, section Profil du kit) et téléphone (sommaire). La section Profil garde ses deux enregistrements (profil ; nom de l'organisation, réservé au propriétaire) : chaque champ est relié à son formulaire, « Enregistrer » envoie le profil et le nom s'il a changé. ⚠️ Les autres sections (Préférences, Pays devise et TVA, Sécurité, Données) ne sont pas dessinées par le kit : elles gardent leur contenu actuel dans la nouvelle mise en page. Sous-titre « Ce que tes sportifs voient de toi. » pour le Profil, la description de la section pour les autres. La page /coach/profil garde sa propre mise en page.
