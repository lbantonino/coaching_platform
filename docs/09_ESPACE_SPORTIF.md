# 09 — Espace sportif : lecture, entraînement, résultats, feedback

## 1. Objectif principal
Le sportif consulte son programme sur téléphone immédiatement avant ou pendant l'entraînement, sans chercher un ancien PDF ou ouvrir un grand tableau difficile à lire. Il garde aussi accès au programme depuis un ordinateur. L'UX mobile doit privilégier lisibilité, faible friction et reprise de séance.

## 2. Navigation cible
Mobile bas : `Aujourd'hui` | `Programme` | `Progression` | `Messages` (V2) | `Profil`. Desktop latérale : Tableau de bord, Mon programme, Calendrier, Historique, Progression, Documents, Messages, Paramètres. Sur mobile, CTA principal de la séance du jour au-dessus de la ligne de flottaison.

## 3. Accueil (ATH-03)
- Prénom, objectif/événement prochain s'il existe, semaine X/Y, date/heure locales, séance prévue aujourd'hui ou prochaine séance.
- Indicateurs : séances de la semaine réalisées/plannifiées, feedback en attente, programme mis à jour (dernière publication).
- Actions : ouvrir séance, reprendre une séance en cours, voir la semaine, télécharger le PDF publié.
- Aucun chiffre inventé : si aucun programme publié -> écran d'attente avec lien contact coach ; si jour de repos -> indiquer repos.

## 4. Programme et calendrier (ATH-02 / ATH-03)
- Calendrier semaines 1..N, filtrable par état et discipline ; vue liste privilégiée sur mobile.
- Pour chaque séance : date OU position « Séance N », nom, discipline, estimation durée, cible intensité, état prévu/fait/partiel/reporté/manqué si marqué explicitement.
- Navigation version publiée courante et historique : montrer badge « Nouvelle version du coach » si republié ; PDF associé à la version.
- Pas de modification du plan prescrit par le sportif. Il peut reporter une séance si coach l'autorise : journaliser et notifier coach selon réglage.

## 5. Détail de séance (ATH-04)
- En-tête : type, nom, objectif, durée/distance cible, consignes et matériel.
- Blocs ordonnés, répétitions imbriquées dépliables, unités bien visibles : `5 × (2 min @ 5:00/km + 2 min récup)` ; `3 × 8/jambe`, kg, RPE ; `2:30/500m` pour erg.
- Hiérarchie colorée non uniquement par couleur, libellés clairs et contraste conforme WCAG AA.
- Pour circuits Hyrox, cartes « Bloc 1 », « Tour 1/3 », `Sled Push 25m` et notes, avec option de cocher étape.
- Actions : démarrer, sauvegarder progression, terminer/partiel/sauter/reporter, ouvrir consignes, contacter coach si implémenté.

## 6. Mode actif sur téléphone (ATH-05)
Version initiale : liste de blocs consultables et cases optionnelles `completed`, notes par exercice si activées, bouton fin de séance. Ne pas prétendre à des chronos de précision ou background timers PWA avant tests en veille iOS/Android. V2 : timer de repos fiable dans les limites du navigateur, entrée réelle par set et rythme, attachements photo avec droits.

**États** : `not_started -> in_progress -> completed | partial | skipped`; annuler changement par nouvelle entrée d'historique ou correction contrôlée. Un abandon/sortie d'écran n'implique pas « terminé » ; double tap doit être idempotent.

## 7. Feedback à la fin (ATH-06)
Formulaire : statut, date/heure réelle, RPE 1..10 optionnel selon coach, difficulté simple `facile / modérée / difficile`, commentaire libre, éventuel réel par bloc (charge/rép/durée/distance). Afficher distinction **Prescrit** / **Réalisé** et avertir si saisie de valeurs incompatible.

Exemple de scénario de démo : séance terminée, RPE 7/10, commentaire « dernière répétition difficile » ; il apparaît chez coach immédiatement après persistance et autorisation. Le RPE est ressenti subjectif, pas évaluation médicale.

## 8. Progression et métriques (ATH-07)
**MVP** : nombre de séances réalisées/plannifiées, calendrier d'assiduité, RPE moyens seulement quand assez de réponses, volume running saisi/estimé avec indication de source. **V2** : évolutions d'allures/charges réellement renseignées, temps par type, suivi des objectifs et comparaison avec repères d'origine.

Ne jamais calculer une VO2max ou calories depuis des données insuffisantes, afficher « aucune donnée » plutôt que 0. Les statistiques doivent être datées et distinguer projection vs mesure.

## 9. Messages/documents/rappels
Documents : versions PDF publiées accessibles seulement au sportif, téléchargement avec URL courte durée ou route serveur vérifiée. Messages V2 : conversation 1:1 coach-sportif, pièces jointes soumises à contrôle, notifications opt-in. Rappels de séance paramétrables, pas de spam automatique. Après trois séances complétées : possibilité future de questionnaire, gérée par automatisations et consentements, jamais inscrite en dur dans vue.

## 10. Accessibilité et contexte gym
Grande zone tactile, typographie 16 px+, mode contraste, navigation utilisable d'une seule main, pas de dépendance à hover, ordre de lecture correct, prise en charge d'écran étroit, éviter les modales imbriquées. Conserver position de lecture dans la séance. Expliquer « connexion requise » et l'état du réseau ; si le programme s'affiche via cache PWA, éviter de laisser enregistrer un feedback non synchronisé sans bannière.

## 11. Tests de recette
- [ATH-01] Sportif B ne voit pas l'entraînement de A via URL directe ni API.
- [ATH-02] Le programme publié est identique sur desktop, mobile et PDF, y compris blocs répétés.
- [ATH-03] Séance running et Hyrox restent lisibles sur smartphone 360px sans défilement horizontal.
- [ATH-04] Marquer terminé + RPE 7 et commentaire met à jour tableau coach, sans rechargement trompeur.
- [ATH-05] Pas de double réalisation suite à double clic/rafraîchissement ; une correction laisse trace.
- [ATH-06] Programme republié : l'historique des séances de l'ancienne version reste accessible.
