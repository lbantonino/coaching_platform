# Critères d'acceptation (Étant donné / Lorsque / Alors)

**Séance dans l'ordre** — Étant donné une semaine « dans l'ordre » de 5 séances, lorsque le sportif ouvre son agenda, alors il voit 5 cartes numérotées sans jour ; lorsqu'il en déplie une, alors ses blocs écrits s'affichent et les autres se replient.

**Jours fixes** — Étant donné la semaine 2 « dans l'ordre », lorsque le coach choisit « Jours fixes », alors Coory propose un jour par séance d'après les disponibilités et la séance coach reste verrouillée ; lorsqu'il valide avec « Phase Base », alors S2–S4 (et S1 si non passée) ont les mêmes jours, la numérotation suit les jours, et le programme affiche « Modifications non publiées ». Erreur : jour indisponible → avertissement, pas de blocage [P].

**Modèle** — Étant donné le modèle Coory « Prépa Hyrox », lorsque le coach clique « Utiliser » et crée le brouillon pour Inès au 26 oct., alors un programme daté est créé ; lorsqu'il modifie une séance, alors le modèle Coory est inchangé. Lorsqu'il ouvre le modèle, alors rien n'est modifiable et « Dupliquer dans Mes modèles » est proposé.

**Façon de viser** — Étant donné Inès avec une VMA de 16 km/h et une FC max de 192, lorsque le coach crée un programme, alors « Allure » est pré-choisi ; lorsqu'il passe une étape en « Zone de FC » Z4, alors 161–175 bpm est proposé et reste modifiable.

**% du max** — Étant donné un max de 20 kg, lorsque le coach saisit 70 %, alors « ≈ 14 kg » s'affiche.

**Simulation Hyrox** — Étant donné Inès en Open Femme, lorsque le coach insère une simulation « Officielles », alors les 8 stations reçoivent les charges officielles Open Femme et l'ordre officiel ; lorsqu'il corrige une ligne, alors seule cette ligne change et le total est recalculé.

**Publication** — Lorsque le coach publie, alors la version passe à vN+1, un toast « Programme publié (version N) · Voir » apparaît, et le sportif voit la nouvelle version.

**PDF** — Étant donné un programme publié de 12 semaines, lorsque le coach clique « PDF », alors 2 fichiers A4 portrait sont générés (13 pages et 1 + K pages) ; tous les liens internes, boutons ‹ › et le bouton central fonctionnent dans les 5 lecteurs ciblés.

**Aucun graphique** — Sur aucun écran ni PDF une séance n'est représentée par un graphique.
