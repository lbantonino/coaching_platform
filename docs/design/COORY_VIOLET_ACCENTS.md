# Coory — Ajout des accents violets (dark + light)

> **Prompt pour Claude Code.** Lis ce fichier en entier avant de toucher au code.
> Référence visuelle : `Coory Redesign v2.dc.html` / `Coory Dashboard v2.dc.html` (1a = sombre, 1b = clair).

---

## 0. Règle d'or — ce que tu as le droit de modifier

Tu modifies **uniquement des couleurs** (couleur de fond, couleur de texte, couleur de bordure, halo/dégradé décoratif) et tu ajoutes **2 micro-éléments** listés au §5 (pastille « Prochaine », point violet du menu).

**Interdit :**
- changer la mise en page, les tailles, les marges, les rayons, les polices, les graisses ;
- changer les textes, l'ordre des éléments, la logique, les données, les routes ;
- changer les couleurs des disciplines dans l'agenda (Running, Musculation, Hyrox, Hybride) ;
- changer le vert (« demain », « 1 008,80 € prévus ») et le rouge (« En retard », « ! », montant en retard) ;
- ajouter du violet ailleurs que dans la liste ci-dessous. **Le violet est rare : c'est ce qui le rend élégant.**

Avant de commencer, liste-moi les fichiers/composants que tu comptes modifier et attends ma validation.

---

## 1. Tokens à ajouter

Ajoute ces variables à côté des variables de thème existantes (ne renomme rien). Si le projet utilise Tailwind, ajoute-les dans le thème avec les mêmes noms.

```css
:root, [data-theme="dark"] {
  --violet:          #8B5CF6;               /* couleur de marque, identique dans les 2 thèmes */
  --violet-soft:     rgba(139,92,246,.16);  /* fonds teintés (menu actif, badges, segment actif) */
  --violet-soft-2:   rgba(139,92,246,.18);  /* badges/compteurs */
  --violet-line:     rgba(139,92,246,.35);  /* contours violets fins */
  --violet-text:     #B9A3FF;               /* texte violet sur fond sombre (liens, labels) */
  --violet-ring:     rgba(139,92,246,.30);  /* halo autour du point "maintenant" */
  --today-col:       #1A1626;               /* fond de la colonne du jour */
  --ai-bg:           rgba(139,92,246,.22);  /* bouton Assistant IA */
  --ai-border:       rgba(139,92,246,.55);
  --ai-text:         #E4DBFF;
  --card-glow:       radial-gradient(120% 90% at 100% 0%, rgba(139,92,246,.20) 0%, rgba(139,92,246,0) 55%);
}
[data-theme="light"] {
  --violet:          #8B5CF6;
  --violet-soft:     rgba(139,92,246,.10);
  --violet-soft-2:   rgba(139,92,246,.12);
  --violet-line:     rgba(139,92,246,.35);
  --violet-text:     #6A3EE0;               /* plus foncé pour rester lisible sur blanc (contraste ≥ 4.5:1) */
  --violet-ring:     rgba(139,92,246,.22);
  --today-col:       #F1ECFF;
  --ai-bg:           #8B5CF6;               /* en clair, l'Assistant IA est violet plein */
  --ai-border:       rgba(139,92,246,.55);
  --ai-text:         #FFFFFF;
  --card-glow:       radial-gradient(120% 90% at 100% 0%, rgba(139,92,246,.13) 0%, rgba(139,92,246,0) 55%);
}
```

**Thème clair** : si le thème clair n'existe pas encore, crée-le avec ces neutres (et seulement eux) :

```css
[data-theme="light"] {
  --page:#F3F2F7; --sidebar:#FFFFFF; --card:#FFFFFF; --chip:#EEEDF3;
  --line:rgba(22,18,40,.08); --line-2:rgba(22,18,40,.14); --grid:rgba(22,18,40,.06); --col:#F8F7FB;
  --text:#17151D; --muted:#64626E; --faint:#8B8996;
  --ok:#15803D; --ok-soft:rgba(22,163,74,.10); --bad:#D4223D;
}
```
Le bouton soleil/lune existant bascule `data-theme` sur `<html>`. Le choix est mémorisé dans `localStorage`.

---

## 2. Panneau de gauche (sidebar)

| Élément | Avant | Après |
|---|---|---|
| **Item actif** (ex. « Tableau de bord ») | fond gris clair | fond `var(--violet-soft)`, texte `var(--text)` + **point violet** 6×6 px `var(--violet)` rond, à gauche du libellé, espacé de 10 px (§5) |
| Items inactifs | inchangés | inchangés (`var(--muted)`) |
| Icône étoile « Assistant IA » | violet | `var(--violet)` (vérifier qu'elle l'est bien dans les 2 thèmes) |
| Compteurs « Messages 3 », « Notifications 6 » | texte gris seul | pastille : fond `var(--violet-soft-2)`, texte `var(--violet-text)`, 11.5 px/500, hauteur 20, padding 0 6px, radius 10 |
| Logo | — | le O de droite du logo reste `#8B5CF6` ; lettres = `var(--text)` |

Pas de bordure gauche, pas de liseré. Seulement le fond teinté + le point.

---

## 3. Barre du haut (header)

| Élément | Après |
|---|---|
| Bouton **Assistant IA** | fond `var(--ai-bg)`, contour 1 px `var(--ai-border)`, texte + icône `var(--ai-text)` |
| **Badge de la cloche** (6) | fond `var(--violet)`, texte blanc, contour 2 px couleur de la carte (`var(--card)`) |
| Recherche, soleil, « Créer » | inchangés (« Créer » reste blanc en sombre / noir en clair) |

