# 10 · Nouveau sportif — critères d’acceptation

## Spécifiques
- [x] Aucune règle de validation modifiée (prénom seul obligatoire).
- [x] Le champ blessures n’existe pas dans le DOM sans accord.

## Critères communs (toutes les pages)
- [x] Shell global inchangé (sidebar, header, Assistant IA, cloche, badges) — seule l’entrée active et le titre varient.
- [x] Superposition à 1280 px avec `screenshots/desktop-original*.png` : écart ≤ 2 px sur positions, tailles, rayons ; couleurs identiques aux valeurs de `layout-measurements.md`.
- [x] Superposition à 390 px avec `screenshots/mobile-original*.png` (hors barre d’état de présentation).
- [x] Police Plus Jakarta Sans, graisses et tailles conformes à `content.md` / `layout-measurements.md`.
- [x] Tous les éléments de `interactive-elements.md` sont branchés (aucun bouton mort, sauf ceux marqués PROPOSED et masqués/désactivés).
- [x] Aucune fonctionnalité existante retirée ; données de démo remplacées par les données réelles.
- [x] 1440 / 1920 / 2560 / 3440 px : pas d’étirement au-delà des plafonds de `design-system/responsive.md`.
- [x] Mobile 320 / 390 / 430 px + clavier ouvert : aucun chevauchement, zones tactiles ≥ 44 px.
- [x] Navigation clavier complète, focus visible, aria-labels présents.

## Notes de réalisation (05/11/2026, D-126)
- En-tête : règle d'Antonino D-124 (« ← Sportifs · Nouveau sportif » sur une ligne ; téléphone : retour dans la barre, titre sous la barre), pas l'en-tête « ← Titre » de la maquette.
- Téléphone : marges de 14 px (celles de toute l'app) au lieu de 12 px ; barre fixe « Annuler / Enregistrer le sportif » (décision validée du 04/11).
- Gardés en plus du kit : « Comment ? » (preuve de l'accord) dans l'encadré, la carte « Données de santé » aussi sur téléphone, la vérification en direct de l'e-mail, du téléphone et de la date.
