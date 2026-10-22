# 10 — Design system et inventaire exhaustif des écrans

> **22/10/2026 (D-16)** : la charte visuelle appliquée est `COORY_DESIGN_SYSTEM.md` + `COORY_LOGO.md` (racine du projet). Elle remplace la palette « de départ proposée » ci-dessous ; l'inventaire des écrans et des composants de ce document reste valable.

## 1. Principes
Design professionnel sportif, sobre, accessible, rapide. Nom commercial variable, logo/branding administrables. Palette de départ **proposée** : fond blanc/gris très clair, texte anthracite, accent corail, Running bleu/vert, Musculation gris profond, Hyrox corail ; ne pas se reposer seulement sur couleurs. Inspirations des maquettes créées dans la conversation : dashboards à cartes, éditeurs de blocs, interfaces mobiles avec navigation basse.

**Grille** : desktop >= 1200 : sidebar 240px + contenu 12 colonnes ; tablette 768..1199 : sidebar compacte + contenu 1-2 colonnes ; mobile <768 : navigation adaptée, fiches verticales. Largeur max de lecture pour consignes ; densité différente coach vs sportif. Styles accessibles WCAG 2.2 AA comme cible, tabulation/focus visibles, tailles minimum boutons ~44px mobile.

## 2. Design system
- Typographie : sans-serif, H1 28–36 desktop/24–28 mobile, corps >= 16 mobile pour saisie, labels cohérents.
- Couleurs sémantiques : succès, avertissement, erreur, information ; statuts portent toujours un texte.
- Composants : bouton, badge, input avec unité, textarea, select/search, calendar/date-picker, modal, sheet mobile, toast accessible, confirm dialog, tabs, table, card, breadcrumb, stepper, editable list, drag handle + up/down fallback, skeleton, empty state, error boundary.
- Domain components : `ExerciseSelector`, `UnitValueInput`, `IntervalEditor`, `SetEditor`, `CircuitBuilder`, `WeekPlanner`, `ProgramPublicationBadge`, `FeedbackForm`, `PdfPreview`.
- États standard : loading, saved/saving/failed, empty, validation error, offline/network failure, permission denied, conflict, success ; l'utilisateur doit savoir ce qui a été réellement persisté.

## 3. Plan des écrans COACH DESKTOP (C-D)
| ID | Route logique | Contenu / actions essentielles |
|---|---|---|
| C-D01 | `/coach` | Dashboard KPIs réels, brouillons récents, feedbacks, raccourcis |
| C-D02 | `/coach/athletes` | CRM table, filtres, recherche, nouveau client |
| C-D03 | `/coach/athletes/new` | Formulaire identité, objectifs, disponibilités, repères |
| C-D04 | `/coach/athletes/:id` | Profil complet, onglets, programmes, commentaires, historique |
| C-D05 | `/coach/calendar` | Planning client/semaine, dates, conflits |
| C-D06 | `/coach/programs` | Liste programmes, brouillon/publié/archivé, recherche |
| C-D07 | `/coach/programs/new` | Wizard multi-étapes, modèle ou libre |
| C-D08 | `/coach/programs/:id/edit` | **Éditeur principal triple panneau** semaines/séances/inspecteur |
| C-D09 | `/coach/programs/:id/preview` | Vue sportif avant publication, validations |
| C-D10 | `/coach/programs/:id/versions` | Historique versions, comparaisons, publication |
| C-D11 | `/coach/library/exercises` | Catalogue exercices, recherche/ajout/variantes |
| C-D12 | `/coach/library/sessions` | Bibliothèque de modèles séances et blocs |
| C-D13 | `/coach/library/weeks` | Bibliothèque trames hebdomadaires |
| C-D14 | `/coach/pdfs/:publicationId` | Prévisualisation PDF, options, export/email |
| C-D15 | `/coach/feedback` | Séances terminées, notes, RPE, suivi |
| C-D16 | `/coach/messages` | Conversations et modèles messages (V2) |
| C-D17 | `/coach/automations` | Règles après N séances / rappels (V2+) |
| C-D18 | `/coach/settings` | Profil, équipe future, identité PDF, notification, confidentialité |

