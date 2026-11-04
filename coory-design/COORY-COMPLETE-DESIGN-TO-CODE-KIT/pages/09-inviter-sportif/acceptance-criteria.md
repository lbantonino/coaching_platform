# 09 · Inviter un sportif — critères d’acceptation

> Implémentée dans COORY le 04/11/2026 (D-119). Vérifiée au navigateur à 1280 et 390 px (états 1 à 4, clair et sombre), à 320 / 430 / 1440 / 3440 px, et par le parcours Playwright `tests/e2e/invitation.spec.ts`.

## Spécifiques
- [x] Le lien n’est affiché qu’à l’état 2 (jamais réaffiché ensuite). *Il n’existe que dans la réponse de la génération ; un rechargement montre l’état « En attente ».*
- [x] Les 4 états sont atteints avec les vraies données d’invitation. *Sophie (pas encore invitée → lien prêt), Lucas (en attente jusqu’au 10 nov.), Thomas (compte activé). Deux états de l’app conservés en plus : « Lien expiré » (pastille grise) et fiche sans e-mail (message rouge, bouton grisé).*

## Critères communs (toutes les pages)
- [x] Shell global inchangé (sidebar, header, Assistant IA, cloche, badges) — seule l’entrée active et le titre varient. *Fil d’Ariane aux valeurs du kit (12 px, flèche 12) ; l’icône de titre et la cloche du shell sont gardées (absentes de cette maquette, présentes sur 06, 08, 11).*
- [x] Superposition à 1280 px avec `screenshots/desktop-original*.png` : écart ≤ 2 px sur positions, tailles, rayons ; couleurs identiques aux valeurs de `layout-measurements.md`. *Carte 560 px à x = 488 (maquette ≈ 490), y = 123 (≈ 125) ; en-tête 65 px.*
- [x] Superposition à 390 px avec `screenshots/mobile-original*.png` (hors barre d’état de présentation). *Carte, pastille, champ, boutons, rappel et barre fixe conformes ; écarts voulus : en-tête SH-05 avec « ← écran précédent » (décision du 4 nov.) et titre une seule fois en tête du contenu ; marges latérales du shell (14 px au lieu de 12).*
- [x] Police Plus Jakarta Sans, graisses et tailles conformes à `content.md` / `layout-measurements.md`.
- [x] Tous les éléments de `interactive-elements.md` sont branchés (aucun bouton mort, sauf ceux marqués PROPOSED et masqués/désactivés). *Générer (confirmation s’il y a un lien en attente), Copier (toast « Lien copié. »), WhatsApp / E-mail / SMS (liens préremplis, rien n’est envoyé par Coory), Révoquer (confirmation), Voir la fiche, Envoyer un message.*
- [x] Aucune fonctionnalité existante retirée ; données de démo remplacées par les données réelles. *Photo réelle du sportif à la place des initiales colorées ; seul « Révoquer » d’un lien déjà expiré n’est plus proposé (sans effet).*
- [x] 1440 / 1920 / 2560 / 3440 px : pas d’étirement au-delà des plafonds de `design-system/responsive.md`. *Carte toujours 560 px centrée.*
- [x] Mobile 320 / 390 / 430 px + clavier ouvert : aucun chevauchement, zones tactiles ≥ 44 px. *Aucun champ de saisie sur cette page ; barre fixe 54 px.*
- [x] Navigation clavier complète, focus visible, aria-labels présents.
