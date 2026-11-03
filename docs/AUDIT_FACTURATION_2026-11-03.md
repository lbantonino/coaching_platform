# Audit : facturation et comptabilité dans Coory

> **Pour :** Antonino (et Gianluca).
> **Date :** 3 novembre 2026.
> **Question posée :** Coory a-t-il besoin d'une page Facturation (créer des factures), ou une Comptabilité qui suit l'argent reçu et dépensé suffit-elle, surtout pour une app qui veut aller à l'international ?
>
> Ce document s'appuie sur les sites officiels belge (efacture.belgium.be, SPF Finances) et français (impots.gouv.fr), consultés le 3/11/2026. **Ce n'est pas un avis juridique** : les points marqués « à vérifier » sont à faire confirmer par un comptable.

> **Décision d'Antonino (3/11/2026, D-90) : option C simplifiée, faite le jour même.** Plus de page
> Facturation ni de structures légales. La Comptabilité est un aperçu visuel, le même dans tous les
> pays (gagné, dépensé, résultat, séances « à encaisser »), sans règle légale d'aucun pays. Le
> journal des recettes est abandonné (règle belge). Un seul réglage : le taux de TVA du coach.
> Plus tard, seulement si des coachs le demandent : un export Excel des paiements et des dépenses,
> puis un bouton « Créer la facture dans Odoo » (qui passe par l'API d'Odoo, réservée à la formule
> Custom selon le forum officiel : à vérifier sur la formule de Gianluca). Les sections 7 et 8
> ci-dessous décrivent la recommandation telle qu'elle a été présentée.

---

## 1. La réponse courte

**Coory n'a pas besoin de créer des factures.** Je recommande de garder la **Comptabilité** (argent reçu, dépenses, résultat), de **retirer la page Facturation** (création de factures), d'ajouter des **exports pour le comptable**, puis plus tard des **connexions** vers les vrais logiciels de facturation (Odoo et les autres).

Quatre raisons :

1. **En Belgique, un coach n'a pas à faire de facture à un particulier.** Il note simplement ses encaissements dans un « journal des recettes ». La plupart des clients d'un coach sont des particuliers.
2. **Pour un client entreprise, le PDF ne suffit plus depuis le 1er janvier 2026.** La facture doit être un fichier électronique structuré, envoyé par le réseau **Peppol**. Pour le faire lui-même, Coory devrait devenir un logiciel de facturation agréé : un chantier énorme, coûteux, avec une vraie responsabilité légale.
3. **Chaque pays a son propre système**, et ils changent souvent :
   - la France passe par des plateformes agréées ;
   - l'Italie a son système depuis 2019 ;
   - la Pologne, l'Allemagne et l'Espagne ont chacune leur calendrier.

   Suivre la loi de chaque pays, c'est le métier d'un logiciel de facturation, pas d'une app de coaching.
4. **Les coachs ont déjà un outil ou un comptable.** Gianluca utilise Odoo, qui envoie ses factures par Peppol. Coory n'a pas à refaire Odoo : il doit lui faciliter la vie.

---

## 2. Les mots à connaître

| Mot | Ce que ça veut dire |
|---|---|
| **B2B / B2C** | B2B : tu factures une entreprise. B2C : tu factures un particulier (le cas le plus courant pour un coach). |
| **Facture électronique structurée** | Ce n'est **pas** un PDF. C'est un fichier de données (norme européenne EN 16931) que le logiciel du client lit tout seul, sans que personne ne tape rien. |
| **Peppol** | Un réseau européen qui transporte ces factures, comme une poste des factures. On ne s'y branche pas soi-même : on passe par un **point d'accès**, c'est-à-dire un logiciel agréé. Chaque entreprise y a une adresse (en Belgique, son numéro BCE). |
| **Odoo** | Un logiciel de gestion belge (comptabilité, facturation, stock…) qui sert aussi de point d'accès Peppol. Gianluca y crée ses factures, et Odoo les envoie par Peppol. |
| **E-reporting** | Envoyer à l'administration fiscale les données des factures, presque en temps réel. Prévu en Belgique vers 2028 (pas encore voté) ; en France, il touche aussi les ventes aux particuliers. |
| **Régime de franchise (Belgique)** | Pour un chiffre d'affaires de 25 000 € HTVA par an au plus : pas de TVA à facturer. On reste quand même assujetti, avec des obligations. |
| **Journal des recettes** | Le registre des encaissements faits sans facture. On peut y inscrire **un total par jour** ; une vente de plus de 250 € TVAC s'inscrit à part. |

---

## 3. La loi belge en 2026, appliquée à un coach

