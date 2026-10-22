# Maquettes cibles de Coory (D-28)

Maquettes fournies par Antonino le 22 et le 23/10/2026 : c'est **l'apparence visée** de chaque page de
l'espace coach. Une page est construite à l'image de sa maquette **quand sa phase arrive** dans la
roadmap (`docs/14_TESTS_ET_ROADMAP.md`), avec de vraies données. Avant, la page « Bientôt » du module
dit ce qui arrive ; rien n'est simulé (règle « pas de fausse interface »).

Les chiffres et les noms visibles sur les maquettes (« 25 h », « Emma Durand », « 3 240 € »…) sont
des **exemples de mise en page**, pas des données.

## Éléments communs à toutes les pages

- **Menu latéral** : Tableau de bord, Sportifs, Programmes, Agenda, Séances, Facturation,
  Comptabilité, Bibliothèque ; en bas : Tâches, Documents, Messages, Paramètres ; carte du coach
  (photo, nom, « Coach »). Élément actif sur fond rouge teinté.
- **En-tête** : titre (H1) + phrase d'explication ; à droite « Rechercher dans Coory… », cloche des
  notifications, bouton rouge d'action principale (une seule par écran).
- **Quatre cartes chiffrées** en haut, chacune teintée (bleu, rouge, vert, violet, ambre), grand
  chiffre + libellé + précision, petit losange rouge en coin.
- **Carte principale** avec titre, sous-titre, filtres en pastilles, recherche, tableau ou grille,
  menu « ••• ».
- **Téléphone** (demandes du 23/10) : menu hamburger à la place de la barre du bas ; éléments
  d'en-tête centrés.

## Pages

| Page | Image | Phase | Contenu de la maquette |
| --- | --- | --- | --- |
| **Tableau de bord** | `maquettes/tableau-de-bord.png` | **Fait le 23/10** (D-28) | « Bonjour {prénom} », période + « Créer » (Programme, Séance, Sportif, Facture, Tâche) ; cartes coachings de la semaine, sportifs actifs, programmes à livrer, factures en attente ; agenda Semaine / Mois / Aujourd'hui ; tâches prioritaires ; revenus du mois ; sportifs récents ; programmes en cours ; factures récentes |
| **Fiche sportif** | `maquettes/fiche-sportif.png` | **Fait** (D-21, P2-04) | En-tête (avatar, statut, niveau, « Inviter dans son espace », « Créer un programme »), cinq chiffres clés, onglets ; cartes Profil, Objectif actuel (phases Préparation → Compétition), Disponibilités, Repères et évolution, Notes, Historique |
| **Agenda** | à ajouter : `maquettes/agenda.png` | P2-05 fait ; refonte visuelle à faire | Cartes : heures de coaching planifiées, séances programmées, créneaux libres, séances collectives. « Semaine du … », vues Semaine / Jour / Mois / Aujourd'hui, « Filtrer les coachings » ; grille 08:00–20:00, blocs « 09:00 — Emma · Running » colorés par discipline, nombre de séances par jour ; glisser-déposer des rendez-vous ; bouton « Ajouter un rendez-vous » |
| **Programmes** | à ajouter : `maquettes/programmes.png` | **P4** (P5 pour la livraison) | Cartes : programmes actifs, à livrer, modèles réutilisables, % de séances réalisées. Tableau « Tous les programmes » (filtres Tous / En cours / À livrer / Brouillons) : sportif (avatar), programme (« Plan Hybride · 12 semaines », séances/semaine), discipline, barre de progression « Semaine 6/12 », statut. En bas : bibliothèque de modèles (cartes) et échéances à venir |
| **Séances** | à ajouter : `maquettes/seances.png` | **P3** (modèles), **P5–P6** (planning, retours) | Cartes : séances aujourd'hui, feedbacks reçus, séances restantes, séance à adapter. « Planning des séances » (Aujourd'hui / À venir / Terminées / En attente de retour) : heure, sportif, type, statut (Terminée, En cours, À venir). « Détails de la séance » : blocs Échauffement / Renforcement (exercices, séries × répétitions) / Retour au calme, feedback du sportif, « Ouvrir l'éditeur de séance » |
| **Bibliothèque** | à ajouter : `maquettes/bibliotheque.png` | **P3** | Cartes : exercices, modèles, blocs, semaines. Grille « Exercices et modèles » (filtres Tous / Running / Musculation / Hyrox / Hybride, recherche) : vignette colorée par discipline, badge, titre (« Running · Sortie longue »), « Modèle de séance personnalisable », « Ouvrir le modèle ». Bouton « Ajouter un modèle » |
| **Facturation** | à ajouter : `maquettes/facturation.png` | **Après P6** (D-17, étapes A et B ; OPEN-17) | Cartes : encaissé ce mois, en attente, en retard, factures à préparer. Tableau « Factures clients » (Toutes / Brouillons / À envoyer / En attente / Payées / En retard) : n° FAC-AAAA-NNN, client (avatar), date, montant, statut. « Créer une facture » (sportif, prestation) ; « Paiements et relances ». Aucun paiement en ligne via Coory |
| **Comptabilité** | à ajouter : `maquettes/comptabilite.png` | **Après P6** (D-17 ; OPEN-17) | Cartes : chiffre d'affaires, dépenses, résultat estimé, factures impayées. Histogramme du chiffre d'affaires sur 12 mois ; anneau « Répartition des dépenses » (location salle, matériel, services, autres) ; tableau « Mouvements récents » (date, libellé, Revenu / Dépense, montant). Mention « vue de gestion, pas une comptabilité légale certifiée » |
| **Documents** | à ajouter : `maquettes/documents.png` | **P5** (PDF des programmes), puis facturation | Cartes : documents, programmes PDF, factures, récents. Tableau « Toutes les pièces jointes » (Tous / Programmes / Factures / Contrats / Autres) : document, catégorie, associé à (sportif), dernière modification, action. « Accès rapide » ; « Ajouter » (nom, associer à un sportif). Bouton « Importer un fichier » |
| **Messages** | à ajouter : `maquettes/messages.png` | **P7** | « Conversations » (recherche, avatar, nom, dernier message) et « Discussion sélectionnée » (sportif, programme en cours, fil des messages, « Écrire un message… »). Bouton « Nouveau message ». Consentement et canal préféré respectés |
| **Tâches** | à ajouter : `maquettes/taches.png` | **Avec P4 à P7** (produites par les modules) | Cartes : ouvertes, urgentes, programmes, terminées. Tableau « Toutes les tâches » (Toutes / Aujourd'hui / À venir / Terminées) : case à cocher, tâche, associé à (Programme, Facturation, Paiement, Suivi, Agenda), échéance, priorité (Haute / Normale), statut. « Accès rapide » ; « Ajouter » |
| **Paramètres** | à ajouter : `maquettes/parametres.png` | Profil coach **fait** (D-28) ; le reste avec ses modules | Cartes : organisation, appareils, notifications, abonnement. Blocs : Profil et informations de l'entreprise ; Préférences et notifications (P7) ; Facturation et informations légales (D-17) ; Sécurité et accès. Bouton « Enregistrer » |

Pour garder les images de ces pages, déposer les fichiers PNG dans `docs/design/maquettes/` avec les noms
ci-dessus : seules les maquettes du tableau de bord et de la fiche sportif ont pu être enregistrées automatiquement.
