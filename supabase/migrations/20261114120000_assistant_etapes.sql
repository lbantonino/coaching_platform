-- Assistant IA qui agit (lot 1, 13/11/2026, docs/superpowers/specs/2026-11-13-assistant-actions-design.md
-- §5.1) : une demande du coach se fait en ÉTAPES, un appel au modèle chacune, pour que chaque appel au
-- serveur reste court. La demande est réservée une fois (reserve_assistant_use, abonnement et 100 par
-- mois) puis poursuivie : 6 étapes au plus, en moins de 5 minutes, par le coach qui l'a réservée.
-- Les jetons de chaque étape s'additionnent sur la même ligne.

alter table public.assistant_usage
  add column steps integer not null default 1 check (steps between 1 and 6);

comment on column public.assistant_usage.steps is
  'Nombre d''appels au modèle pour cette demande (6 au plus).';

-- Poursuit une demande en cours : renvoie le nouveau nombre d'étapes. L'organisation de l'appel doit
-- être celle de la réservation : une demande réservée dans une organisation abonnée ne sert pas à une
-- autre (relecture du lot 1, n°5).
create function public.continue_assistant_use(p_id uuid, p_organization_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_row record;
  v_steps integer;
begin
  if v_user is null then
    raise exception 'acces_refuse' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('assistant:' || v_user::text, 0));
  select user_id, organization_id, status, created_at, steps into v_row
  from public.assistant_usage
  where id = p_id
  for update;
  if not found
     or v_row.user_id <> v_user
     or v_row.organization_id <> p_organization_id
     or not private.is_org_member(v_row.organization_id) then
    raise exception 'acces_refuse' using errcode = '42501';
  end if;
  if v_row.status <> 'pending' or v_row.created_at < now() - interval '5 minutes' then
    raise exception 'demande_expiree' using errcode = 'P0001';
  end if;
  if v_row.steps >= 6 then
    raise exception 'etapes_epuisees' using errcode = 'P0001';
  end if;
  update public.assistant_usage set steps = steps + 1 where id = p_id returning steps into v_steps;
  return v_steps;
end;
$$;

-- Note le résultat d'une étape : « step » additionne les jetons sans clore la demande ; « done » ou
-- « failed » additionne et clôt. Une demande close ne change plus.
create or replace function public.finish_assistant_use(
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
  if p_status not in ('step', 'done', 'failed') then
    raise exception 'statut_invalide' using errcode = '22023';
  end if;
  update public.assistant_usage
  set status = case when p_status = 'step' then status else p_status end,
      model = left(p_model, 80),
      input_tokens = coalesce(input_tokens, 0) + greatest(coalesce(p_input_tokens, 0), 0),
      output_tokens = coalesce(output_tokens, 0) + greatest(coalesce(p_output_tokens, 0), 0)
  where id = p_id and user_id = (select auth.uid()) and status = 'pending';
end;
$$;

revoke all on function public.continue_assistant_use(uuid, uuid) from public, anon;
grant execute on function public.continue_assistant_use(uuid, uuid) to authenticated;

-- Retour arrière (via une nouvelle migration si nécessaire) :
-- recréer finish_assistant_use de 20261113150000_assistant_abonnement (sans « step », jetons remplacés) ;
-- drop function public.continue_assistant_use(uuid, uuid) ;
-- alter table public.assistant_usage drop column steps.
