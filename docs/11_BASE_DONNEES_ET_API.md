# 11 — Contrat de données, architecture relationnelle et API

## 1. Principes de modélisation
PostgreSQL/Supabase, IDs UUID, UTC en stockage, validation Zod en entrée + CHECK/foreign keys en base, `organization_id` sur toutes les données métiers d'un tenant. **Jamais** donner un `organization_id` depuis le client comme autorisation suffisante ; le serveur déduit les droits du JWT membership. Les données publiées doivent être immuables et conserver leur contexte d'époque.

`auth.users` Supabase gère identités ; tables du domaine gèrent leurs relations. Les coachs/athlètes peuvent appartenir à différentes organisations de façon explicite. Interdire l'accès cross-org par RLS même via filtres et jointures.

## 2. Tables noyau (schéma cible)
| Table | Champs principaux | Contraintes / relations |
|---|---|---|
| `organizations` | id, name, slug, owner_user_id, status, timezone, branding_json, created_at | slug unique, owner validé |
| `organization_members` | organization_id, user_id, role(owner/coach), status, invited_by | unique org+user |
| `platform_admins` | user_id, role, is_active | table serveur protégée ; pas de rôle via metadata utilisateur modifiable |
| `athlete_profiles` | id, organization_id, display_name, email, phone, athlete_user_id(nullable), status, timezone, created_by | une fiche coach ne donne pas automatiquement accès au compte |
| `athlete_coach_assignments` | organization_id, athlete_id, coach_user_id, active | contrôle coach délégué V2 |
| `athlete_goals` | id, organization_id, athlete_id, type, title, target_date, priority, status, notes | plusieurs objectifs |
| `athlete_availability` | id, organization_id, athlete_id, weekday, max_minutes, location/equipment | semaine flexible |
| `athlete_reference_metrics` | id, organization_id, athlete_id, kind, numeric_value, unit, assessed_at, method, notes | repères historiques, pas valeur auto |
| `athlete_invites` | id, organization_id, athlete_id, hashed_token, expires_at, state | jamais token clair en base |
| `exercise_catalog` | id, organization_id(nullable global), name, slug, discipline_tags, equipment, allowed_metrics_json, archived_at | global lecture seule ou privé tenant |
| `exercise_aliases` | exercise_id, locale, alias | recherche |
| `block_templates` | id, organization_id, version, name, block_snapshot_json, status | version/snapshot |
| `session_templates` | id, organization_id, version, title, tags, session_snapshot_json, status | version immutable après utilisation |
| `week_templates` | id, organization_id, version, name, slots_json, status | slot/session ref |
| `program_templates` | id, organization_id, version, title, weeks_json, status | V2 |
| `programs` | id, organization_id, athlete_id, coach_user_id, title, goal, start_date, weeks_count, current_draft_revision, active_publication_id, status | un programme métier |
| `program_drafts` | id, program_id, organization_id, revision, editor_user_id, structured_snapshot_json, updated_at | optimisation concurrence |
| `program_publications` | id, organization_id, program_id, number, published_by, published_at, schema_version, snapshot_json, checksum | snapshot immuable / unique number |
| `publication_sessions` | id, organization_id, publication_id, source_session_key, week_index, slot_index, planned_date, session_json | ligne immuable référencée par feedback |
| `session_results` | id, organization_id, publication_session_id, athlete_id, status, performed_at, rpe, difficulty, comment, actuals_json, revision | athlete autorisé uniquement |
| `session_result_events` | id, result_id, actor_user_id, action, payload_diff_json, created_at | audit corrections |
| `pdf_exports` | id, organization_id, publication_id, storage_path, template_version, checksum, generated_at | PDF privé seulement |
| `communications` | id, organization_id, athlete_id, channel, purpose, content, status, provider_ref, sent_at | V2+ ; minimiser contenu logs |
| `consents` | id, organization_id, athlete_id, channel, purpose, granted_at, revoked_at, version | base consentement auditable |
| `automation_rules` | id, organization_id, owner_user_id, trigger_type, threshold, channel, enabled, config_json | V2 |
| `automation_events` | id, organization_id, rule_id, athlete_id, event_key, status, scheduled_at, processed_at | unique rule+event_key/idempotence |
| `audit_logs` | id, organization_id(nullable), actor_id, event, entity_type, entity_id, created_at, metadata | pas secrets ni notes sensibles |

`organization_id` sur les tables de templates globales peut être NULL exclusivement pour catalogue fourni par la plateforme ; politiques RLS différenciées.

