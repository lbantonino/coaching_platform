# Formulaires

Voir ../design-system/components.md § Champs, § Segmenté, § Menu déroulant.
- Grille de champs : `repeat(auto-fit, minmax(min(100%,240px),1fr))`, `gap:16px` (3 colonnes à 1280, 1 colonne mobile). Un champ pleine largeur : `grid-column:1/-1`.
- Sur-titres de groupe (2b) : IDENTITÉ, CONTACT, ADRESSE, PROFIL SPORTIF, STATUT — `600 11.5px`, `.08em`, `#8b8996`.
- Champ non modifiable (e-mail 2b) : fond gris `#f3f2f7`-like, texte `#64626e`, aide « Identifiant de connexion du sportif : non modifiable ici. »
- Bouton de validation en bas à gauche (principal noir).
- Messages de succès/erreur : **non dessinés** sauf « Mise à jour le … » (2i). Proposition à valider : texte `500 13px` vert `#15803d` à droite du bouton (« Enregistré. ») ; erreur sous le champ en `#DD2D4A` `400 12.5px`.
- Validation : conserver **toutes** les validations existantes de l’app (formats d’allure « 4:55 ou 6:40-7:15 », temps « mm:ss ou h:mm:ss », etc.).
