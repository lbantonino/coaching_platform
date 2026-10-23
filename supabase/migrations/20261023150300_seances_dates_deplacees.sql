-- Étape 4a (D-35) : déplacer une séance dans l'agenda (glisser-déposer, demande d'Antonino du 23/10).
-- Séance unique : on change simplement sa date et son heure. Séance hebdomadaire : le coach choisit
-- « seulement cette date » (une ligne ici, la date d'origine et sa nouvelle place) ou « toute la série »
-- (fonction move_session_series, qui décale la série ET ses dates déjà déplacées, en une transaction).
-- Plus tard, la même table pourra noter l'annulation d'une seule date.

create table public.coach_session_exceptions (
  session_id       uuid not null,
  organization_id  uuid not null,
  -- Date d'origine de l'occurrence déplacée (une date de la série).
  original_date    date not null,
  new_date         date not null check (new_date >= date '2000-01-01'),
  new_start_time   time not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  primary key (session_id, original_date),
  foreign key (session_id, organization_id)
    references public.coach_sessions (id, organization_id) on delete cascade
);

comment on table public.coach_session_exceptions is
  'Dates déplacées d''une séance hebdomadaire : l''occurrence du original_date a lieu le new_date à new_start_time.';

create trigger set_updated_at before update on public.coach_session_exceptions
  for each row execute function public.set_updated_at();

-- La date d'origine doit être une vraie date de la série : séance hebdomadaire, même jour de la
-- semaine, entre son début et sa fin éventuelle.
create function private.check_session_exception()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  s public.coach_sessions%rowtype;
begin
  select * into s from public.coach_sessions where id = new.session_id;
  if not found or not s.repeats_weekly
     or new.original_date < s.starts_on
     or (s.ends_on is not null and new.original_date > s.ends_on)
     or (new.original_date - s.starts_on) % 7 <> 0 then
    raise exception 'Date d''origine hors de la série' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function private.check_session_exception() from public, anon;
grant execute on function private.check_session_exception() to authenticated;

create trigger check_session_exception before insert or update on public.coach_session_exceptions
  for each row execute function private.check_session_exception();

-- ---------------------------------------------------------------------------
-- RLS : coachs de l'organisation uniquement, comme les séances.
-- ---------------------------------------------------------------------------
alter table public.coach_session_exceptions enable row level security;

revoke all on public.coach_session_exceptions from anon, authenticated;
grant select, insert, delete on public.coach_session_exceptions to authenticated;
grant update (original_date, new_date, new_start_time) on public.coach_session_exceptions to authenticated;

create policy "Membres : lecture des dates déplacées de leur organisation"
  on public.coach_session_exceptions for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : déplacement d'une date dans leur organisation"
  on public.coach_session_exceptions for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : mise à jour des dates déplacées de leur organisation"
  on public.coach_session_exceptions for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : retour d'une date à sa place dans leur organisation"
  on public.coach_session_exceptions for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- Toute la série : décaler son jour de -3 à +3 jours et changer son heure, avec ses dates déjà
-- déplacées (leur date d'origine suit la série). Exécutée avec les droits de l'appelant : la RLS
-- s'applique, une séance d'une autre organisation est « introuvable ».
-- ---------------------------------------------------------------------------
create function public.move_session_series(p_session_id uuid, p_shift_days integer, p_start_time time)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_shift_days is null or p_shift_days not between -3 and 3 then
    raise exception 'Décalage hors limites' using errcode = '22023';
  end if;
  update public.coach_sessions
    set starts_on = starts_on + p_shift_days,
        ends_on = ends_on + p_shift_days,
        start_time = p_start_time
    where id = p_session_id and repeats_weekly;
  if not found then
    raise exception 'Séance introuvable' using errcode = 'P0002';
  end if;
  -- Les dates d'origine sont espacées de 7 jours : un décalage de -3 à +3 n'en fait jamais coïncider deux.
  update public.coach_session_exceptions
    set original_date = original_date + p_shift_days
    where session_id = p_session_id;
end;
$$;

revoke all on function public.move_session_series(uuid, integer, time) from public, anon;
grant execute on function public.move_session_series(uuid, integer, time) to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop function if exists public.move_session_series(uuid, integer, time);
-- drop table if exists public.coach_session_exceptions;
-- drop function if exists private.check_session_exception();
