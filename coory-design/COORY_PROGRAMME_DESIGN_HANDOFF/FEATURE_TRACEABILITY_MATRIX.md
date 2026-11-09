# Matrice de traçabilité — chaque contrôle visible a un comportement

Format : ID · Écran · Contrôle · Action → Résultat · Données (lecture / écriture) · Critère d'acceptation. Les messages non dessinés sont PROPOSED.

## 01 Page Programmes
| ID | Écran | Contrôle | Résultat | Données | Acceptation |
|---|---|---|---|---|---|
| PRG-F01 | PRG-01/02 | Onglets Programmes / Modèles | change la liste | — | l'onglet actif est blanc + ombre ; URL `?tab=models` [P] |
| PRG-F02 | PRG-01 | Onglets de statut | filtre (compteurs) | R programmes | les compteurs = nombre réel par statut |
| PRG-F03 | PRG-01 | Selects discipline / sportif | filtre | R | combinables avec statut + recherche |
| PRG-F04 | PRG-01/04 | Recherche | filtre par titre / sportif | R | sans résultat → état PRG-04 |
| PRG-F05 | PRG-04 | Effacer la recherche et les filtres | réinitialise | — | liste complète |
| PRG-F06 | PRG-01/02 | Carte programme | ouvre 03 | R | — |
| PRG-F07 | PRG-01/03, FAB | Créer un programme | ouvre 02 étape 1 | — | — |
| PRG-F08 | PRG-03 | Le préparer avec l'Assistant IA | ouvre l'Assistant IA avec intention « créer un programme » | — | [P] comportement IA existant |
| PRG-F09 | PRG-05/06 | Source Tous / Coory / Mes modèles | filtre | R modèles | — |
| PRG-F10 | PRG-05 | Utiliser | ouvre 02 étape 4 « Partir d'un modèle » avec ce modèle | R | copie à la création |
| PRG-F11 | PRG-05/06 | Carte modèle | ouvre 03 en mode modèle (1g si Coory) | R | lecture seule si Coory |
| PRG-F12 | PRG-05 | Nouveau modèle | ouvre 02 sans sportif ni dates [P] | — | — |

## 02 Créer un programme
| ID | Contrôle | Résultat | Données | Acceptation |
|---|---|---|---|---|
| WIZ-F01 | Étapes (desktop) / Retour / Continuer | navigation | état local | Continuer désactivé si champs requis vides [P] |
| WIZ-F02 | Recherche + radio sportif | choisit le sportif | R sportifs | un seul choisi |
| WIZ-F03 | Titre | saisie | — | requis |
| WIZ-F04 | Discipline (3 cartes) | choix | — | requis |
| WIZ-F05 | Toggle objectif + course + date + Catégorie (select) | objectif | — | catégorie = catégorie Hyrox du sportif |
| WIZ-F06 | Façon de viser (2 segmentés) | défaut programme | R repères | pré-choisi : allure si VMA connue, sinon FC ; kg si maxima absents |
| WIZ-F07 | Date début / stepper semaines | calcule la fin | — | texte « Se termine le … » mis à jour |
| WIZ-F08 | Séances / semaine 1–7 | M | — | — |
| WIZ-F09 | Phases (cases, +, Le faire plus tard) | crée des phases | — | facultatif |
| WIZ-F10 | Organisation (2 radios) | ordered / fixed_days | — | défaut ordered |
| WIZ-F11 | Point de départ (3 cartes) + sélecteur source | zéro / copie / modèle | R anciens programmes / modèles | aperçu mis à jour |
| WIZ-F12 | Créer le brouillon | crée Program + Weeks (+ copies) | W | ouvre 03 ; toast [P] « Brouillon créé » |

## 03 Éditeur de programme
| ID | Contrôle | Résultat | Données | Acceptation |
|---|---|---|---|---|
| EDT-F01 | Clic semaine | affiche la semaine | R | surlignée #f1edfc |
| EDT-F02 | ··· de phase | Renommer / Supprimer la phase | W Phase | supprimer une phase garde les semaines |
| EDT-F03 | + Semaine / + Phase | ajoute | W | — |
| EDT-F04 | Dupliquer (semaine) | copie vers d'autres semaines [P sélecteur] | W | — |
| EDT-F05 | Clic séance | panneau droit (desktop) / écran séance (mobile) | R | anneau violet |
| EDT-F06 | ↑ ↓ / glisser | réordonne | W order | numéros mis à jour ; flèches désactivées aux extrémités |
| EDT-F07 | Ajouter une séance | séance vide → éditeur de la discipline | W | — |
| EDT-F08 | Depuis un modèle | copie une séance modèle | R modèles, W | le modèle n'est pas modifié |
| EDT-F09 | Modifier la séance | ouvre 04/05/06 | — | — |
| EDT-F10 | Copier / Supprimer (panneau) | duplique / supprime (confirmation [P]) | W | — |
| EDT-F11 | ··· programme | Enregistrer comme modèle / Dupliquer / Renommer / Archiver | W | modèle sans sportif ni dates |
| EDT-F12 | Aperçu | vue sportif de la version en cours | R | — |
| EDT-F13 | PDF | génère les 2 PDF | W ProgramExport | voir PDF_QA |
| EDT-F14 | Publier | ouvre 08 | — | — |
| EDT-F15 | Dupliquer dans Mes modèles (1g) | copie du modèle Coory | W | ouvre la copie modifiable |

