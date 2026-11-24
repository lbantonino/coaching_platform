-- Récurrence des séances encadrées comme le Calendrier d'Apple (D-203, demande d'Antonino du
-- 24/11/2026) : chaque jour, chaque semaine, toutes les 2 semaines, chaque mois, chaque année, ou
-- personnalisé. Jusqu'ici, une séance se répétait seulement « chaque semaine, le jour du début »
-- (repeats_weekly).
--
-- - coach_sessions.recurrence (jsonb) : la règle ({freq, interval, weekdays | monthDays | setPos +
--   setWeekday | months}), vérifiée par private.recurrence_is_valid ;
-- - repeats_weekly garde le sens de « se répète » (recurrence non nulle) : tout ce qui le lit (devises,
--   dépenses, Assistant IA) reste juste ; un déclencheur remplit la règle « chaque semaine, le jour du
--   début » quand une ancienne écriture ne donne que repeats_weekly (graine, scripts, anciens tests) ;
-- - private.session_occurs_on : le calcul d'une date de la série, jumeau de
--   src/domain/sessions/recurrence.ts (mêmes cas de test) ; les dates déplacées s'y vérifient ;
-- - move_session_series (« toute la série ») : séries quotidiennes et hebdomadaires seulement ; les
--   jours de la semaine se décalent avec la série.
--
-- Rollback (nouvelle migration) : recréer private.check_session_exception et
-- public.move_session_series de 20261023150300_seances_dates_deplacees.sql ; drop trigger
-- sync_session_recurrence ; drop function private.sync_session_recurrence, private.session_occurs_on,
-- private.recurrence_matches_set_pos, private.recurrence_is_valid ; alter table public.coach_sessions
-- drop constraint coach_sessions_recurrence_valid, drop constraint coach_sessions_repeats_recurrence,
-- drop column recurrence.

alter table public.coach_sessions add column recurrence jsonb;

-- Le jour de la semaine d'une date, comme le calcul TypeScript (« mon » … « sun »).
create function private.weekday_key(p_date date)
returns text
language sql
immutable
set search_path = ''
as $$
  select (array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])[extract(isodow from p_date)::int]
$$;

