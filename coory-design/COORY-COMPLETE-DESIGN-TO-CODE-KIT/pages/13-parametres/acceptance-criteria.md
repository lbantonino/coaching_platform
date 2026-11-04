# 13 · Paramètres — critères d’acceptation

## Spécifiques
- [ ] La rubrique Profil est strictement inchangée.
- [ ] Aucune route /parametres : fenêtre par-dessus la page sur desktop et mobile.
- [ ] Un seul bouton Enregistrer par rubrique.
- [ ] Taux de TVA masqué si la TVA n’est pas facturée.
- [ ] Mobile : menu déroulant, pas d’onglets défilants.

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
