-- Type de programme du sportif (demande d'Antonino, 24/10/2026, D-40) : Running, Musculation, Hyrox ou
-- Hybride, choisi par le coach depuis la liste des sportifs. Indépendant des objectifs : un sportif qui a
-- fini son Hyrox repasse en Hybride sans qu'on touche à l'historique de ses objectifs.
-- Facultatif (null = pas encore choisi, ex. fiche créée d'un simple nom).
alter table public.athlete_profiles
  add column program_type text check (program_type in ('running', 'strength', 'hyrox', 'hybrid'));

comment on column public.athlete_profiles.program_type is
  'Type de programme suivi : running, strength, hyrox ou hybrid (null = non choisi). Indépendant des objectifs.';

grant update (program_type) on public.athlete_profiles to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) : alter table public.athlete_profiles drop column program_type;
