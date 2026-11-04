# 23 — Critères d’acceptation

- [x] Rendu desktop superposé à `screenshots/desktop-original.png` : écart ≤ 1 px sur positions, tailles, rayons.
- [x] Rendu mobile 390 px superposé à `screenshots/mobile-original.png`.
- [x] Textes identiques à la spec (hors données dynamiques).
- [x] Icônes Lucide indiquées, trait 1.8–2.
- [x] Ouverture / fermeture (✕, overlay, Échap, Annuler).
- [x] Fonctionnalité métier existante intacte.
- [x] Testé à 1280, 1440, 1920, 2560, 3440 px et 360, 390, 430 px.

Mesuré le 04/11/2026 (phase H) : 0 px d'écart sur la boîte (980 × 700 ; feuille pleine hauteur sur téléphone), l'en-tête, les boutons, la zone grise, « Ouvrir le PDF », les 3 tuiles et la date. Le contenu de la page diffère, comme le kit le demande : la maquette dessine une fausse facture, l'app montre le vrai fichier (PDF dans le lecteur du navigateur, image telle quelle). Sur téléphone, la vignette est une page blanche avec l'icône du type de fichier (pas de rendu du PDF sans bibliothèque supplémentaire). Le nom du sportif reste un lien vers sa fiche.