## 3. Modèle JSON de la séance structurée (schemaVersion=1)
```json
{
  "schemaVersion": 1,
  "id": "session-local-1",
  "title": "Hyrox - Race Pace",
  "tags": ["hyrox", "running"],
  "athleteNotes": "Rester régulier",
  "coachPrivateNotes": "À revoir semaine 4",
  "blocks": [
    {"id":"b1", "kind":"simple", "name":"Échauffement", "items":[{"id":"m1","kind":"movement","exerciseKey":"run","target":{"durationSec":600,"paceSecPerKm":390}}]},
    {"id":"b2", "kind":"repeat", "repeatCount":4, "items":[
      {"id":"m2","kind":"movement","exerciseKey":"run","target":{"distanceM":800,"paceSecPerKm":345}},
      {"id":"m3","kind":"movement","exerciseKey":"sled_pull","target":{"distanceM":25,"loadKg":100}},
      {"id":"r1","kind":"rest","durationSec":120}
    ]}
  ]
}
```
Exemple **purement illustratif** : charges/allures ne sont pas des prescriptions recommandées. En implémentation, remplacer `exerciseKey` par FK ou snapshot explicite, avec validation versionnée et catégories typées (`RunningTarget`, `StrengthTarget`, `ErgTarget`, `SledTarget`). **Éviter un JSON non typé « fourre-tout »**, malgré un stockage de snapshot JSONB utile pour publications.

## 4. Contrats de cas d'usage, **pas d'API REST obligatoire** (V1.1)
Le tableau suivant identifie les **opérations métier à implémenter**. Les chemins `/api/v1/...` sont **illustratifs** et ne signifient pas qu'il faut créer un endpoint pour chaque action. Pour l'application Next.js : **lecture depuis les Server Components/services serveur**, **mutations via Server Actions/Functions** quand adaptées ; **Route Handlers** pour téléchargement PDF, webhooks d'intégrations et vrais usages HTTP. La logique n'est écrite qu'une fois dans des services TypeScript du domaine ; les différents points d'entrée les appellent. Chaque entrée authentifiée valide Zod et vérifie rôle, organisation et propriété de la ressource ; RLS ajoute une défense en profondeur.

**Éviter un backend Express/NestJS parallèle, GraphQL, ORM additionnel ou une API CRUD générée manuellement** sans nécessité démontrée. Supabase fournit déjà un client d'accès aux données ; employer les transactions SQL/une fonction Postgres versionnée uniquement là où l'atomicité multi-tables l'impose (ex. publication). Ne pas faire reposer la sécurité sur une valeur `organization_id` non vérifiée venant du navigateur.

| Opération | Endpoint indicatif | Rôles | ID fonctionnel |
|---|---|---|---|
| Liste clients | `GET /api/v1/athletes?search=&status=` | coach | CRM-02 |
| Créer client | `POST /api/v1/athletes` | coach | CRM-02 |
| Lire/modifier client | `GET/PATCH /api/v1/athletes/:id` | coach + athlète lecture filtrée | CRM-03 |
| Objectifs/références | `GET/POST/PATCH /api/v1/athletes/:id/goals` | coach | CRM-03 |
| Catalogue exercices | `GET /api/v1/exercises` | coach (sportif via snapshot publié) | LIB-01 |
| Créer exercice privé | `POST /api/v1/exercises` | coach | LIB-01 |
| Modèles blocs/séances/semaines | `GET/POST /api/v1/templates/:kind` | coach | LIB-02 |
| Créer programme | `POST /api/v1/programs` | coach | PRG-01 |
| Lire/écrire brouillon | `GET/PATCH /api/v1/programs/:id/draft` | coach | PRG-02 |
| Prévisualiser validation | `POST /api/v1/programs/:id/validate` | coach | PRG-05 |
| Publier une révision | `POST /api/v1/programs/:id/publish` | coach | PRG-05 |
| Lister publications | `GET /api/v1/programs/:id/publications` | coach, sportif propriétaire en vue réduite | PRG-05 |
| Export PDF | `POST /api/v1/publications/:id/pdf` | coach | DOC-01 |
| PDF publié du sportif | `GET /api/v1/my/documents/:id/download` | sportif lié | DOC-01 |
| Programme sportif | `GET /api/v1/my/programs/current` | sportif | ATH-02 |
| Détail séance | `GET /api/v1/my/sessions/:id` | sportif propriétaire | ATH-04 |
| Sauver feedback | `PUT /api/v1/my/sessions/:id/result` | sportif propriétaire | ATH-06 |
| Liste feedback coach | `GET /api/v1/coach/feedback` | coach | ATH-01 |
| Invitation sportif | `POST /api/v1/athletes/:id/invite` | coach | AUTH-01 |
| Organisations admin | `GET /api/v1/admin/organizations` | admin plateforme | ADM-01 |