## 03b Jours fixes
| ID | Contrôle | Résultat | Acceptation |
|---|---|---|---|
| FIX-F01 | Dans l'ordre / Jours fixes | ouvre la proposition (si passage en jours fixes) | revenir « dans l'ordre » supprime les jours (confirmation [P]) |
| FIX-F02 | Sélecteurs de jour (proposition) | change le jour proposé | séance coach non modifiable |
| FIX-F03 | Appliquer à (chips) | portée | semaines passées exclues |
| FIX-F04 | Fixer les jours / Garder dans l'ordre | applique / annule | « Modifications non publiées » |
| FIX-F05 | Pavé jour d'une carte / glisser dans le bandeau | ouvre le sélecteur de jour | — |
| FIX-F06 | 7 jours / Sans jour / Heure | fixe le jour, l'heure | jour indisponible barré ; jour déjà pris : avertissement |
| FIX-F07 | Toggle « peut déplacer » | athleteCanMove | notification coach quand le sportif déplace |
| FIX-F08 | Valider / Annuler | enregistre / ferme | numérotation = ordre des jours |

## 04–06 Éditeurs de séance
| ID | Contrôle | Résultat | Acceptation |
|---|---|---|---|
| SES-F01 | Renommer / ··· (Enregistrer comme modèle, Dupliquer, Supprimer) | — | — |
| SES-F02 | Type de séance (select) | sessionType | — |
| SES-F03 | Objectif / Conseil (ou Échauffement / Retour au calme) | texte | — |
| SES-F04 | Clic étape / exercice / bloc | panneau / feuille | anneau violet |
| SES-F05 | Ajouter (2 boutons de pied) | ajoute étape / répéter / exercice / superset / bloc / simulation | — |
| SES-F06 | Stepper de groupe | N répétitions / tours | totaux recalculés |
| SES-F07 | Terminer | retour à 03 | auto-enregistré (« Enregistré ») |
| RUN-F01 | Type d'étape (select), Mesure (segmenté), valeur | — | — |
| RUN-F02 | Cible Allure / Zone de FC | aim | les deux restent possibles par étape |
| RUN-F03 | Z1–Z5 + plage bpm / allure de–à | cible | proposées depuis FC max / VMA |
| RUN-F04 | Recalculer | recalcule depuis les repères actuels | — |
| MUS-F01 | Saisie rapide + Remplir | génère les séries | « 3 séries de 8 à 10 » → 3 lignes |
| MUS-F02 | Charge kg / % du max | loadMode | en % : « ≈ N kg » affiché ; sans max : % seul + avertissement [P] |
| MUS-F03 | Ajouter une série / cellules | — | — |
| MUS-F04 | Créer un superset / Relier un exercice | groupe | repos en fin de tour |
| HYR-F01 | Format du bloc (select) | kind | — |
| HYR-F02 | Charges Du coach / Officielles | loadMode | officielles = catégorie du sportif |
| HYR-F03 | Insérer (modèle Simulation) | ouvre 6c | — |
| HYR-F04 | Officielles / Mes charges (simulation) | remplit toutes les stations | corrigeable ligne par ligne |
| HYR-F05 | Temps cible par ligne | targetTimeSec | total recalculé |
| HYR-F06 | Insérer la simulation | bloc simulation | 8 runs + 8 stations, ordre officiel |

## 07, 2c, 08, 09
| ID | Contrôle | Résultat |
|---|---|---|
| TAB-F01 | Ouvrir l'éditeur / PDF / Voir les 12 semaines | 03 / PDF / agenda complet |
| TAB-F02 | Créer un programme / Copier un programme précédent (vide) | 02 (sportif pré-choisi / étape 4 copie) |
| AGD-F01 | Semaine / Toutes les semaines ; ‹ › | change la vue / la semaine |
| AGD-F02 | Clic carte / chevron | déplie le détail (une à la fois) ; Échap / reclic referme [P] |
| PUB-F01 | Publier la version N / Annuler | publie (vN+1) / ferme ; avertissements bloquants empêchent [D] |
| PUB-F02 | Toast « Voir » | ouvre la vue sportif |
| PDF-F01…F06 | Voir `12_PDF_SYSTEM/LINKS_AND_DESTINATIONS.md` | — |
