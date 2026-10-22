-- P2-02 (partie 1) : identité et contact de la fiche sportif. Source : OPEN-01 tranché le 20/10/2026 (D-14).
--
-- Prénom et nom séparés. Le nom complet (display_name) devient une colonne CALCULÉE par la base à partir
-- des deux : la liste, le tri, la recherche et la page d'invitation continuent de le lire sans changement,
-- et il ne peut jamais être en désaccord avec le prénom et le nom.
-- Nouveaux champs : canal de contact préféré, niveau, expérience, lieux d'entraînement, matériel.

-- 1. Prénom et nom, d'abord sans contrainte pour pouvoir reprendre les fiches existantes.
alter table public.athlete_profiles
  add column first_name text,
  add column last_name text;

-- 2. Reprise des noms existants, coupés au premier espace : « Camille Test » -> « Camille » + « Test ».
--    Un nom d'un seul mot devient un prénom sans nom de famille. Rien n'est perdu : le nom complet
--    recalculé est identique à l'ancien (aux espaces superflus près), et le coach corrige au besoin.
update public.athlete_profiles
set first_name = substring(btrim(display_name) from '^\S+'),
    last_name = nullif(btrim(regexp_replace(btrim(display_name), '^\S+', '')), '');

-- 3. Le nom complet devient calculé : on retire l'ancienne colonne (et son index), puis on la recrée.
drop index public.athlete_profiles_org_status_idx;
alter table public.athlete_profiles drop column display_name;
alter table public.athlete_profiles
  add column display_name text generated always as (btrim(first_name || coalesce(' ' || last_name, ''))) stored;
create index athlete_profiles_org_status_idx
  on public.athlete_profiles (organization_id, status, display_name);

-- 4. Contraintes du prénom et du nom, et nouveaux champs (alignés sur src/features/athletes/schemas.ts).
alter table public.athlete_profiles
  alter column first_name set not null,
  add constraint athlete_profiles_first_name_check
    check (char_length(btrim(first_name)) between 1 and 80),
  add constraint athlete_profiles_last_name_check
    check (last_name is null or char_length(btrim(last_name)) between 1 and 80),
  add column preferred_contact text
    check (preferred_contact in ('email', 'phone', 'sms', 'whatsapp')),
  add column level text
    check (level in ('beginner', 'intermediate', 'advanced', 'competitor')),
  add column experience text check (char_length(experience) <= 500),
  add column training_places text[] not null default '{}'
    check (training_places <@ array['gym', 'outdoor', 'track', 'home', 'box']::text[]),
  add column equipment text check (char_length(equipment) <= 500);

comment on column public.athlete_profiles.display_name is
  'Nom complet calculé (prénom + nom). Lecture seule : il se modifie via first_name et last_name.';
comment on column public.athlete_profiles.preferred_contact is
  'Canal par lequel le sportif préfère être contacté. Simple préférence : aucun envoi automatique (P7).';
comment on column public.athlete_profiles.level is
  'Niveau déclaratif : beginner, intermediate, advanced, competitor.';
comment on column public.athlete_profiles.training_places is
  'Lieux où le sportif peut s''entraîner : gym (salle), outdoor (extérieur), track (piste), home (domicile), box (Hyrox / CrossFit).';

-- 5. Droits : le coach modifie les nouveaux champs. display_name, calculé, ne s'écrit jamais
--    (son ancien droit de modification a disparu avec l'ancienne colonne).
grant update (first_name, last_name, preferred_contact, level, experience, training_places, equipment)
  on public.athlete_profiles to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) : recréer display_name en colonne simple remplie
-- depuis first_name / last_name, lui rendre son droit de modification, puis supprimer les nouvelles colonnes.
