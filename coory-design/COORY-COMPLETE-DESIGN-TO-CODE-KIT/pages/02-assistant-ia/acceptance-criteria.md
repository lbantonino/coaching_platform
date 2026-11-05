# 02 · Assistant IA — critères d’acceptation

## Spécifiques
- [x] Le bouton global garde son design et ouvre la boîte sur toutes les pages.
- [x] Aucune action n’est exécutée sans clic sur « Valider N actions ».
- [x] Envoyer est désactivé tant que la saisie est vide.
- [x] L’historique liste les conversations réelles groupées par date ; un clic rouvre la conversation (après implémentation de F-02.6).

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

## Notes de réalisation (05/11/2026, D-132)
- Pas de fournisseur d'IA (décision 15) : réponse honnête « pas encore branché », rien n'est envoyé ni enregistré ; l'historique l'explique.
- « Joindre », « Dicter » et « + Plus d'options » (téléphone) : non affichés tant que rien n'est branché (pas de bouton mort).
- « Actions proposées » : composant prêt (ProposedActions), affiché quand une vraie réponse en proposera.
- Téléphone : la boîte sous la barre du haut sans la petite flèche ; panneau Historique en feuille (non dessiné dans le kit).
