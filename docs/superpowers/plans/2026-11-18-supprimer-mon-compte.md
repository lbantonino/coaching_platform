# « Supprimer mon compte » : plan

> Exécution native, sans commit (Antonino commite) ; relecture indépendante à la fin. Obligation légale
> (droit à l'effacement du RGPD ; Apple et Google l'exigent pour une app des stores). Décisions
> d'Antonino du 18/11, prises une par une.

**Goal :** un coach supprime lui-même son compte et TOUTES les données de son organisation, depuis
Paramètres › Sécurité, tout de suite, après avoir tapé « SUPPRIMER ».

## Décisions d'Antonino (18/11)
1. Rubrique **Sécurité**, carte à part en bas, bouton rouge.
2. Effacement **tout de suite** (pas de délai de 30 jours, pas de tâche programmée).
3. Confirmation en tapant **« SUPPRIMER »** (marche aussi pour un compte Google) ; la fenêtre dit ce qui
   sera effacé et propose « Télécharger mes données d'abord ».
4. Après : **déconnexion et page de confirmation** (« Ton compte a été supprimé »), sans e-mail.

## Choix pris par Claude
- Le compte de **démo partagé** ne se supprime jamais (même garde que le mot de passe : `isDemoAccount`).
- Organisation partagée avec un autre coach (pas encore possible dans le MVP) : refus, avec un message
  qui renvoie vers le support (on ne supprime pas les données d'un autre coach).
- Ordre : fichiers du stockage (`org/<organisation>/…` dans les trois dossiers, `user/<coach>/…` des
  photos) ; puis les données (fonction SQL `delete_account_data`, réservée au serveur depuis la relecture, qui efface les sportifs, bloqués
  par `on delete restrict`, puis l'organisation, en cascade) ; puis le compte (`auth.admin.deleteUser`,
  la voie officielle de Supabase) ; puis la déconnexion. Une étape qui échoue s'arrête avec un message ;
  relancer reprend là où ça s'est arrêté.
- Le client privilégié (`src/lib/supabase/admin.ts`, serveur seulement) sert au stockage et au compte ;
  sa liste d'usages autorisés est mise à jour.
- Page `/compte-supprime`, publique, sobre (logo, titre, texte, « Retour à l'accueil »).

## Review Focus
1. Un autre coach (autre organisation) n'est jamais touché ; un sportif qui a son propre compte garde
   son compte (seule sa fiche chez ce coach disparaît).
2. Le compte de démo : refus côté serveur, même si l'action est appelée directement.
3. Une étape qui échoue au milieu (stockage, données, compte) : rien de cassé, on peut relancer.
4. Sans « SUPPRIMER » exact (casse, espaces) : refus côté serveur aussi.
5. Après la suppression : plus de session, l'ancien mot de passe ne connecte plus, la page de
   confirmation s'affiche même déconnecté.

### Task 1 : fonction SQL (pgTAP d'abord)
`supabase/migrations/20261118120000_supprimer_mon_compte.sql` (`delete_account_data(p_user_id)`) ;
`supabase/tests/database/47_supprimer_mon_compte.test.sql`.

### Task 2 : action, carte de la rubrique Sécurité, page de confirmation (e2e d'abord)
`src/features/account/delete-account.ts` (action `deleteMyAccount`) ; `settings-sections.tsx`
(carte et fenêtre) ; `src/app/(legal)/compte-supprime/page.tsx` ; `tests/e2e/account-delete.spec.ts`
(un coach jetable s'inscrit, crée un sportif, supprime son compte, ne peut plus se connecter ; le
compte de démo ne peut pas).
