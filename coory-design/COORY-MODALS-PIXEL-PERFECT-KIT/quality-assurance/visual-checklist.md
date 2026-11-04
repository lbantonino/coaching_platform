# visual-checklist

- [ ] Dimensions
- [ ] position
- [ ] alignements
- [ ] paddings
- [ ] gaps
- [ ] typo
- [ ] couleurs
- [ ] bordures
- [ ] rayons
- [ ] ombres
- [ ] icônes
- [ ] tailles des boutons et champs
- [ ] ordre des sections
- [ ] aucun texte qui déborde.

## Suivi par phase

### Phase A : coque commune (04/11/2026)
Vérifié sur la coque partagée (menu « Créer », formulaire « Nouvelle tâche », confirmation « Supprimer ce document ? », panneau « Paramètres »). La liste ci-dessus reste à cocher boîte par boîte (phases B à H), puis globalement (phase I).

- [x] Dimensions (largeurs par famille, hauteur max, panneau 1000 × 700)
- [x] position (centrée sur ordinateur, bas d'écran sur téléphone)
- [x] paddings et gaps de l'en-tête (22 22 10 24 / 10 18 10 20), du pied (14 24 / 14 20 22), des lignes de menu et de la confirmation
- [x] typo : titre 20/1.2 700 (21 sur téléphone), sous-titre 14/1.5, libellé 15,5/600, description 13
- [x] couleurs : jetons --dlg-* (valeurs exactes du kit en clair), voile rgba(23,21,29,.44) sans flou
- [x] rayons : 24 (fenêtre), 28 28 0 0 (feuille), 14 (ligne), 11 (tuile 38), 16 (tuile 52), 12 (boutons, champs)
- [x] ombres : 0 30px 80px -20px rgba(23,21,29,.45) + filet 1 px
- [x] icônes : Lucide 1.8 (2 pour ✕ et chevrons, 3 pour la coche)
- [ ] tailles des boutons et champs, ordre des sections, textes : boîte par boîte (phases B à H)

### Phase B : menus simples 36, 30, 17, 05, 22, 09 (04/11/2026)
- [x] 0 px d'écart mesuré sur les 6 boîtes, ordinateur et téléphone (sauf 17 téléphone, non accessible) : boîte, en-tête, tuiles, icônes, libellés, descriptions (13 / 1,4), filet avant l'action rouge (marge 6 / 12), chevrons #a3a1ad, tuiles vertes et ambre (16 %)
- [x] thème sombre vérifié (22, ordinateur et téléphone)

### Phase C : confirmations 11, 12, 18, 20, 25, 29, 31, 35 (04/11/2026)
- [x] 0 px d'écart sur les 8 boîtes, ordinateur et téléphone ; boutons en interligne normal (0,7 px corrigé), icône 24 trait 1,9, « Annuler » en 15 px

### Phase D : menus à sélection et sous-menus 07, 08, 14, 15, 06, 13, 01 (04/11/2026)
- [x] 0 px d'écart sur les 7 boîtes, ordinateur et téléphone ; tuiles teintées (statuts et disciplines) identiques au mélange 16 % du kit ; icônes Running et Hybride du kit

### Phase E : formulaires simples 24, 03, 19, 21 (04/11/2026)
- [x] 0 px d'écart sur les 4 boîtes, ordinateur et téléphone ; tailles des boutons et des champs conformes

### Phase F : formulaires riches 02, 04, 10, 27, 34, 26, 28 (04/11/2026)
- [x] 0 px d'écart sur 26, 27, 28, 34, 10 (ordinateur et téléphone), 04 téléphone ; 02 et 04 ordinateur : écarts expliqués (champs en plus dans le code, carte mal dessinée dans la maquette)

### Phase G : cas à part 16, 32 (04/11/2026)
- [x] 0 px d'écart (16 et 32, ordinateur et téléphone) ; menus ancrés de rayon 18 (MenuDialog + anchor)

### Phase H : grands panneaux 23, 33 (04/11/2026)
- [x] 0 px d'écart (23 hors contenu réel du fichier, 33), ordinateur et téléphone

### Phase I : validation globale (04/11/2026)
- [x] 36 boîtes mesurées en une passe (72 vues) : 69 à 0 px, 3 écarts voulus (voir QA-REPORT.md)
- [x] thème sombre : 10 boîtes (une par famille), ordinateur et téléphone