-- Une règle bien formée (mêmes refus que recurrenceRuleSchema). null = pas de récurrence.
create function private.recurrence_is_valid(p_rule jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_freq text;
  v_key text;
  v_item jsonb;
begin
  if p_rule is null then
    return true;
  end if;
  if jsonb_typeof(p_rule) <> 'object' then
    return false;
  end if;
  for v_key in select jsonb_object_keys(p_rule) loop
    if v_key not in ('freq', 'interval', 'weekdays', 'monthDays', 'setPos', 'setWeekday', 'months') then
      return false;
    end if;
  end loop;
  v_freq := p_rule->>'freq';
  if v_freq is null or v_freq not in ('daily', 'weekly', 'monthly', 'yearly') then
    return false;
  end if;
  if jsonb_typeof(p_rule->'interval') <> 'number'
     or (p_rule->>'interval') !~ '^[0-9]{1,2}$'
     or (p_rule->>'interval')::int not between 1 and 99 then
    return false;
  end if;
  -- Semaine : au moins un jour, des jours connus ; seulement pour « weekly ».
  if (v_freq = 'weekly') <> (p_rule ? 'weekdays') then
    return false;
  end if;
  if p_rule ? 'weekdays' then
    if jsonb_typeof(p_rule->'weekdays') <> 'array' or jsonb_array_length(p_rule->'weekdays') not between 1 and 7 then
      return false;
    end if;
    for v_item in select jsonb_array_elements(p_rule->'weekdays') loop
      if jsonb_typeof(v_item) <> 'string'
         or (v_item #>> '{}') not in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun') then
        return false;
      end if;
    end loop;
  end if;
  -- Jours du mois (1 à 31) : seulement pour « monthly ».
  if p_rule ? 'monthDays' then
    if v_freq <> 'monthly' or jsonb_typeof(p_rule->'monthDays') <> 'array'
       or jsonb_array_length(p_rule->'monthDays') not between 1 and 31 then
      return false;
    end if;
    for v_item in select jsonb_array_elements(p_rule->'monthDays') loop
      if jsonb_typeof(v_item) <> 'number' or (v_item #>> '{}') !~ '^[0-9]{1,2}$'
         or (v_item #>> '{}')::int not between 1 and 31 then
        return false;
      end if;
    end loop;
  end if;
  -- Mois de l'année (1 à 12) : seulement pour « yearly ».
  if p_rule ? 'months' then
    if v_freq <> 'yearly' or jsonb_typeof(p_rule->'months') <> 'array'
       or jsonb_array_length(p_rule->'months') not between 1 and 12 then
      return false;
    end if;
    for v_item in select jsonb_array_elements(p_rule->'months') loop
      if jsonb_typeof(v_item) <> 'number' or (v_item #>> '{}') !~ '^[0-9]{1,2}$'
         or (v_item #>> '{}')::int not between 1 and 12 then
        return false;
      end if;
    end loop;
  end if;
  -- « Le 1er / 2e / 3e / 4e / dernier lundi » : les deux ensemble, mois ou année, jamais avec monthDays.
  if (p_rule ? 'setPos') <> (p_rule ? 'setWeekday') then
    return false;
  end if;
  if p_rule ? 'setPos' then
    if v_freq not in ('monthly', 'yearly') or p_rule ? 'monthDays'
       or (p_rule->>'setPos') not in ('1', '2', '3', '4', '-1')
       or (p_rule->>'setWeekday') not in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun') then
      return false;
    end if;
  end if;
  return true;
end;
$$;

-- « Le 2e mardi » / « le dernier lundi » du mois de cette date ?
create function private.recurrence_matches_set_pos(p_date date, p_pos int, p_weekday text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select private.weekday_key(p_date) = p_weekday
    and case
      when p_pos = -1 then
        extract(day from p_date)::int + 7
          > extract(day from (date_trunc('month', p_date) + interval '1 month - 1 day'))::int
      else ceil(extract(day from p_date) / 7.0)::int = p_pos
    end
$$;

-- Une date de la série ? Jumeau de occursOnRule (src/domain/sessions/recurrence.ts) : le début est
-- toujours la première séance ; semaines du lundi au dimanche ; un jour absent du mois = pas de séance.
create function private.session_occurs_on(p_starts_on date, p_ends_on date, p_rule jsonb, p_date date)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_freq text := p_rule->>'freq';
  v_interval int := coalesce((p_rule->>'interval')::int, 1);
  v_months int;
  v_years int;
begin
  if p_date < p_starts_on or (p_ends_on is not null and p_date > p_ends_on) then
    return false;
  end if;
  if p_date = p_starts_on then
    return true;
  end if;
  if p_rule is null then
    return false;
  end if;
  if v_freq = 'daily' then
    return (p_date - p_starts_on) % v_interval = 0;
  elsif v_freq = 'weekly' then
    return ((date_trunc('week', p_date)::date - date_trunc('week', p_starts_on)::date) / 7) % v_interval = 0
      and (p_rule->'weekdays') ? private.weekday_key(p_date);
  elsif v_freq = 'monthly' then
    v_months := (extract(year from p_date)::int - extract(year from p_starts_on)::int) * 12
      + extract(month from p_date)::int - extract(month from p_starts_on)::int;
    if v_months % v_interval <> 0 then
      return false;
    end if;
    if p_rule ? 'setPos' then
      return private.recurrence_matches_set_pos(p_date, (p_rule->>'setPos')::int, p_rule->>'setWeekday');
    end if;
    if p_rule ? 'monthDays' then
      return (p_rule->'monthDays') @> to_jsonb(extract(day from p_date)::int);
    end if;
    return extract(day from p_date) = extract(day from p_starts_on);
  elsif v_freq = 'yearly' then
    v_years := extract(year from p_date)::int - extract(year from p_starts_on)::int;
    if v_years % v_interval <> 0 then
      return false;
    end if;
    if not (case
      when p_rule ? 'months' then (p_rule->'months') @> to_jsonb(extract(month from p_date)::int)
      else extract(month from p_date) = extract(month from p_starts_on)
    end) then
      return false;
    end if;
    if p_rule ? 'setPos' then
      return private.recurrence_matches_set_pos(p_date, (p_rule->>'setPos')::int, p_rule->>'setWeekday');
    end if;
    return extract(day from p_date) = extract(day from p_starts_on);
  end if;
  return false;
end;
$$;

-- Une ancienne écriture qui ne donne que repeats_weekly : la règle « chaque semaine, le jour du début ».
-- Une séance qui ne se répète plus perd sa règle.
create function private.sync_session_recurrence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not new.repeats_weekly then
    new.recurrence := null;
  elsif new.recurrence is null then
    new.recurrence := jsonb_build_object(
      'freq', 'weekly', 'interval', 1, 'weekdays', jsonb_build_array(private.weekday_key(new.starts_on))
    );
  end if;
  return new;
end;
$$;

-- Les séries existantes : chaque semaine, le jour de leur début.
update public.coach_sessions
  set recurrence = jsonb_build_object(
    'freq', 'weekly', 'interval', 1, 'weekdays', jsonb_build_array(private.weekday_key(starts_on))
  )
  where repeats_weekly and recurrence is null;

create trigger sync_session_recurrence before insert or update on public.coach_sessions
  for each row execute function private.sync_session_recurrence();

alter table public.coach_sessions
  add constraint coach_sessions_recurrence_valid check (private.recurrence_is_valid(recurrence)),
  add constraint coach_sessions_repeats_recurrence check (repeats_weekly = (recurrence is not null));

-- Une date déplacée doit être une vraie date de la série (quelle que soit sa règle).
create or replace function private.check_session_exception()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  s public.coach_sessions%rowtype;
begin
  select * into s from public.coach_sessions where id = new.session_id;
  if not found or s.recurrence is null
     or not private.session_occurs_on(s.starts_on, s.ends_on, s.recurrence, new.original_date) then
    raise exception 'Date d''origine hors de la série' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- Toute la série : décaler son jour de -3 à +3 jours et changer son heure, avec ses dates déjà
-- déplacées. Séries quotidiennes et hebdomadaires seulement (les jours de la semaine se décalent
-- aussi) ; une série mensuelle ou annuelle se déplace date par date.
create or replace function public.move_session_series(p_session_id uuid, p_shift_days integer, p_start_time time)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_rule jsonb;
begin
  if p_shift_days is null or p_shift_days not between -3 and 3 then
    raise exception 'Décalage hors limites' using errcode = '22023';
  end if;
  select recurrence into v_rule from public.coach_sessions where id = p_session_id;
  if not found or v_rule is null then
    raise exception 'Séance introuvable' using errcode = 'P0002';
  end if;
  if v_rule->>'freq' not in ('daily', 'weekly') then
    raise exception 'Seules les séries quotidiennes et hebdomadaires se décalent en entier'
      using errcode = '22023';
  end if;
  if v_rule->>'freq' = 'weekly' then
    v_rule := jsonb_set(v_rule, '{weekdays}', (
      select jsonb_agg(day order by idx)
      from (
        select distinct (array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])[idx + 1] as day, idx
        from (
          select (((array_position(array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'], value) - 1
                    + p_shift_days) % 7 + 7) % 7) as idx
          from jsonb_array_elements_text(v_rule->'weekdays') as value
        ) shifted
      ) days
    ));
  end if;
  update public.coach_sessions
    set starts_on = starts_on + p_shift_days,
        ends_on = ends_on + p_shift_days,
        start_time = p_start_time,
        recurrence = v_rule
    where id = p_session_id;
  if not found then
    raise exception 'Séance introuvable' using errcode = 'P0002';
  end if;
  -- Toutes les dates d'origine bougent du même nombre de jours : deux ne coïncident jamais.
  update public.coach_session_exceptions
    set original_date = original_date + p_shift_days
    where session_id = p_session_id;
end;
$$;

revoke all on function private.weekday_key(date) from public, anon;
revoke all on function private.recurrence_is_valid(jsonb) from public, anon;
revoke all on function private.recurrence_matches_set_pos(date, int, text) from public, anon;
revoke all on function private.session_occurs_on(date, date, jsonb, date) from public, anon;
revoke all on function private.sync_session_recurrence() from public, anon;
grant execute on function private.weekday_key(date) to authenticated;
grant execute on function private.recurrence_is_valid(jsonb) to authenticated;
grant execute on function private.recurrence_matches_set_pos(date, int, text) to authenticated;
grant execute on function private.session_occurs_on(date, date, jsonb, date) to authenticated;
grant execute on function private.sync_session_recurrence() to authenticated;

grant update (recurrence) on public.coach_sessions to authenticated;