---

## 4. Cartes du haut

**Prochaine séance**
- Ajoute un **halo dégradé** en haut à droite : `background: var(--card-glow), var(--card);` (le dégradé est posé au-dessus de la couleur de carte existante, rien d'autre ne change).
- « demain » reste **vert**. « 1 / 6 » reste gris.

**Tâches à faire**
- Compteur « 2 » : fond `var(--violet-soft-2)`, texte `var(--violet-text)` (à la place de l'ambre).
- **Case cochée** : fond + contour `var(--violet)`, coche blanche. Case vide : contour `var(--line-2)`.
- « ! » et « En retard » restent **rouges**.

**Encaissés cette semaine**
- Rien en violet, sauf si un mini-graphique existe : seule la **dernière barre** (semaine en cours) en `var(--violet)`, les autres `var(--chip)`. Sinon, ne rien ajouter.
- Le badge « 1 008,80 € prévus » reste **vert**.

---

## 5. Agenda (bloc « Semaine du … »)

| Élément | Après |
|---|---|
| Lien **« Agenda → »** | texte `var(--violet-text)` |
| Segment **Aujourd'hui / Semaine / Mois** — option active | fond `var(--violet-soft)`, texte `var(--violet-text)` (au lieu du gris) |
| Segment **Cases / Grille** — actif | **inchangé** (gris neutre) |
| Filtres **Toutes / Individuelles / Collectives** | **inchangés** |
| **Jour présent** (colonne « Dim 1 ») — en-tête | libellé « Dim » en `var(--violet-text)` ; numéro « 1 » dans un **rond violet plein** `var(--violet)` 28×28, texte blanc |
| **Jour présent** — colonne entière (en-tête + corps) | fond `var(--today-col)` + contour intérieur 1 px `var(--violet-line)` (`box-shadow: inset 0 0 0 1px var(--violet-line)`) |
| **Total** du jour présent (« 0h45 ») | texte `var(--violet-text)` |
| **Ligne « maintenant »** | trait 2 px `var(--violet)` sur toute la largeur de la colonne du jour ; pastille ronde 10 px `var(--violet)` au début, avec halo `box-shadow: 0 0 0 3px var(--violet-ring)` |
| Blocs de séances | **inchangés** (couleurs disciplines) |
| Légende Running/Musculation/Hyrox/Hybride | **inchangée** |

Si « jour sélectionné » et « jour présent » sont distincts dans le code : le **jour présent** reçoit le traitement complet ci-dessus ; un jour **sélectionné** (clic) mais pas présent reçoit seulement le contour `var(--violet-line)`, sans rond plein.

---

## 6. Colonne de droite

**Séances à venir**
- Lien « Voir tout » : `var(--violet-text)`.
- **La première séance à venir** (la plus proche dans le temps) :
  - fond `var(--violet-soft)` ;
  - contour 1 px `var(--violet-line)` ;
  - **pastille « Prochaine »** juste après l'heure : fond `var(--violet)`, texte blanc 11 px/500, hauteur 20, padding 0 8px, radius 10, gap 8 px (§5 des micro-éléments) ;
  - le libellé discipline à droite garde sa couleur de discipline.
- Les autres séances : inchangées.

**Programmes en cours**
- Lien « Voir tous les programmes » : `var(--violet-text)`.
- **Barres de progression** : remplissage `var(--violet)`, piste `var(--chip)`.
- Avatar du **premier** programme (le plus récent / actif) : anneau 1.5 px `var(--violet)` (`box-shadow: inset 0 0 0 1.5px var(--violet)`). Les autres : sans anneau.

**Activité financière**
- Lien « Voir tout » : `var(--violet-text)`.
- Montants et « En retard » : inchangés (rouge pour le retard).

---

## 7. Récapitulatif — liste exhaustive des endroits violets

1. O de droite du logo
2. Item actif du menu : fond teinté + point
3. Étoile Assistant IA (menu)
4. Compteurs du menu (Messages, Notifications)
5. Bouton Assistant IA (header)
6. Badge de la cloche
7. Halo de la carte Prochaine séance
8. Compteur Tâches + cases cochées
9. (Optionnel) dernière barre du graphique Encaissés
10. Lien « Agenda → »
11. Segment actif Aujourd'hui/Semaine/Mois
12. Colonne du jour présent : fond, contour, rond du numéro, libellé, total
13. Ligne « maintenant » + pastille
14. Première « Séance à venir » : fond, contour, pastille « Prochaine »
15. Tous les liens « Voir tout » / « Voir tous les programmes »
16. Barres de progression des programmes + anneau du premier avatar

**Rien d'autre.** Si tu trouves un autre endroit qui « mériterait » du violet, demande-moi avant.

---

## 8. Vérifications finales

- [ ] Comparer côte à côte avec `Coory Redesign v2.dc.html` (1a sombre, 1b clair).
- [ ] Aucun changement de layout : faire un diff visuel avant/après hors couleurs.
- [ ] Thème clair : tous les textes violets utilisent `--violet-text` (#6A3EE0), jamais #8B5CF6 sur blanc pour du petit texte.
- [ ] Le bouton soleil/lune bascule correctement et le choix persiste au rechargement.
- [ ] Disciplines, vert et rouge strictement inchangés.
- [ ] Pas de bordure gauche / liseré ajouté nulle part.

À la fin, donne-moi la liste des fichiers modifiés et, pour chacun, les lignes de couleur changées.
