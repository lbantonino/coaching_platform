-- Étape 4a (D-35) : séance individuelle avec un NOUVEAU client, pas encore créé dans Coory (demande
-- d'Antonino du 23/10 : à une première rencontre, le coach fixe juste une date). Le sportif devient
-- facultatif pour une séance individuelle ; le coach peut noter le nom du client (prospect_name), puis
-- rattacher la séance à sa fiche une fois créée. Un sportif rattaché ne change plus (règle de D-27).

alter table public.coach_sessions drop constraint coach_sessions_check;

alter table public.coach_sessions
  add column prospect_name text check (prospect_name is null or char_length(btrim(prospect_name)) between 1 and 80);

comment on column public.coach_sessions.prospect_name is
  'Séance individuelle sans fiche sportif : nom du nouveau client (facultatif), effacé au rattachement.';

-- Collective : jamais de sportif unique ni de nouveau client. Individuelle : un sportif OU un nouveau
-- client (nommé ou non), pas les deux.
alter table public.coach_sessions
  add constraint coach_sessions_individual_person check (
    (kind = 'individual' or (athlete_id is null and prospect_name is null))
    and (athlete_id is null or prospect_name is null)
  );

-- Rattachement : une fois (de « aucun sportif » à un sportif), jamais un changement de sportif. Le
-- nom provisoire du client s'efface alors.
create function private.check_session_athlete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.athlete_id is not null and new.athlete_id is distinct from old.athlete_id then
    raise exception 'Le sportif d''une séance ne change pas' using errcode = '23514';
  end if;
  if old.athlete_id is null and new.athlete_id is not null then
    new.prospect_name := null;
  end if;
  return new;
end;
$$;

revoke all on function private.check_session_athlete() from public, anon;
grant execute on function private.check_session_athlete() to authenticated;

create trigger check_session_athlete before update on public.coach_sessions
  for each row execute function private.check_session_athlete();

grant update (athlete_id, prospect_name) on public.coach_sessions to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- revoke update (athlete_id, prospect_name) on public.coach_sessions from authenticated;
-- drop trigger if exists check_session_athlete on public.coach_sessions;
-- drop function if exists private.check_session_athlete();
-- alter table public.coach_sessions drop constraint coach_sessions_individual_person;
-- alter table public.coach_sessions drop column prospect_name;
-- (puis remettre check ((kind = 'individual') = (athlete_id is not null)) si aucune séance sans sportif)