## 4. Plan des écrans COACH MOBILE (C-M)
Même données et capacité métier, expériences repensées, pas simple rétrécissement du desktop :
- C-M01 Home KPIs et alertes ; C-M02 Liste clients ; C-M03 Profil/édition client.
- C-M04 Programmes du client ; C-M05 Wizard nouveau programme ; C-M06 Semaines en liste ; C-M07 Détail séance.
- C-M08 **Éditeur blocs** en cartes réordonnables ; C-M09 Recherche exercice ; C-M10 Édition série/intervalle/circuit.
- C-M11 Dupliquer une semaine / ajuster ; C-M12 Bibliothèque modèles et favoris.
- C-M13 Aperçu/version/publication ; C-M14 PDF et partage ; C-M15 Feedbacks ; C-M16 Messages/notifications ; C-M17 Paramètres.

Scénario mobile coach minimal de recette : rechercher client -> nouvelle semaine -> insérer modèle Hyrox circuit -> remplacer 1 exercice -> modifier distance + charge -> sauvegarder -> publier. Tout doit être faisable sur écran étroit.

## 5. Plan des écrans SPORTIF DESKTOP (S-D)
S-D01 Dashboard, séance du jour ; S-D02 Plan multi-semaines ; S-D03 Calendrier semaine/mois ; S-D04 Détail de séance ; S-D05 Validation & feedback ; S-D06 Progression/indicateurs réels ; S-D07 Historique ; S-D08 Messages (V2) ; S-D09 Documents/PDF ; S-D10 Mon profil/préférences.

## 6. Plan des écrans SPORTIF MOBILE (S-M)
S-M01 Aujourd'hui CTA séance ; S-M02 Ma semaine, 4 cartes ; S-M03 Détail running ; S-M04 Détail Hyrox multi-blocs ; S-M05 Détail musculation sets ; S-M06 Mode actif bloc 1..N ; S-M07 Fin, RPE/ressenti ; S-M08 Historique ; S-M09 Progression ; S-M10 Messages ; S-M11 Documents ; S-M12 Objectifs/épreuves ; S-M13 Notifications ; S-M14 Profil et préférences.

**Contrainte critique** : le sportif doit accéder à la séance en 2 actions max depuis l'écran Aujourd'hui ; consignes compréhensibles pendant la séance sans table illisible. L'interface peut afficher une mini-progression par bloc mais ne doit pas masquer les détails de sécurité.

## 7. Plan ADMIN PLATEFORME (A-D/A-M)
A-D01 organisations et états ; A-D02 utilisateurs et rôles ; A-D03 état abonnements/quotas V3 ; A-D04 journal audit et support autorisé ; A-D05 erreurs/intégrations ; A-D06 conformité/export/suppression. Mobile admin à lecture prioritaire V3 ; opérations sensibles avec authentification renforcée et confirmations, pas nécessaire pour première démo.

## 8. Composants d'édition clés
**Running** : `RunningBlockCard` récapitulant N × (effort cible, récup), timeline et modale conversion allure. **Musculation** : `StrengthSetGrid` desktop, `StrengthSetCards` mobile, avec charge/reps/recovery. **Hyrox** : `CircuitSequenceEditor` où les lignes représentent des mouvements, les conteneurs représentent tours et formats. **Hybride** : même `CircuitSequenceEditor` mais mélange d'unités. **Progression** : diff semaine S1 vs S2 avec champs modifiés et modifications multiples approuvées.

## 9. Responsive, performances et accessibilité
- Précharger les données nécessaires seulement, pagination des grandes listes ; pas 100 cartes DOM complexes sans virtualisation.
- Sauvegarde UX optimiste seulement si rollback clair ; éviter suppression irréversible à la touche.
- Étiquettes pour inputs, focus trap modales, clavier/screen reader, contrastes, messages d'erreur reliés aux champs ; test navigation sans souris.
- Téléphones de test : 320/360/390/430 px, portrait/paysage ; desktop 1366/1440/1920.
- En PWA : icônes/manifest/service worker de cache statique uniquement avant stratégie offline validée ; ne pas mettre données sensibles dans un cache partagé sans politique.

## 10. Critères de recette
- [UX-01] Coaches peuvent créer une séance avec 8 exercices depuis PC et mobile.
- [UX-02] Aucune valeur numérique n'apparaît sans unité et aucune conversion d'allure sans indication.
- [UX-03] État sauvegarde visible après erreur réseau et restauration après retour connexion documentée.
- [UX-04] Tous les écrans de core flow disposent d'états vide/chargement/erreur.
- [UX-05] Parcours mobile sportif lisible à 360px sans scroll horizontal.
