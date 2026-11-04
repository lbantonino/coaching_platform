# Exceptions au shell global

| # | Page / interface | Exception | Justification | Statut |
|---|---|---|---|---|
| EX-01 | 02 Assistant IA — page complète mobile | En-tête propre : [☰] « ✦ Assistant IA » + groupe [Historique][Nouvelle conversation] à la place de [✦][🔔] ; zone de saisie fixée en bas ; pas de FAB | Interface conversationnelle plein écran : la saisie est prioritaire, le bouton Assistant serait redondant | NEW-VALIDATED (maquette 02) |
| EX-02 | 02 Assistant IA — boîte de dialogue | S’ouvre par-dessus n’importe quelle page (overlay `rgba(14,12,22,.48)` + flou 2 px) ; sur mobile, ancrée sous le bouton ✦ avec une flèche | Accès rapide sans quitter la page | NEW-VALIDATED |
| EX-03 | 13 Paramètres desktop | Fenêtre modale 1000×690 au-dessus de la page courante (le shell reste visible et assombri) | Paramètres = réglages, pas une destination | ✅ VALIDÉ : fenêtre par-dessus la page, **pas de route / pas de page** (TO-VERIFY : est-ce une page ou une modale dans l’app ?) |
| EX-04 | 13 Paramètres mobile | Fenêtre plein écran **par-dessus la page** (pas de route), bouton **Fermer (×)**, menu déroulant de rubriques | Équivalent mobile de la fenêtre desktop | ✅ VALIDÉ |
| EX-05 | 06, 08–12 formulaires mobiles | Barre fixe Annuler / Enregistrer en bas **au lieu** du FAB | L’action principale est d’enregistrer, pas de créer | Règle (voir mobile-layout.md) |
| EX-06 | 07 Messages — conversation mobile | Zone de saisie fixée en bas, pas de FAB pendant une conversation ouverte | Saisie prioritaire | NEW-VALIDATED |
| EX-07 | Feuilles mobiles (07 Nouveau message / Nouveau groupe, 04 menu +) | Overlay `rgba(23,21,29,.42)` + feuille `border-radius:26px 26px 0 0` | Pattern de feuille du kit Modals | Réutiliser le composant feuille du kit COORY-MODALS |
