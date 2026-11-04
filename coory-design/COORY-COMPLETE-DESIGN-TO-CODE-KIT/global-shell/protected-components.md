# Shell global COORY — composants protégés

> **Règle absolue** : ces composants existent déjà dans l’application. Claude Code **ne les redessine pas page par page**. Il les réutilise tels quels et ne fait varier que les propriétés listées dans « Variables par page ».
> Source des valeurs : styles inline des 13 fichiers `source-design-files/pages/*/*.dc.html` (identiques d’une page à l’autre). Valeurs **exactes**.

| ID | Composant | Desktop | Mobile | Statut |
|---|---|---|---|---|
| SH-01 | Sidebar (menu latéral) | ✅ | — (remplacée par SH-05) | PROTÉGÉ · EXISTING (TO-VERIFY : vérifier que le composant actuel a ces valeurs) |
| SH-02 | Barre d’en-tête (header) | ✅ | — | PROTÉGÉ |
| SH-03 | Bouton global « Assistant IA » | ✅ | ✅ (icône) | PROTÉGÉ — voir aussi `features/assistant-ai.md` |
| SH-04 | Cloche + badge Notifications | ✅ | ✅ | PROTÉGÉ |
| SH-05 | En-tête mobile (hamburger + titre + actions) | — | ✅ | PROTÉGÉ |
| SH-06 | Recherche globale « Rechercher dans Coory ⌘K » | ✅ | — | PROTÉGÉ |
| SH-07 | Bloc utilisateur (avatar + nom + rôle) | ✅ | dans le menu hamburger (TO-VERIFY) | PROTÉGÉ |
| SH-08 | Bouton flottant de création (FAB) | — | ✅ | PARTAGÉ (composant unique, réutilisé) |
| SH-09 | Badges de compteur du menu (Messages, Notifications) | ✅ | ✅ (badge cloche) | PROTÉGÉ — valeurs dynamiques |

## Ce qui ne doit PAS être modifié
- Ordre, libellés et icônes des entrées du menu.
- Dimensions, couleurs, rayons, police du shell (valeurs ci-dessous).
- Comportement d’ouverture/fermeture du menu (desktop : bouton « replier » ; mobile : hamburger).
- Le bouton Assistant IA global ouvre la **boîte de dialogue** Assistant (voir 02-assistant-ia), jamais une autre action.

## Variables par page (seules choses qui changent)
| Variable | Exemple | Où |
|---|---|---|
| Entrée de menu active | « Sportifs » sur 09/10, « Agenda » sur 06/12, « Bibliothèque » sur 08/11 | SH-01 |
| Titre de page + icône | « Notifications » + cloche | SH-02 / SH-05 |
| Fil d’Ariane / retour contextuel | « ← Sportifs · Sophie Lambert » | SH-02 / SH-05 (voir `contextual-navigation.md`) |
| Action principale de page (desktop) | « + Nouvelle tâche » (01) | à droite de SH-02, après la cloche |
| FAB mobile | « + » (04, 07), « Importer » (05) | SH-08 |
| Valeurs des badges | 3, 9 | dynamiques |

## ⚠️ Écarts constatés entre maquettes (à trancher dans le code existant)
- **Entrée « Facturation » — ✅ décidé : SUPPRIMÉE.** La page n’existe plus dans l’app ; retirer l’entrée du menu partout (desktop + hamburger). Ancienne note : : présente dans le menu de 01 Tâches, retirée volontairement de 04 Comptabilité et absente des autres maquettes → **TO-VERIFY** : garder la liste du menu de l’app actuelle ; si « Facturation » existe encore dans le code, demander au propriétaire.
- **Badge Notifications** : 9 sur la plupart des maquettes, 6 sur 01 Tâches, 16 sur la cloche mobile de 04 → valeurs de démo, toujours **dynamiques** dans l’app.
- **Couleur de l’entrée active** : `#6a3ee0` (pages 08–13) vs `#17151d` (04 Comptabilité). → Reprendre la valeur du composant existant ; à défaut `color:#17151d; background:rgba(139,92,246,.12)` (variante majoritaire du kit Sportifs).
