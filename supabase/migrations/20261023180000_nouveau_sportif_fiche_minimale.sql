-- D-35 (suite, demande d'Antonino du 23/10) : « Nouveau sportif » dans la fenêtre « Nouvelle séance »
-- crée tout de suite une FICHE MINIMALE (le nom tapé), signalée « à compléter » dans Sportifs, et la
-- séance lui est rattachée. La séance individuelle sans sportif (prospect_name, migration
-- 20261023150400) n'a donc plus d'usage : retour à la règle de D-27, une séance individuelle a
-- toujours son sportif, qui ne change pas.
--
-- Données existantes : chaque séance individuelle encore sans sportif reçoit sa fiche minimale
-- (prénom = nom noté, ou « Nouveau sportif »), pour ne rien perdre.

do $$
declare
  s record;
  new_id uuid;
begin
  for s in
    select id, organization_id, prospect_name, created_by
    from public.coach_sessions
    where kind = 'individual' and athlete_id is null
  loop
    insert into public.athlete_profiles (organization_id, first_name, created_by)
    values (s.organization_id, left(coalesce(btrim(s.prospect_name), 'Nouveau sportif'), 80), s.created_by)
    returning id into new_id;
    update public.coach_sessions set athlete_id = new_id where id = s.id;
  end loop;
end;
$$;

drop trigger if exists check_session_athlete on public.coach_sessions;
drop function if exists private.check_session_athlete();
alter table public.coach_sessions drop constraint coach_sessions_individual_person;
alter table public.coach_sessions drop column prospect_name;
alter table public.coach_sessions
  add constraint coach_sessions_check check ((kind = 'individual') = (athlete_id is not null));

-- Le sportif d'une séance individuelle ne se modifie plus (on supprime et on recrée).
revoke update (athlete_id) on public.coach_sessions from authenticated;

-- Rollback (via une nouvelle migration si nécessaire) : reprendre 20261023150400.
