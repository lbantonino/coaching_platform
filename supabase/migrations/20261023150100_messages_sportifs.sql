-- Étape 4a (D-35) : messages entre un sportif et les coachs de son organisation, première tranche.
-- Sources : docs/13 §7 (MSG-05 : fil entre le sportif et son coach, texte, horodatage, statut lu, pas de
-- message de groupe), prompt Claude Design §7.2 (carte Messages du tableau de bord).
--
-- Un fil = un sportif (athlete_id) : pas de table de conversations tant qu'il n'y a ni groupe ni plusieurs
-- fils par sportif. `read_at` : quand le DESTINATAIRE a lu le message.
-- Cette tranche couvre le côté coach : lire les fils, marquer lus les messages reçus (à l'ouverture du
-- fil) et répondre. L'accès du sportif (son espace) viendra avec P7, avec ses propres règles et tests.
-- Aucun e-mail ni WhatsApp n'est envoyé : le message est seulement enregistré dans le fil.

create table public.athlete_messages (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  athlete_id       uuid not null,
  -- Qui écrit : un coach de l'organisation ou le sportif du fil.
  sender           text not null check (sender in ('coach', 'athlete')),
  body             text not null check (char_length(btrim(body)) between 1 and 2000),
  read_at          timestamptz,
  created_at       timestamptz not null default now(),
  -- Compte de l'auteur (null si ce compte a été supprimé depuis).
  created_by       uuid references auth.users (id) on delete set null,
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade
);

comment on table public.athlete_messages is
  'Messages du fil d''un sportif avec les coachs de son organisation. read_at = lu par le destinataire.';

create index athlete_messages_thread_idx on public.athlete_messages (organization_id, athlete_id, created_at);
create index athlete_messages_unread_idx on public.athlete_messages (organization_id, created_at)
  where read_at is null and sender = 'athlete';

-- ---------------------------------------------------------------------------
-- RLS : les coachs de l'organisation lisent les fils, marquent lus les messages REÇUS des sportifs (pas
-- les leurs) et écrivent en leur nom propre. Un message ne se modifie ni ne se supprime. Le sportif
-- n'a encore aucun accès.
-- ---------------------------------------------------------------------------
alter table public.athlete_messages enable row level security;

revoke all on public.athlete_messages from anon, authenticated;
grant select on public.athlete_messages to authenticated;
-- Ni read_at ni created_at à l'écriture : un message part non lu, à l'heure de la base.
grant insert (organization_id, athlete_id, sender, body, created_by) on public.athlete_messages to authenticated;
grant update (read_at) on public.athlete_messages to authenticated;

create policy "Membres : lecture des messages de leur organisation"
  on public.athlete_messages for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : réponse en leur nom dans les fils de leur organisation"
  on public.athlete_messages for insert to authenticated
  with check (
    (select private.is_org_member(organization_id))
    and sender = 'coach'
    and created_by = (select auth.uid())
  );

create policy "Membres : lu / non lu sur les messages reçus des sportifs"
  on public.athlete_messages for update to authenticated
  using ((select private.is_org_member(organization_id)) and sender = 'athlete')
  with check ((select private.is_org_member(organization_id)) and sender = 'athlete');

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.athlete_messages;