| Situation | Facture obligatoire ? | Sous quelle forme ? |
|---|---|---|
| Client **particulier** (cas courant) | **Non** (sauf s'il la demande) | Inscrire l'encaissement au **journal des recettes** (total du jour). Si le client demande une facture, un PDF ou du papier convient ; par voie électronique, il faut son accord. |
| Client **entreprise belge assujettie à la TVA** (une société qui paie le coaching de ses employés, une salle qui sous-traite…) | **Oui** | **Facture électronique structurée via Peppol**, obligatoire depuis le 1/1/2026. Un PDF ou du papier ne vaut plus comme facture. |
| **Recevoir** des factures de ses fournisseurs | — | Tout coach assujetti à la TVA, **même en franchise**, doit pouvoir **recevoir** des factures Peppol. |
| Coach en **franchise** (≤ 25 000 €) | Mêmes règles | La franchise **n'exempte pas** de Peppol. |
| Activité **uniquement exonérée** (article 44 du Code de la TVA) | — | Ni envoi ni réception Peppol obligatoires. Cela pourrait concerner certaines ASBL sportives : **à vérifier pour BeHybrid**. |

Autres points utiles :
- **Tolérance terminée** : la période de grâce a duré jusqu'à fin mars 2026 (fin juin 2026 pour l'autofacturation). Depuis, les amendes sont possibles. Un recours au cas par cas existe pour les problèmes techniques exceptionnels.
- **Pas d'outil gratuit de l'État** : l'administration a choisi de laisser faire le marché. Elle précise que le coût peut être nul quand l'envoi Peppol est inclus dans un logiciel qu'on utilise déjà.
- **2028** : l'e-reporting (déclaration des factures B2B à l'administration) figure dans l'accord de gouvernement, mais n'est pas encore une loi.
- **Conservation** : 10 ans pour les livres et les factures.
- **TVA d'un coach sportif** : 21 % pour du coaching sans prescription médicale, selon une source professionnelle (**à vérifier**).

---

## 4. Ailleurs : pourquoi l'international complique tout

