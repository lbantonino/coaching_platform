-- Bibliothèque d'exercices (P3-01, D-75, décisions d'Antonino du 30/10/2026). Un catalogue COMMUN, en
-- lecture seule pour tous les coachs : musculation et cardio repris de RepDB (texte traduit, images
-- RepDB, mention « Exercise data by RepDB » obligatoire), Hyrox illustré par Coory. La mobilité, la
-- course et les créations sans contenu sont gardées mais masquées (visibility = 'hidden'). Le
-- catalogue est construit hors de l'application (resources/exercise-library) puis chargé par la
-- migration suivante. La table accueillera plus tard les exercices propres à une organisation
-- (organization_id renseigné) : un coach ne modifiera jamais le catalogue commun, il en fera une copie.

-- ---------------------------------------------------------------------------
-- 1. Exercices
-- ---------------------------------------------------------------------------
create table public.exercises (
  -- Catalogue commun : identifiant calculé à partir de la clé (UUID v5), le même partout.
  id                    uuid primary key default gen_random_uuid(),
  -- null = catalogue commun ; sinon, exercice propre à cette organisation (à venir).
  organization_id       uuid references public.organizations (id) on delete cascade,
  -- Clé lisible et stable du catalogue commun (ex. sled-pull) : elle ne change jamais.
  key                   text check (key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_fr               text not null check (char_length(btrim(name_fr)) between 1 and 80),
  name_en               text check (name_en is null or char_length(btrim(name_en)) between 1 and 80),
  aliases_fr            text[] not null default '{}',
  aliases_en            text[] not null default '{}',
  category              text not null check (category in ('strength', 'cardio', 'hyrox', 'mobility')),
  visibility            text not null default 'active' check (visibility in ('active', 'hidden')),
  disciplines           text[] not null default '{}',
  hyrox_station         smallint check (hyrox_station between 1 and 8),
  family                text,
  variant_of            uuid references public.exercises (id) on delete set null,
  equipment             text[] not null default '{}',
  primary_muscles       text[] not null default '{}',
  secondary_muscles     text[] not null default '{}',
  difficulty            text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  -- Ce qui se règle dans une séance (répétitions, charge, distance…), en unités internes.
  metrics               text[] not null default '{}',
  unilateral            boolean not null default false,
  bodyweight            boolean not null default false,
  tags                  text[] not null default '{}',
  instructions_fr       text[] not null default '{}',
  -- Chemins des images servies par l'application (public/exercises/<clé>/<pose>.webp).
  image_main            text,
  image_start           text,
  image_end             text,
  image_source          text check (image_source in ('repdb', 'coory')),
  source                text not null check (source in ('repdb', 'coory', 'coach')),
  -- Identifiants d'origine (RepDB, kit Coory), pour la traçabilité.
  source_ids            text[] not null default '{}',
  attribution_required  boolean not null default false,
  exportable            boolean not null default true,
  review_status         text not null default 'pending' check (review_status in ('pending', 'validated')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  created_by            uuid references auth.users (id) on delete set null,
  archived_at           timestamptz,
  -- Le catalogue commun a toujours une clé et ne vient que de RepDB ou de Coory.
  check (organization_id is not null or (key is not null and source in ('repdb', 'coory'))),
  -- Une donnée RepDB n'est jamais exportable (licence : pas de republication).
  check (not attribution_required or not exportable)
);

comment on table public.exercises is
  'Exercices : catalogue commun en lecture seule (organization_id null) et, plus tard, exercices propres à une organisation.';

create unique index exercises_catalog_key on public.exercises (key) where organization_id is null;
create index exercises_organization_id on public.exercises (organization_id) where organization_id is not null;
create index exercises_variant_of on public.exercises (variant_of) where variant_of is not null;

create trigger set_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();

-- Lecture : le catalogue commun pour toute personne connectée, les exercices d'une organisation pour
-- ses membres. Aucune écriture par l'application pour l'instant : le catalogue ne change que par
-- migration. Les droits d'écriture des exercices d'organisation viendront avec « Créer un exercice ».
alter table public.exercises enable row level security;
revoke all on public.exercises from anon, authenticated;
grant select on public.exercises to authenticated;

create policy "Catalogue commun et exercices de son organisation : lecture"
  on public.exercises for select to authenticated
  using (organization_id is null or (select private.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- 2. Favoris (propres à chaque personne)
-- ---------------------------------------------------------------------------
create table public.exercise_favorites (
  user_id      uuid not null references auth.users (id) on delete cascade,
  exercise_id  uuid not null references public.exercises (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

comment on table public.exercise_favorites is 'Exercices mis en favori, par personne.';

create index exercise_favorites_exercise_id on public.exercise_favorites (exercise_id);

alter table public.exercise_favorites enable row level security;
revoke all on public.exercise_favorites from anon, authenticated;
grant select, insert, delete on public.exercise_favorites to authenticated;

create policy "Chacun : lecture de ses favoris"
  on public.exercise_favorites for select to authenticated
  using (user_id = (select auth.uid()));
-- Seulement pour soi, et seulement un exercice qu'on a le droit de voir (la sous-requête passe par
-- la RLS des exercices : pas d'exercice privé d'une autre organisation).
create policy "Chacun : ajout d'un favori"
  on public.exercise_favorites for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.exercises where exercises.id = exercise_id)
  );
create policy "Chacun : retrait d'un favori"
  on public.exercise_favorites for delete to authenticated
  using (user_id = (select auth.uid()));
