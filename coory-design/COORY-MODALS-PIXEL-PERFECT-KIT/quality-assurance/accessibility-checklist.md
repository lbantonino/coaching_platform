# accessibility-checklist

- [ ] Focus initial
- [ ] focus piégé
- [ ] restauration
- [ ] aria-modal
- [ ] aria-labelledby
- [ ] navigation clavier menus
- [ ] contrastes
- [ ] cibles ≥ 44 px.

## Suivi par phase

### Phase A : coque commune (04/11/2026)
Vérifié sur la coque partagée (menu « Créer », formulaire « Nouvelle tâche », confirmation « Supprimer ce document ? », panneau « Paramètres »). La liste ci-dessus reste à cocher boîte par boîte (phases B à H), puis globalement (phase I).

- [x] Focus initial : sur le premier bouton de la boîte (✕), donné par showModal()
- [x] focus piégé (élément <dialog> natif, modal)
- [x] restauration : le focus revient au bouton de départ (« Créer »), vérifié à 1440 et 390
- [x] aria-modal (implicite avec showModal)
- [x] aria-labelledby sur le titre ; aria-describedby sur le sous-titre ou le texte de confirmation
- [ ] navigation clavier menus : à vérifier en phase B (lignes = boutons, Tab / Entrée)
- [x] contrastes : muted #64626e sur blanc 5,9:1 ; danger #c8243c sur blanc 5,6:1 ; sombre : muted #a1a1aa sur #1a1a1d 7:1
- [x] cibles ≥ 44 px : lignes 62 px, boutons 52 px, ✕ et retour 38 px avec zone tactile de 44 px (mesuré)
- [x] focus visible : anneau 2 px #6a3ee0 décalé de 2 px (point ⚠️ du kit, ajouté)

### Phase B : menus simples 36, 30, 17, 05, 22, 09 (04/11/2026)
- [x] navigation clavier menus : ↑ / ↓ en boucle, Début / Fin, Entrée ; focus initial sur ✕, Tab mène à la première ligne (vérifié sur 22)
- [x] focus visible violet #6a3ee0 dès l'appui (la transition ne porte plus sur la couleur du contour)
- [ ] role="menu" / "menuitem" (point ⚠️ du kit) : NON appliqué, les lignes restent des boutons (lecture correcte, et les tests existants les cherchent comme boutons) ; à décider avec Antonino
