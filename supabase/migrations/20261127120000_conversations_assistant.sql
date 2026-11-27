-- Conversations de l'Assistant IA enregistrées (D-212, demande d'Antonino du 27/11/2026).
--
-- Avant : la conversation ne vivait que dans l'onglet du navigateur. Maintenant chaque conversation est
-- rangée dans le compte du coach, pour la retrouver sur tous ses appareils, la rouvrir, la continuer,
-- la télécharger ou la supprimer. Elle est effacée 12 mois après son dernier message (la cloche
-- prévient 30 jours avant, notification calculée par l'application).
--
--   1. Table : une ligne par conversation, ses messages en JSON tels que le coach les voit ; un numéro
--      de version pour qu'un onglet périmé (autre appareil) n'écrase jamais une version plus récente.
--   2. RLS : chaque coach ne voit et n'écrit QUE ses conversations, dans une organisation dont il est
--      membre ; rien pour le compte de démonstration (partagé et public).
--   3. save_assistant_conversation : création (version 0) ou mise à jour depuis la DERNIÈRE version ;
--      sinon null (le navigateur recharge). Le dernier message n'avance que si des messages s'ajoutent.
--   4. Effacement chaque nuit (pg_cron), le jour anniversaire des 12 mois (heure de Bruxelles).
--   5. Clé de notification « assistant:<id>:<date d'effacement> ».

-- ---------------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------------
create table public.assistant_conversations (
  -- Fourni par le navigateur (crypto.randomUUID) : deux enregistrements rapprochés de la même
  -- nouvelle conversation ne créent jamais deux lignes.
  id               uuid primary key,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Le début de la première question (pas de titre écrit par l'IA : il coûterait une demande).
  title            text not null check (char_length(title) between 1 and 120),
  messages         jsonb not null check (jsonb_typeof(messages) = 'array'),
  -- Messages visibles (sans les notes cachées « [Fait : …] ») : fait avancer last_message_at.
  message_count    integer not null default 0 check (message_count >= 0),
  version          integer not null default 1 check (version >= 1),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  -- Le serveur refuse au-delà de 2 Mo ; la base garde une marge (octets du JSON).
  check (octet_length(messages::text) <= 2500000)
);

comment on table public.assistant_conversations is
  'Conversations de l''Assistant IA (D-212) : gardées 12 mois après le dernier message.';

create index assistant_conversations_owner_idx
  on public.assistant_conversations (user_id, organization_id, last_message_at desc);
create index assistant_conversations_last_message_idx
  on public.assistant_conversations (last_message_at);

create trigger set_updated_at before update on public.assistant_conversations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Droits
-- ---------------------------------------------------------------------------
alter table public.assistant_conversations enable row level security;

revoke all on public.assistant_conversations from anon, authenticated;
grant select, insert, update, delete on public.assistant_conversations to authenticated;

create policy "Coach : ses conversations de l'assistant"
  on public.assistant_conversations for all to authenticated
  using (user_id = (select auth.uid()) and (select private.is_org_member(organization_id)))
  with check (
    user_id = (select auth.uid())
    and (select private.is_org_member(organization_id))
    and not (select public.is_demo_account())
  );

-- ---------------------------------------------------------------------------
-- 3. Enregistrer (avec la session du coach : la RLS s'applique)
-- ---------------------------------------------------------------------------
create function public.save_assistant_conversation(
  p_id uuid,
  p_organization_id uuid,
  p_version integer,
  p_title text,
  p_messages jsonb,
  p_message_count integer
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_version integer;
begin
  if (select public.is_demo_account()) then
    raise exception 'Désactivé sur le compte de démonstration.' using errcode = '42501';
  end if;
  -- Nouvelle conversation. Identifiant déjà pris (même invisible : celui d'un autre) : rien, null.
  if p_version = 0 then
    insert into public.assistant_conversations
      (id, organization_id, user_id, title, messages, message_count)
    values (p_id, p_organization_id, (select auth.uid()), p_title, p_messages, p_message_count)
    on conflict (id) do nothing
    returning version into v_version;
    return v_version;
  end if;
  -- Mise à jour seulement depuis la dernière version ; le titre ne change pas.
  update public.assistant_conversations c
     set messages = p_messages,
         message_count = p_message_count,
         last_message_at =
           case when p_message_count > c.message_count then now() else c.last_message_at end,
         version = c.version + 1
   where c.id = p_id
     and c.version = p_version
  returning c.version into v_version;
  return v_version;
end;
$$;

revoke all on function public.save_assistant_conversation(uuid, uuid, integer, text, jsonb, integer)
  from public, anon;
grant execute on function public.save_assistant_conversation(uuid, uuid, integer, text, jsonb, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Effacement le jour anniversaire des 12 mois (même calcul que domain/assistant/conversations.ts :
--    date de Bruxelles du dernier message + 12 mois ; un 29 février devient le 28).
-- ---------------------------------------------------------------------------
create function private.purge_assistant_conversations()
returns integer
language sql
security definer
set search_path = ''
as $$
  with gone as (
    delete from public.assistant_conversations
     where ((last_message_at at time zone 'Europe/Brussels')::date + interval '12 months')::date
           <= (now() at time zone 'Europe/Brussels')::date
    returning 1
  )
  select count(*)::integer from gone;
$$;

revoke all on function private.purge_assistant_conversations() from public, anon, authenticated;

-- Chaque nuit à 03:17 UTC (04:17 ou 05:17 à Bruxelles).
select cron.schedule(
  'coory-conversations', '17 3 * * *', 'select private.purge_assistant_conversations()'
);

-- ---------------------------------------------------------------------------
-- 5. Clé de notification « assistant » (conversation bientôt effacée)
-- ---------------------------------------------------------------------------
alter table public.coach_notification_states
  drop constraint coach_notification_states_key_check,
  add constraint coach_notification_states_key_check
    check (key ~ '^(competition|message|task|unpaid|profile|assistant):[0-9a-z:-]{1,120}$');

-- Rollback (via une nouvelle migration si nécessaire) :
-- select cron.unschedule('coory-conversations');
-- drop function private.purge_assistant_conversations();
-- drop function public.save_assistant_conversation(uuid, uuid, integer, text, jsonb, integer);
-- drop table public.assistant_conversations;
-- delete from public.coach_notification_states where key like 'assistant:%';
-- alter table public.coach_notification_states drop constraint coach_notification_states_key_check,
--   add constraint coach_notification_states_key_check
--     check (key ~ '^(competition|message|task|unpaid|profile):[0-9a-z:-]{1,120}$');
