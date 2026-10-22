-- Sexe du sportif (demande d'Antonino, 22/10/2026, D-25). Finalité : les catégories de compétition Hyrox
-- (Women / Men / Mixed) et un repère visuel (♀ / ♂) dans la liste et la fiche. Donnée personnelle, mais pas
-- une donnée de santé (RGPD art. 9) ; facultative, avec « Non précisé » pour qui ne souhaite pas l'indiquer.
alter table public.athlete_profiles
  add column sex text check (sex in ('female', 'male', 'unspecified'));

comment on column public.athlete_profiles.sex is
  'Sexe déclaré : female, male ou unspecified (non précisé). Facultatif ; sert aux catégories Hyrox.';

grant update (sex) on public.athlete_profiles to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) : alter table public.athlete_profiles drop column sex;
