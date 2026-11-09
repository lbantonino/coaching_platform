# Inventaire des composants

Source : `13_HTML_PREVIEWS/source/programmes/` (ORIGINAL_SOURCE). Les fichiers en **gras** sont de vrais sous-composants réutilisés plusieurs fois.

| Composant | Fichier | Écrans | Variantes conçues |
|---|---|---|---|
| Sidebar desktop | inline | tous desktop | item actif fond violet 12 % ; badges compteurs violets ; avatar coach anneau violet |
| Header desktop | inline | tous | « ← Programmes · Titre », Assistant IA (violet), cloche (+ pastille), action noire (Créer / Publier / Terminer / Dupliquer dans Mes modèles) |
| Header mobile | inline | tous mobiles | hamburger 46, « ← Précédent » ou titre, pilule IA + cloche |
| Onglets Programmes / Modèles | CooryProgEcrans | 01 | desktop dans le header ; mobile segmenté pleine largeur 46 |
| Segmented control | partout | 01–06 | 2 à 5 segments ; piste #f3f2f7 ou #e8e7ee |
| Select (bouton + chevron) | Panneau, Étape, Éditeurs | 02, 04, 06 | Catégorie, Type d'étape, Format du bloc, Type de séance, Heure |
| Carte programme | CooryProgEcrans | 01 | statut Publié vN (gris) / Brouillon (contour) / À venir (violet) ; progression violette 6 px |
| Carte modèle | CooryProgEcrans | 01 | badge « Coory » (violet) / « Mes modèles » (gris) ; « Utiliser » |
| État vide | CooryProgEcrans, Onglet | 01, 07 | icône 68 r21 violet doux, titre 26/700, 2 CTA (noir + IA) |
| Recherche sans résultat | CooryProgEcrans | 01 | icône, titre, « Effacer la recherche et les filtres » |
| Stepper assistant | CooryProgEcrans | 02 | desktop liste (✓ noir / actif violet / à venir contour) ; mobile 4 barres 5 px |
| Contenu d'étape | **CooryProgEtape** | 02 | props `st` (étapes 1–4), `mobile` |
| Liste semaines + phases | Coory Programmes | 03 | phase « BASE · S1–4 » + ··· ; semaine active #f1edfc ; « allégée » ; point violet « en cours » |
| Carte séance (éditeur) | Coory Programmes | 03 | sélectionnée ; ↑ ↓ ; poignée 6 points ; badge coach ; lecture seule (sans contrôles) |
| Menu ··· | Coory Programmes, Éditeurs | 03, 04–06 | Enregistrer comme modèle (surligné), Dupliquer, Renommer, Archiver / Supprimer (rouge) |
| Bandeau 7 jours | CooryJoursFixes | 03b | séance (teinte + pastille Sn), repos (contour), indisponible (hachuré), sélection (anneau violet) |
| Sélecteur de jour | **CooryJourPicker** | 03b | `compact` (desktop) / complet (mobile) |
| Proposition de jours | **CooryJourPropose** | 03b | modale desktop / feuille mobile |
| Liste étapes / exercices / blocs | **CooryEditeurListe** | 04–06 | étape, exercice (vignette), groupe Répéter / Superset (lien) / EMOM / Circuit / AMRAP avec stepper |
| Panneau d'édition | **CooryEditeurPanneau** | 04–06 | Running (allure / FC), Musculation (kg / % du max), Hyrox (charges), Simulation |
| Carte séance agenda | Coory Agenda Séances | 2c | fermée / dépliée ; dans l'ordre / jour fixe ; avec le coach |
| Publier | **CooryProgPublier** | 08 | modale / feuille ; toast « Programme publié (version 2) · Voir » |
| Page PDF | **CooryPdfDoc** | 09 | `doc` agenda / fiches ; pages sommaire, semaine, fiche musculation, workload, allures |
| FAB mobile | inline | 01, 03, 04–06 | 60 × 60 noir « + » |
| Feuille du bas | inline | 03b, 04–06, 08 | poignée, voile .34 |

## États non dessinés — PROPOSED (à valider)
- **Chargement** : squelettes #f3f2f7 aux dimensions des cartes (même motif que le fond de 08).
- **Erreur d'enregistrement** : toast noir (style 08) avec pastille #b51f39 « Impossible d'enregistrer · Réessayer ».
- **Erreur de champ** : anneau 1.5 px #b51f39 + texte 12.5 #b51f39 sous le champ.
- **Hover / focus clavier** : voir DESIGN_SYSTEM §6.