**France** (source officielle : impots.gouv.fr)
- **Recevoir** des factures électroniques : obligatoire pour toutes les entreprises depuis le **1/9/2026**.
- **Émettre** : obligatoire depuis le 1/9/2026 pour les grandes entreprises et les ETI ; pour les **PME et micro-entrepreneurs** à partir du **1/9/2027**.
- Le passage par une **plateforme agréée** par l'administration est obligatoire.
- **Particuliers** : pas de facture électronique, mais un **e-reporting** (les données des ventes sont transmises à l'administration).
- Les **micro-entrepreneurs en franchise** de TVA sont concernés.
- Les activités exonérées de TVA (articles 261 à 261 E du CGI) ne sont pas concernées pour l'émission, mais doivent pouvoir recevoir.

**Reste de l'Europe** (sources professionnelles, dates à vérifier)
- **Italie** : système national obligatoire depuis 2019.
- **Pologne** : KSeF, en place depuis 2026.
- **Allemagne** : réception depuis 2025, émission à partir de 2027.
- **Espagne** : Verifactu, dates repoussées à 2027 et peut-être au-delà.
- **Union européenne** : facture électronique obligatoire pour les échanges entre pays de l'UE au **1/7/2030** (réforme ViDA).

**Conclusion** : à peu près un système par pays, avec ses formats, ses plateformes agréées et des dates qui bougent. Aucune app de coaching ne peut suivre tout ça sérieusement : c'est le métier des logiciels de facturation.

---

## 5. Ce que Coory fait aujourd'hui

| Fonction | Où | Utile au coach ? | Problème légal ou international |
|---|---|---|---|
| **Paiements reçus** (sportif, date, montant, mode, TVA) | Comptabilité, séances | **Oui**, c'est le cœur du suivi | Aucun : ce n'est pas une facture. Peut servir de base au **journal des recettes** belge. |
| **Prix des séances, « Marquer payée », forfaits** | Agenda, page séance | **Oui** | Aucun. |
| **Dépenses** (catégories, mensuelles, TVA récupérable) | Comptabilité | **Oui** | Aucun (suivi interne). |
| **Gagné / Dépensé / Résultat, répartition par mode, TVAC / HTVA / TVA** | Comptabilité | **Oui** | Ce sont des **estimations** : à présenter comme telles, pas comme une déclaration de TVA. |
| **Factures** (brouillon, émission, numéro `FAC-2026-0001`, PDF, échéance, « en retard ») | Facturation | **Partiellement** | **Entreprise belge** : le PDF n'est plus une facture valable depuis 2026, donc un risque pour le coach. **Particulier** : une facture est rarement nécessaire. **Étranger** : chaque pays a ses règles. Surtout, la page **donne une fausse impression de conformité**. |
| **Structures légales** (BCE vérifié, TVA, IBAN / BIC, adresse, mentions) | Paramètres | Seulement pour les factures | Des règles belges écrites en dur : contrôle BCE, IBAN, taux 21 / 12 / 6 / 0 % proposés. |
| **« À facturer »** et « Proposer aussi les espèces à facturer » | Facturation, Paramètres | Lié aux factures | Idem. |
| **Notes de crédit** (prévues) | — | — | Inutiles si on retire les factures. |
| **Export des données** (JSON, droit RGPD) | Paramètres | Oui (portabilité) | Ce n'est **pas un export comptable** : rien que le comptable puisse ouvrir directement (CSV ou Excel). |

**Poids de la facturation dans le code** : environ 4 200 lignes (domaine, actions, PDF, pages, fiche des structures) et 4 migrations de base de données. Comme il n'y a encore aucun vrai utilisateur, les retirer ne fait perdre aucune donnée réelle.

**Ce que la décision D-66 avait déjà vu juste** : Coory ne décide d'aucune règle légale, et c'est le coach qui est responsable. La loi de 2026 va plus loin : pour les entreprises clientes, le PDF n'est plus une facture du tout. Il ne suffit donc plus de laisser le coach écrire ses mentions.

---

## 6. Ce que fait Gianluca (Odoo et Peppol) : est-ce juste ?

**Oui.** Il est assujetti à la TVA. Dès qu'il facture une entreprise belge, il doit envoyer une facture Peppol, et Odoo le fait pour lui. Odoo tient aussi sa vraie comptabilité, avec son comptable.

Coory n'a donc pas à refaire Odoo. Sa place est ailleurs :
- savoir **qui a payé quoi** et **ce qui reste à encaisser** ;
- voir l'**activité de la semaine** et le **résultat du mois** ;
- **transmettre** ces informations à Odoo (ou à l'outil du coach) au lieu de les retaper.

---

## 7. Les trois options

### A. Garder la page Facturation telle quelle
- **Pour** : déjà construite et testée ; utile au coach qui veut remettre un document à un particulier.
- **Contre** :
  - Pour une entreprise belge, le PDF n'est **plus une facture valable** depuis 2026, et le coach peut se croire en règle alors qu'il ne l'est pas.
  - Des règles belges sont écrites en dur, ce qui ne marche pas à l'international.
  - Le module ne sert presque à rien pour les particuliers, qui n'ont pas besoin de facture.
  - Il faudra encore ajouter les notes de crédit.

### B. Faire de Coory un vrai logiciel de facturation conforme
- **Pour** : le coach ferait tout dans Coory.
- **Contre** :
  - Il faudrait devenir point d'accès Peppol en Belgique et plateforme agréée en France (certifications, coûts, sécurité, support), puis recommencer pour chaque pays.
  - La responsabilité légale serait énorme.
  - C'est un **autre métier**, qui éloignerait Coory du coaching.
  - **Déconseillé.**

### C. Coory suit l'activité, la facture vit dans l'outil du coach (**recommandé**)
- **Pour** :
  - Marche dans **tous les pays** sans changer de code.
  - Aucune responsabilité légale sur les factures.
  - Moins de code à maintenir.
  - Coory reste centré sur ce qui le rend unique : le coaching.
  - Couvre le cas le plus courant (particuliers, journal des recettes).
- **Contre** :
  - Un coach sans aucun outil devra en choisir un pour ses rares clients entreprises (beaucoup sont gratuits ou bon marché).
  - On retire un module déjà construit (le travail reste dans l'historique Git).

---

## 8. Plan proposé (si tu choisis C)

**Étape 1, simplifier (petite tranche)**
- Retirer la page **Facturation** du menu, avec la création de factures, les numéros, le PDF et les **structures légales**.
- Garder les paiements reçus, les prix des séances, les forfaits, les dépenses et la Comptabilité.
- Garder la TVA **en option** (« Je facture la TVA : taux… »), pour afficher HTVA et TVA dans les chiffres. Pas de liste de taux par pays, comme le prévoit déjà D-69.
- Déplacer **« À encaisser »** (séances données, pas encore payées) et les retards dans la Comptabilité, et mettre à jour la cloche, qui renvoie aujourd'hui vers la Facturation.

**Étape 2, servir le comptable**
- **Exporter** les paiements et les dépenses d'une période (CSV ou Excel).
- Exporter un **journal des recettes** (un total par jour) pour les coachs belges.
- En option : un **reçu de paiement** simple pour le client qui en demande un, clairement intitulé « reçu », pas « facture ».

**Étape 3, connecter (après la mise en ligne)**
- Un bouton **« Envoyer à mon logiciel de facturation »** : commencer par **Odoo** (qui a une interface de programmation), puis les outils les plus utilisés par les coachs de chaque pays.
- Exemples à étudier le moment venu : Billit, Accountable ou Yuki en Belgique ; Pennylane ou Tiime en France ; Xero ou QuickBooks ailleurs.
- Le coach y crée sa facture, et c'est l'outil qui gère Peppol, la plateforme agréée et l'e-reporting.

---

## 9. À faire vérifier par un comptable

1. Coach sportif indépendant en Belgique : **TVA à 21 %** pour du coaching sans prescription médicale ?
2. **BeHybrid (ASBL)** : ses activités sont-elles toutes exonérées au titre de l'article 44 ? Si oui, elle n'a pas d'obligation Peppol.
3. Le **journal des recettes** : un export de Coory (un total par jour) est-il accepté tel quel ?
4. Les **montants des amendes** belges pour une facture non conforme : je ne les ai pas trouvés sur les pages officielles consultées.

---

## 10. Sources (consultées le 3/11/2026)

**Officielles, Belgique**
- [efacture.belgium.be, la facturation électronique entre entreprises obligatoire depuis 2026](https://efacture.belgium.be/fr/article/les-factures-electroniques-structurees-entre-entreprises-sont-obligatoires-depuis-2026)
- [efacture.belgium.be, pour qui la facturation électronique est obligatoire](https://efacture.belgium.be/fr/article/pour-qui-la-facturation-electronique-deviendra-t-elle-obligatoire)
- [efacture.belgium.be, FAQ entre entreprises](https://efacture.belgium.be/fr/FAQ/questions-generales-b2b)
- [efacture.belgium.be, fin de la période de tolérance (7/4/2026)](https://efacture.belgium.be/fr/news/fin-de-la-periode-de-tolerance-pour-le-facturation)
- [efacture.belgium.be, FAQ e-reporting](https://efacture.belgium.be/fr/FAQ/questions-generales-sur-le-e-reporting)
- [efacture.belgium.be, pas de solution gratuite de l'administration](https://efacture.belgium.be/fr/article/liste-solutions-longue-ou-commencer-solution-administration)
- [SPF Finances, comptabilité et facturation (pas de facture obligatoire pour les particuliers, journal des recettes)](https://finances.belgium.be/fr/entreprises/tva/comptabilite-facturation/comptabilite-facturation)
- [SPF Finances, régime de la franchise (25 000 €)](https://finances.belgium.be/fr/entreprises/tva/assujettissement-tva/regime-franchise-taxe)

**Officielles, France**
- [impots.gouv.fr, je passe à la facturation électronique](https://www.impots.gouv.fr/professionnel/je-passe-la-facturation-electronique)
- [impots.gouv.fr, à partir de quand suis-je concerné ?](https://www.impots.gouv.fr/professionnel/questions/partir-de-quand-suis-je-concerne-par-la-reforme-de-la-facturation)
- [impots.gouv.fr, franchise en base et micro-entrepreneur](https://www.impots.gouv.fr/professionnel/questions/franchise-en-base-micro-entrepreneur-ou-auto-entrepreneur-suis-je-concerne)
- [impots.gouv.fr, clients entreprises et particuliers](https://www.impots.gouv.fr/professionnel/questions/mes-clients-sont-la-fois-des-entreprises-et-des-particuliers-par-quel)

**Professionnelles (à recouper)**
- [Odoo, facturation électronique en Belgique (page commerciale d'Odoo)](https://www.odoo.com/electronic-invoicing/belgium)
- [Odoo, documentation de la facturation électronique](https://www.odoo.com/documentation/saas-17.2/zh_CN/applications/finance/accounting/customer_invoices/electronic_invoicing.html)
- [Forum for the Future, obligations de facturation selon le statut](https://blog.forumforthefuture.be/fr/article/quelles-sont-mes-obligations-de-facturation-selon-mon-statut-ou-mes-prestations-que-je-sois-une-entreprise-une-association-ou-un-independant/22746)
- [Billy, kinésithérapeute et coaching sportif (TVA à 21 %)](https://billy.tech/guide/metier/kinesitherapeute/)
- [Commission européenne, adoption de ViDA](https://ec.europa.eu/newsroom/digital/items/877702)
- [OriginStamp, calendrier des pays de l'UE 2026-2030](https://originstamp.com/en/blog/reader/eu-e-invoicing-mandates-timeline-2026-2030)
- [Vertex, état des obligations par pays (novembre 2025)](https://www.vertexinc.com/en-gb/node/7968)
