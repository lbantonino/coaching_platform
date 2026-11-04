# Outils de vérification

`compare-boites.cjs` : ouvre une boîte dans l'app (localhost:3000) et sa planche dans la maquette
(`source-design-files/shared` servi sur 127.0.0.1:8766 avec `python3 -m http.server 8766`), puis
liste la position de chaque texte, tuile, icône, filet et poignée par rapport au coin de la boîte.
Ordinateur 1200 × 780 (cadre du kit) et téléphone 390 × 844.

    export PATH="$HOME/.nvm/versions/node/v24.22.0/bin:$PATH"
    NODE_PATH=$PWD/node_modules node coory-design/COORY-MODALS-PIXEL-PERFECT-KIT/outils/compare-boites.cjs <dossier captures> 36,30

Chaque boîte a son « ouvreur » dans l'objet `openers` : en ajouter un par nouvelle boîte.
