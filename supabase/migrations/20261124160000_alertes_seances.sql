-- Alertes des séances sur le téléphone (D-205, phase C, 24/11/2026 ; fiche validée par Antonino :
-- docs/superpowers/specs/2026-11-24-nouvelle-seance-apple-recurrence-alertes-design.md).
--   1. coach_sessions.alerts : une ou deux alertes, comme Apple, en minutes AVANT le début. Séance à
--      l'heure : 0, 5, 10, 15, 30, 60, 120, 1440, 2880. Jour entier (début rangé à 00:00) : le jour même
--      09:00 (-540), la veille 09:00 (900), 2 jours avant 09:00 (2340), 1 semaine avant 09:00 (9540).
--   2. push_subscriptions : les appareils abonnés (Web Push) de chaque utilisateur, à lui seul.
--   3. session_alerts_sent : chaque alerte envoyée (séance, date, délai), jamais deux fois ; serveur seul.
--   4. Tâche planifiée : pg_cron appelle chaque minute la route /api/alertes de Coory (pg_net), avec
--      l'adresse et le secret rangés dans le Vault (alertes_url, alertes_secret) ; sans eux, rien.
-- Retour arrière : cron.unschedule('coory-alertes'), supprimer la fonction, les deux tables, la
-- contrainte et la colonne.

-- --- 1. Les alertes d'une séance ---------------------------------------------------------------
alter table public.coach_sessions
  add column alerts smallint[] not null default '{}';

create or replace function private.alerts_are_valid(p_alerts smallint[], p_all_day boolean)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(cardinality(p_alerts), 0) <= 2
    and (select count(distinct a) = count(*) from unnest(p_alerts) as a)
    and p_alerts <@ (case
      when p_all_day then '{-540,900,2340,9540}'::smallint[]
      else '{0,5,10,15,30,60,120,1440,2880}'::smallint[]
    end)
$$;

alter table public.coach_sessions
  add constraint coach_sessions_alerts_valid check (private.alerts_are_valid(alerts, all_day));

grant update (alerts) on public.coach_sessions to authenticated;
revoke all on function private.alerts_are_valid(smallint[], boolean) from public, anon;
grant execute on function private.alerts_are_valid(smallint[], boolean) to authenticated;

-- --- 2. Les appareils abonnés ------------------------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Adresse du service push du navigateur (https ; http seulement sur la machine, pour les tests).
  endpoint text not null
    check (length(endpoint) <= 2048
      and (endpoint ~ '^https://' or endpoint ~ '^http://(localhost|127\.0\.0\.1)(:[0-9]+)?/')),
  p256dh text not null check (length(p256dh) between 20 and 200),
  auth text not null check (length(auth) between 8 and 100),
  user_agent text check (length(user_agent) <= 300),
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_select_own on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy push_subscriptions_insert_own on public.push_subscriptions
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, delete on public.push_subscriptions to authenticated;

-- --- 3. Les alertes envoyées -------------------------------------------------------------------
create table public.session_alerts_sent (
  session_id uuid not null references public.coach_sessions (id) on delete cascade,
  occurrence_date date not null,
  offset_minutes smallint not null,
  sent_at timestamptz not null default now(),
  primary key (session_id, occurrence_date, offset_minutes)
);

alter table public.session_alerts_sent enable row level security;
revoke all on public.session_alerts_sent from anon, authenticated;

-- --- 4. La tâche planifiée ---------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function private.call_session_alerts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'alertes_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'alertes_secret';
  if v_url is null or v_secret is null then
    return;
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_secret,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
end;
$$;

revoke all on function private.call_session_alerts() from public, anon, authenticated;

select cron.schedule('coory-alertes', '* * * * *', 'select private.call_session_alerts()');
