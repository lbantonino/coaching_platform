# 01 · Tâches — critères d’acceptation

## Spécifiques
- [ ] Les 4 vues intelligentes affichent les bons compteurs (Aujourd’hui 3, À venir 6, Toutes 9, Terminées 0 en démo).
- [ ] Créer une liste inline lui donne la couleur suivante de la palette.
- [ ] Cocher une tâche met à jour tous les compteurs immédiatement.
- [ ] Mobile : passage 1b → 1c → 1b sans perte de saisie.

## Critères communs (toutes les pages)
- [ ] Shell global inchangé (sidebar, header, Assistant IA, cloche, badges) — seule l’entrée active et le titre varient.
- [ ] Superposition à 1280 px avec `screenshots/desktop-original*.png` : écart ≤ 2 px sur positions, tailles, rayons ; couleurs identiques aux valeurs de `layout-measurements.md`.
- [ ] Superposition à 390 px avec `screenshots/mobile-original*.png` (hors barre d’état de présentation).
- [ ] Police Plus Jakarta Sans, graisses et tailles conformes à `content.md` / `layout-measurements.md`.
- [ ] Tous les éléments de `interactive-elements.md` sont branchés (aucun bouton mort, sauf ceux marqués PROPOSED et masqués/désactivés).
- [ ] Aucune fonctionnalité existante retirée ; données de démo remplacées par les données réelles.
- [ ] 1440 / 1920 / 2560 / 3440 px : pas d’étirement au-delà des plafonds de `design-system/responsive.md`.
- [ ] Mobile 320 / 390 / 430 px + clavier ouvert : aucun chevauchement, zones tactiles ≥ 44 px.
- [ ] Navigation clavier complète, focus visible, aria-labels présents.
