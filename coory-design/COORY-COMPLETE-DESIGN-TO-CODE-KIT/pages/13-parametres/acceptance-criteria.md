# 13 · Paramètres — critères d’acceptation

## Spécifiques
- [x] La rubrique Profil est strictement inchangée.
- [x] Aucune route /parametres : fenêtre par-dessus la page sur desktop et mobile.
- [x] Un seul bouton Enregistrer par rubrique.
- [x] Taux de TVA masqué si la TVA n’est pas facturée.
- [x] Mobile : menu déroulant, pas d’onglets défilants.

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

## Notes de réalisation (05/11/2026, D-127)
- Profil : contenu et comportement inchangés (sa photo, sa grille, son pied « Annuler / Enregistrer ») ; sur téléphone il est posé dans une carte blanche, comme les autres rubriques ; son entrée de menu prend le style du kit.
- `/coach/profil?onglet=…` redirige vers `/coach?parametres=…` (fenêtre par-dessus le tableau de bord) ; `/coach/profil/export` reste.
- Ligne courte de « Pays, devise et TVA » calculée (« Belgique · EUR · 21 % », « sans TVA » à 0 %).
- Aide du prix par défaut au taux de l'organisation (la maquette écrit 21 %).
- Gardés en plus du kit : l'historique des changements de devise, l'interdiction aux non-propriétaires (champs grisés, pas d'Enregistrer), la vérification en direct de l'e-mail et du prix.
- Modifications non enregistrées en changeant de rubrique : pas de confirmation (PROPOSED dans le kit, non validé).
