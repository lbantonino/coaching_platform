# Discipline d'un programme : visible dans les PDF, modifiable (D-180)

> Conception courte, validée par Antonino le 14/11/2026 (« Oui, ça me va. Continue »).

## Intention

Un **programme hybride**, c'est des jours de course et des jours de musculation qui alternent sur
plusieurs semaines. Ce n'est pas une séance qui mélange les deux : l'éditeur de séance mixte reste celui
du Hyrox. Antonino veut que la discipline du programme se lise partout : pour le sportif (« je fais un
programme hybride »), dans le PDF envoyé, et pour le coach qui retrouve ses sportifs par discipline. Un
même programme peut aussi changer d'objectif dans l'année (marathon, puis compétition de force, puis
Hyrox) : le coach le renomme et en change la discipline, plutôt que d'en créer trois.

## Déjà en place (D-163, D-177, D-178)

- « Hybride » est une discipline principale de l'assistant et de « Utiliser ce modèle ».
- Filtres par discipline dans Programmes et Modèles (Hybride compris).
- Dans tout programme, chaque séance est Running, Musculation ou Hyrox.
- « Renommer » existe dans le menu « ··· » d'un programme et d'un modèle du coach. Un programme publié
  garde son ancien titre dans la fiche et les PDF jusqu'à la prochaine publication (version figée, C21).

## À faire

1. **PDF** (agenda et fiches), pour toutes les disciplines : « Programme running », « Programme
   musculation », « Programme Hyrox », « Programme hybride ».
   - En-tête de page : « Programme hybride · Agenda · 8 semaines » (au lieu de « Agenda du programme ·
     8 semaines ») ; « Programme hybride · Fiches et repères ».
   - Page sommaire : surtitre « Programme hybride · Sommaire ».
   - La discipline vient de la VERSION PUBLIÉE, comme le titre.
2. **« Changer la discipline »** dans le menu « ··· » d'un programme (brouillon ou publié, pas archivé)
   et d'un modèle du coach : une fenêtre avec les 4 disciplines, la discipline actuelle cochée. Le choix
   modifie le brouillon (comme « Renommer »). Programme publié : la phrase « La nouvelle discipline
   apparaîtra dans la fiche et les PDF à la prochaine publication. »

## Hors champ

- Éditeur de séance mêlant course et musculation (retiré de la feuille de route le 14/11).
- Changer automatiquement la façon de viser ou la catégorie Hyrox en changeant de discipline.

## Approches considérées

- **Retenue** : une action dédiée « Changer la discipline », à côté de « Renommer ». Simple à trouver,
  même chemin d'enregistrement que le titre.
- Écartée : fusionner nom et discipline dans une seule fenêtre « Modifier le programme » ; plus de
  changements dans un composant partagé, sans gain pour le coach.
- Écartée : déduire la discipline des séances (running + musculation = hybride) ; le coach doit garder
  la main (un programme running avec un renfo n'est pas « hybride »).
