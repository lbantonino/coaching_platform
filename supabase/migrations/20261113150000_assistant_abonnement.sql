-- D-168 (13/11/2026, décision d'Antonino) : l'Assistant IA appelle Claude (Anthropic) et chaque
-- demande coûte. Il est réservé à l'abonnement mensuel Coory : sans abonnement, AUCUN appel, pour
-- personne (Gianluca compris). L'abonnement appartient à l'organisation ; seul l'administrateur de la
-- plateforme le change, directement en base (les coachs n'ont aucun droit de mise à jour sur cette
-- colonne, et il n'y a pas d'écran de facturation avant P8). Même abonné, un coach a au plus
-- 100 demandes par mois (heure de Bruxelles) : la facture Anthropic reste bornée.

alter table public.organizations
  add column coory_plan text not null default 'free' check (coory_plan in ('free', 'premium'));

comment on column public.organizations.coory_plan is
  'Abonnement Coory de l''organisation : free (sans Assistant IA) ou premium. Changé par l''administrateur seulement.';

-- Une ligne par demande à l'assistant (rien du contenu : ni la question ni la réponse).
create table public.assistant_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  model text check (char_length(model) <= 80),
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0)
);

comment on table public.assistant_usage is
  'Demandes à l''Assistant IA (D-168) : sert à la limite mensuelle et au suivi des coûts, sans aucun contenu.';

create index assistant_usage_user_month_idx on public.assistant_usage (user_id, created_at);

alter table public.assistant_usage enable row level security;
revoke all on public.assistant_usage from anon, authenticated;
grant select on public.assistant_usage to authenticated;

-- Lecture de SA consommation seulement ; écriture uniquement par les deux fonctions ci-dessous.
create policy "Coach : lire sa consommation de l'assistant"
  on public.assistant_usage for select to authenticated
  using (user_id = (select auth.uid()) and private.is_org_member(organization_id));

-- Début du mois en cours, heure de Bruxelles.
create function private.assistant_month_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'Europe/Brussels') at time zone 'Europe/Brussels';
$$;

-- Réserve une demande AVANT l'appel à Claude : membre actif, organisation abonnée, moins de 100
-- demandes ce mois-ci. Toute demande réservée compte, même si l'appel échoue ensuite (la limite ne
-- peut pas être contournée en marquant une demande « échouée »). Le verrou par coach empêche deux
-- onglets de dépasser la limite ensemble.
create function public.reserve_assistant_use(p_organization_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_plan text;
  v_used integer;
  v_id uuid;
begin
  if v_user is null or not private.is_org_member(p_organization_id) then
    raise exception 'acces_refuse' using errcode = '42501';
  end if;
  select coory_plan into v_plan from public.organizations where id = p_organization_id;
  if v_plan is distinct from 'premium' then
    raise exception 'abonnement_requis' using errcode = 'P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('assistant:' || v_user::text, 0));
  select count(*) into v_used
  from public.assistant_usage
  where user_id = v_user and created_at >= private.assistant_month_start();
  if v_used >= 100 then
    raise exception 'limite_mensuelle' using errcode = 'P0001';
  end if;
  insert into public.assistant_usage (organization_id, user_id)
  values (p_organization_id, v_user)
  returning id into v_id;
  return v_id;
end;
$$;

-- Note le résultat d'une demande réservée (une seule fois) : modèle et jetons, pour suivre les coûts.
create function public.finish_assistant_use(
  p_id uuid,
  p_status text,
  p_model text,
  p_input_tokens integer,
  p_output_tokens integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('done', 'failed') then
    raise exception 'statut_invalide' using errcode = '22023';
  end if;
  update public.assistant_usage
  set status = p_status,
      model = left(p_model, 80),
      input_tokens = greatest(coalesce(p_input_tokens, 0), 0),
      output_tokens = greatest(coalesce(p_output_tokens, 0), 0)
  where id = p_id and user_id = (select auth.uid()) and status = 'pending';
end;
$$;

revoke all on function private.assistant_month_start() from public, anon;
grant execute on function private.assistant_month_start() to authenticated;
revoke all on function public.reserve_assistant_use(uuid) from public, anon;
revoke all on function public.finish_assistant_use(uuid, text, text, integer, integer)
  from public, anon;
grant execute on function public.reserve_assistant_use(uuid) to authenticated;
grant execute on function public.finish_assistant_use(uuid, text, text, integer, integer)
  to authenticated;

-- Activer l'abonnement d'une organisation (administrateur, éditeur SQL de Supabase) :
--   update public.organizations set coory_plan = 'premium' where id = '<id de l''organisation>';

-- Retour arrière (via une nouvelle migration si nécessaire) :
-- drop function public.finish_assistant_use(uuid, text, text, integer, integer);
-- drop function public.reserve_assistant_use(uuid);
-- drop function private.assistant_month_start();
-- drop table public.assistant_usage;
-- alter table public.organizations drop column coory_plan.
