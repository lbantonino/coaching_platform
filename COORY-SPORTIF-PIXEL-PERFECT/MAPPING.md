# Correspondance maquette → code COORY (étape 0)

> Établi le 3/11/2026 par Claude Code à partir du code réel (`src/`). Sert de référence pour les 12 pages.
> Règle suivie : réutiliser l'existant, créer un composant seulement s'il manque, ne supprimer aucun comportement.

## 1. Police et jetons

| Sujet | Maquette | App | Écart / décision |
|---|---|---|---|
| Police | Plus Jakarta Sans 400/500/600/700 | Plus Jakarta Sans via `next/font` (`src/app/layout.tsx`, D-77) | **Identique**, rien à changer |
| Thème | clair uniquement | clair **et** sombre (`src/styles/tokens.css`, `[data-theme]`) | La maquette décrit le clair ; le sombre suit les mêmes jetons. Jamais de couleur en dur (règle CLAUDE.md) |
| Fond d'app `#f3f2f7` | | `--page`/`--bg` `#f3f2f7` | Identique |
| Carte `#fff` | | `--surface` `#fff` | Identique |
| Sous-surface `#f8f7fb` | | `--surface-2` `#f8f7fb` | Identique |
| Encre `#17151d` | | `--text` `#17151d` | Identique |
| Texte secondaire `#4a4855` | | `--text-2` `#3b3946` | Proche ; à aligner si validé |
| Atténué `#64626e` | | `--muted` `#64626e` | Identique |
| Discret `#8b8996` | | `--faint` `#6e6c79` | **Volontaire** : `#8b8996` ne fait que 3,4:1 sur le fond (non conforme WCAG pour du texte). À garder |
| Violet `#8b5cf6` / texte `#6a3ee0` | | `--violet` / `--violet-text` | Identiques |
| Fond sélection `rgba(139,92,246,.10–.12)` | | `--selected`, `--violet-soft(-2)` | Identiques |
| Bouton principal `#17151d` | | `--cta` (noir en clair, blanc en sombre, D-77) | Identique en clair |
| Actif `#15803d` | | `--ok` | **Aligné le 3/11** (choix d'Antonino) |
| En pause `#d08a1c` (point), `#a86410` (texte) | | `--warn-dot`, `--warn` | **Aligné le 3/11** |
| Archivé `#a3a1ad` (point) | | `--archived-dot` | **Ajouté le 3/11** |
| ♀ `#c2266b` / ♂ `#2f6fbf` | | `--female` / `--male` | **Aligné le 3/11** |
| Disciplines (points) `#DD2D4A` `#FEC14F` `#7776FF` `#26CBB8` | | `--strength-fill` `--hyrox-fill` `--run-fill` `--hybrid-fill` | Identiques |
| Avatars pastel `#f2d9df` `#dfddf6` `#d6ebe5` `#f0e5d6` | | `Avatar` : `--chip` ou teinte de discipline (`disciplineStyles[x].avatar`) | Avatars pastel non présents : la teinte de discipline joue ce rôle (et les photos de profil existent) |
| Rayons 20 / 14 / 12 / 10 / 9 | | `rounded-card` (20), `rounded-control` (12), valeurs directes | Disponibles |
| Contours `inset 0 0 0 1px` | | `border border-line` ou `inset-ring` (Tailwind 4) | `inset-ring` déjà utilisé (page séance D-88) : pas de changement de dimensions |

## 2. Coque commune

| Maquette | Code existant | Écart |
|---|---|---|
| Panneau latéral 236 px, padding `24px 14px 16px`, cadre à 14 px du bord | `src/components/layout/app-shell.tsx` | **Aligné le 3/11 pour toutes les pages** (Antonino : le menu doit être le même partout) |
| Items du menu h34, icône 16, `400 13.5px`, actif `rgba(139,92,246,.12)` | `side-nav.tsx`, `nav-item.ts`, `navigation.ts` | **Aligné le 3/11** (34 px, filet entre les groupes) |
| Entrée « Facturation » dans le menu | **retirée le 3/11 (D-90)** | À ne PAS remettre |
| Carte utilisateur en pied (avatar 38, anneau violet) | `account-menu.tsx` | Existe |
| Header global (titre + recherche ⌘K + Assistant IA + cloche + action) | `page-header.tsx` (`PageHeader`) + `header-tools.tsx` (`HeaderTools`) | **Aligné le 3/11** : à 20 px du menu et 14 px du bord, 64 px de haut, recherche 200 px |
| Barre mobile (☰ 44 · titre · pilule IA / cloche / +) | `mobile-bar.tsx` (portails `MobileBarTitle`, `MobileBarTool`, `MobileBarAction`) | **Aligné le 3/11** : ☰ 44, pilule 48, boutons 40, marges de page 14 |
| Tiroir du ☰ | `mobile-menu.tsx` (la page glisse, D-83) | Existe |

## 3. Composants : maquette → existant

| Composant maquette | Existant | Fichier | Décision |
|---|---|---|---|
| Bouton principal noir (h32 header, h38–40 formulaire) | `buttonClass({ variant: "primary" })` (`sm` h36, `md` h44) | `components/ui/button.ts` | Réutiliser ; hauteurs exactes par classes `h-8!` comme en D-88 |
| Bouton contour | `buttonClass({ variant: "outline" })` | idem | Réutiliser |
| Bouton icône carré 32 / 40 | `iconButtonClass({ size })` (36 / 44) | idem | Réutiliser, taille ajustée par classe |
| Bouton IA violet | `HeaderTools` / barre mobile | `header-tools.tsx` | Existe |
| Champ / select / textarea h46 r12 | `inputClass`, `entryInputClass`, `textareaClass`, `labelClass`, `hintClass` ; **habillage fiche** `ficheInputClass`, `ficheTextareaClass`, `ficheLabelClass`, `ficheHintClass`, `ficheOvertitleClass`, `ficheGridClass` (3/11, D-93) | `components/ui/form-styles.ts` | Fiche : `look="fiche"` sur les champs partagés (`athlete-fields.tsx`), à réutiliser en 2f à 2i |
| Contrôle segmenté | `Segmented` (`look="track"` : piste grise, option en verre, 3/11, D-93), `SegmentedNav` | `components/ui/segmented.tsx` | Fiche : `look="track"` |
| Menu déroulant (listbox sous le bouton) | **`Dropdown` créé le 3/11** (`components/ui/dropdown.tsx`) ; `ActionMenu` reste pour les menus d'actions ; menu des semaines de 2c : `WeekPicker` (grille de liens, D-94) | `components/ui/dropdown.tsx`, `sportifs/[athleteId]/week-picker.tsx` | À réutiliser en 2g |
| Onglets de la fiche | Barre dans `AthleteIdentity` (`sportifs/[athleteId]/athlete-header.tsx`) | — | **Fait le 3/11 (D-92)**, ordre de la maquette choisi par Antonino ; **sans piste** à sa demande (D-93), onglet ouvert en verre (jetons `--glass`) |
| Sélecteur d'onglet mobile (n / 10) | `FicheTabSelect` | `sportifs/[athleteId]/fiche-tab-select.tsx` | **Fait le 3/11 (D-92)** |
| Carte standard r20 p22 | `Card`, `CardTitle`, `CardEmpty`, `MicroLabel` | `components/ui/card.tsx` | Réutiliser |
| Sous-carte `#f8f7fb` | classes `bg-surface-2 rounded-2xl` | — | Classes directes |
| Badge h24 | `Badge`, `StatusBadge`, `CountBadge` | `components/ui/badge.tsx`, `count-badge.tsx` | Réutiliser |
| Avatar sportif (32–64) | `Avatar` (2xs 24 → xl 64, photo, pastille sexe) | `components/ui/avatar.tsx` | Réutiliser ; tailles 40/44 = `md` / classe |
| Symbole ♀ / ♂ | `SexMark` | `components/ui/sex-mark.tsx` | Réutiliser |
| Case à cocher | `Checkbox` | `components/ui/checkbox.tsx` | Réutiliser (style de la case à aligner : 18 px desktop, 22 px mobile) |
| Interrupteur | `Toggle` | idem | Réutiliser |
| Puces de choix multiples (« ✓ ») | `checkboxChipClass`, `chipClass` ; fiche : `ficheChipClass` (violet, « ✓ » en pseudo-élément, D-93) | `form-styles.ts`, `chip.ts` | Réutiliser |
| Accordéon | `<details>` natif (déjà utilisé) | — | Réutiliser |
| Confirmation destructive | `ConfirmDialog`, `ConfirmSubmitButton`, `DeleteMoreMenu` | `overlay.tsx`, `more-menu.tsx` | Conserver les confirmations existantes |
| Message éphémère (toast) | `useToast` | `components/ui/toast.tsx` | Réutiliser (non dessiné dans la maquette) |
| Squelettes de chargement | `SkeletonLines`, `SkeletonBar`, `PageLoading` | `skeleton.tsx`, `page-header.tsx` | Réutiliser |
| Graphique d'évolution (2g) | `ReferenceChart` | `sportifs/[athleteId]/reference-chart.tsx` | Existe, à adapter en page 2g |
| Calculateur Cooper / 5 km (2g) | `TestCalculator` | `test-calculator.tsx` | Existe |
| Historique (2k) | `ActivityTimeline` | `activity-timeline.tsx` | Existe |
| Icônes | `lucide-react` (une seule famille) | — | La maquette dessine des SVG au trait équivalents : on garde Lucide |

## 4. Modèles de données (vraies données, jamais celles de la maquette)

| Maquette | Type / requête | Fichier |
|---|---|---|
| Sportif (liste) | `AthleteListItem` : nom, sexe, photo, niveau, statut, type de programme, objectif principal, prochaine compétition, compte activé, invitation en attente, infos manquantes | `features/athletes/queries.ts` (`listAthletes`) |
| Sportif (fiche) | `AthleteDetail` + `AddressFormValues`, `AvailabilityFormValues`, `HealthNotesState` | `features/athletes/*` |
| Statut | `AthleteStatus` = active / paused / archived ; changement groupé `setAthletesStatus` | `features/athletes/schemas.ts`, `actions.ts` |
| Programme (type) | `Discipline` = running / strength / hyrox / hybrid ; changement groupé `setAthletesProgramType` | `domain/training/discipline.ts` |
| Programme (contenu) | `AthleteProgram`, `ProgramWeek`, `ProgramSessionCard`, `ActiveProgram` | `features/programs/*` |
| Séance | `CoachSession`, `Occurrence`, `SessionException`, prix et paiements | `features/sessions/*` |
| Objectif | `GoalEntry`, `AthleteGoals`, `GoalType`, `GoalPriority`, `GoalStatus` | `features/goals/*` |
| Repère / mesure | `ReferenceEntry`, `AthleteReferences`, `ReferenceKind`, `ReferenceSeries` | `features/references/*` |
| Performance (records) | `RecordEntry`, `AthleteRecords` | `features/records/*` |
| Note | `CoachNote`, `AthleteNotes` (+ blessures avec accord santé : `features/consents`) | `features/notes/*`, `features/consents/*` |
| Document | `CoachDocument` | `features/documents/*` |
| Événement d'historique | `ActivityEvent`, `ActivityKind` | `features/activity/*` |
| Invitation | lien à usage unique, affiché une fois, copié par le coach (pas d'envoi d'e-mail) | `features/invitations/*` |

## 5. Pages : maquette → route

| Page | Route existante |
|---|---|
| 01 Liste des sportifs | `/coach/o/[orgId]/sportifs` (`page.tsx`, `athlete-table.tsx`, `compact-filter.tsx`) |
| 2a → 2k Fiche sportif | `/coach/o/[orgId]/sportifs/[athleteId]?onglet=…` (un seul `page.tsx`, composants par onglet dans le même dossier) |
| 2d Détail d'une séance (vue sportif) | `/coach/o/[orgId]/sportifs/[athleteId]/programme/[sessionId]` (à confirmer en page 2d) |
| Nouveau sportif | `/coach/o/[orgId]/sportifs/nouveau` (hors maquette, inchangé) |
| Inviter | `/coach/o/[orgId]/sportifs/[athleteId]/inviter` (hors maquette, inchangé) |

## 6. Page 01 : fonctionnalités existantes et maquette

| Élément | Statut | Note |
|---|---|---|
| 4 chiffres clés cliquables (actifs, en pause, compétitions → Notifications, fiches à compléter → filtre) | Existe, absent de la maquette | **Déplacés** (choix d'Antonino) : compteurs dans les menus, « Fiches à compléter » dans le menu Statut, compétitions dans le résumé du téléphone |
| Filtre « Seulement les fiches à compléter » (`?fiche=a-completer`) + « Tout afficher » | Existe, absent | Conservé |
| Filtres Statut / Programme avec compteurs | Existe (pastilles sur ordinateur, `CompactFilter` sur téléphone) | À modifier visuellement → menus déroulants |
| Recherche | Existe (formulaire, validée par Entrée, `?q=`) | Maquette : filtre en direct → recherche en direct (adresse mise à jour) |
| Tri par colonne (adresse `?tri=&ordre=`) | Existe | Flèches ↑ ↓ ↕ et pied « Trié par …, croissant » : **nouveau** |
| Pied « n sportifs affichés » | Nouveau | |
| Sélection multiple + Changer le statut / le programme | Existe (barre fixe en bas) | À modifier visuellement (barre noire dans la carte) |
| « Inviter » groupé | **Nouveau, fait** | Un lien par sportif, à copier (choix d'Antonino) ; fiche sans e-mail signalée |
| Inviter / Invité / Écrire par ligne | Existe (Inviter, icône message ; « invitation en attente » = icône à côté du nom) | « Invité » passe dans la colonne Actions |
| Statut et programme cliquables dans la ligne (ouvrent leur choix) | Existe, absent de la maquette | Conservé, avec l'apparence texte de la maquette |
| Crayon « Modifier la fiche » par ligne | Existe, absent | Reste accessible par « ··· » (déjà dans ce menu) : signalé |
| Menu « ··· » (statut, programme, objectif, fiche, message / inviter) | Existe | Contenu non dessiné : conservé tel quel |
| Photo de profil dans l'avatar | Existe, absent (initiales) | Conservée |
| Repère « fiche à compléter » (icône + infobulle) | Existe | Maquette : texte orange « Fiche à compléter » sous le nom |
| État vide | Existe (3 textes, dont « Ajouter mon premier sportif ») | Textes de la maquette pour les filtres ; le premier sportif garde son bouton |
| « + Nouveau sportif » | Existe | |
| Résumé mobile « n sportifs · n actifs · n compétitions à venir » | Nouveau | |
