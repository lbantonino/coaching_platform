# 03 · Notifications — critères d’acceptation

## Spécifiques
- [x] Masquer ≠ Supprimer (Masquées réversible).
- [x] Toast « Annuler » restaure exactement l’état précédent.
- [x] Badge de la cloche, entrée de menu et pastilles de section suivent les non lues en direct.

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

## Notes de réalisation (05/11/2026, D-128)
- Supprimer : colonne `deleted_at` (décision 11) ; la suppression est enregistrée tout de suite, « Annuler » (5 s) l'efface.
- Menu « ··· » : ancré sous le bouton sur ordinateur ; sur téléphone, feuille du bas (comme tous les menus de l'app) plutôt que le menu flottant de la maquette.
- Onglets du téléphone sans le nombre (place), comme la maquette ; le nombre reste lu par les lecteurs d'écran.
- Compétitions : le jour en étiquette, « J-3 » à droite (visible aussi sur téléphone).
- Séances à encaisser : avatar aux initiales (la donnée ne porte pas la photo du sportif).
