# 06 · Modifier la séance (individuelle) — interactions

| Élément | Déclencheur | Comportement attendu | Cas limites / statut |
|---|---|---|---|
| Interrupteur récurrence | Clic | Affiche/masque « Jusqu’au » ; récap « Chaque jeudi, 07:00 » | — |
| Prix | Saisie | Recalcule la ligne : « 65,00 € HTVA : le sportif paie 78,65 €, TVA de 21 % comprise. » | Vide : « Aucun prix : la séance ne sera pas facturée. » |
| Case TVA comprise | Clic | Le prix saisi devient TTC (HT = prix/1,21) | Taux = paramètre 13 (21 %) |
| Virement / Espèces | Clic | Change le mode (récap à jour) | — |
| Enregistrer | Clic | Sauvegarde via la logique existante ; retour à la page d’origine | Ne pas modifier la logique d’enregistrement |
| Annuler | Clic | Retour sans sauvegarder (confirmation si modifié — PROPOSED) | — |
| Supprimer la séance | Clic | Boîte de confirmation du kit Modals, puis suppression | Récurrente : choisir « cette séance / toutes » (TO-VERIFY) |
| Voir la fiche | Clic | Fiche du sportif | — |

Inventaire exhaustif (handler par élément) : `interactive-elements.md`. Logique de référence : `../../source-design-files/pages/06-modifier-seance/logic.js`.