Pour chaque endpoint documenter `request/response`, erreurs 400/401/403/404/409/422/500, rate-limit, pagination, idempotency key pour publier/générer/envoyer et version de schéma. Un GET cross-tenant retourne 404 ou 403 selon politique sans divulguer existence.

## 5. Example response erreurs cohérent
```json
{"error":{"code":"REVISION_CONFLICT","message":"Le brouillon a été modifié ailleurs.","details":{"expected":12,"actual":13}}}
```
Ne pas inclure de note santé, mot de passe ou donnée d'un autre tenant dans détails erreur.

## 6. Transactions et règles d'intégrité
- Publier = transaction atomique : valider révision -> incrémenter version -> snapshot -> sessions -> mise à jour active publication ; envoi mail déclenché **après commit** (outbox/job).
- `session_results` unique par `(publication_session_id, athlete_id)` pour un résultat courant, avec events pour modifications ; éviter doubles soumissions.
- `pdf_exports` références à `publication_id` immuable ; le PDF ne lit jamais le brouillon au hasard.
- Suppressions douces pour profils et templates ; exports et publications protégés par politiques de conservation.
- Migrations idempotentes/versionnées, indices par `(organization_id, athlete_id)`, `(organization_id, created_at)` etc. ; `CHECK` pour statut, `rpe BETWEEN 1 AND 10`.

## 7. Critères de recette DB/API
- [DB-01] Tests intégration pour isolation entre deux organisations et entre deux sportifs.
- [DB-02] Un feedback ne peut référencer une séance d'une autre organisation ou d'un autre client.
- [DB-03] Une transaction publication partiellement défaillante ne laisse aucune version active incomplète.
- [DB-04] Un changement d'exercice modèle ne modifie aucun snapshot publié.
- [DB-05] Migration à blanc, seed démonstration anonymisé et restauration cohérente.

## 8. Extension commerciale future — P8 uniquement (V1.1)

L'isolation tenant et l'identité des organisations sont posées en P1 ; **aucune table billing n'est nécessaire au MVP Coach/PDF ou Sportif**. À l'arrivée de P8, spécifier puis migrer au minimum les concepts suivants sans stocker de données de carte :

| Concept futur | Portée / données minimales | Invariant |
|---|---|---|
| `billing_customers` | `organization_id`, fournisseur, identifiant client fournisseur | un propriétaire de facturation = une organisation |
| `subscription_plans` | identifiant interne, code, statut, caractéristiques de l'offre | catalogue maintenu côté serveur, pas par le navigateur |
| `subscriptions` | organisation, fournisseur, ID subscription, plan, statut, période courante, dates fin/annulation | état issu d'événements vérifiés + réconciliation fournisseur |
| `plan_entitlements` | limites par plan : sportifs actifs, sièges coach, usage PDF et fonctions | contrôles centralisés côté serveur, **jamais uniquement via l'UI** |
| `billing_webhook_events` | event ID fournisseur unique, type, date, statut de traitement, référence organisation | idempotence et trace sans données sensibles |

- Créer la souscription pour **l'organisation**, pas directement pour un sportif. Une organisation pourra avoir plusieurs coachs si la fonctionnalité « studio » est validée ultérieurement.
- Prévoir états de paiement (`trialing`, `active`, `past_due`, `canceled`, etc.) mais **ne pas figer les transitions** avant choix du fournisseur et validation commerciale. Source de vérité : événements vérifiés et API du prestataire ; ne pas accepter un statut `paid` envoyé par le frontend.
- Le webhook de paiement utilisera une Route Handler serveur vérifiant la **signature sur le corps brut**, stockant l'ID d'événement pour éviter les doublons et appliquant les transitions dans une transaction ; gérer désordre, répétition, retard et réconciliation.
- Checkout et portail de facturation hébergés par le fournisseur si possible ; n'enregistrer ni numéros de carte ni données bancaires. Traiter TVA, factures, rétractation éventuelle et exigences belges/UE lors de P8 avec validation juridique/comptable.
- Définir une politique proportionnée en cas d'impayé : aucune disparition de programmes publiés ni suppression automatique des données sportives ; lecture/export et durée de grâce à arbitrer en `OPEN-09`.
- Tests P8 : plan d'essai, passage au payant, changement d'offre, annulation, paiement échoué, webhook dupliqué/hors ordre, dépassement quotas et isolation stricte entre organisations.

**Important** : ce schéma est un contrat cible de P8, **non implémenté** et non exigé au lancement P0/P1.
