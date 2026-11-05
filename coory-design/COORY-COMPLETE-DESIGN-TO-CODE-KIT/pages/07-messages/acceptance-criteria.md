# 07 · Messages — critères d’acceptation

## Spécifiques
- [x] Un groupe se distingue visuellement (avatar carré, nom de l’expéditeur sur chaque bulle).
- [x] Le modèle de données des groupes est vérifié avant implémentation.

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

## Notes de réalisation (05/11/2026, D-131)
- Groupes (filtres Sportifs / Groupes, « Nouveau groupe », bandeau de séance, « Voir les membres ») et pièces jointes (trombone) : non faits, décisions 12 et 13 d'Antonino (plus tard, avec l'espace sportif).
- « + » de la liste et « Nouveau message » : directement la feuille « Nouveau message » (sans menu, puisqu'il n'y a pas de groupe).
- Menu « ··· » du fil : Voir la fiche, Voir son agenda.
