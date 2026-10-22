-- P2-02 (partie 3) : disponibilités, contraintes d'organisation et contraintes physiques avec consentement.
-- Sources : OPEN-01 tranché (D-14), docs/03 §2 (ne pas construire de dossier médical), RGPD art. 9
-- (données de santé : consentement explicite). Décision d'Antonino du 22/10/2026 (D-20) : l'accord vient
-- du sportif lui-même, depuis son espace, OU il est noté par le coach (oral, écrit, formulaire signé).
-- Chaque accord et chaque retrait sont journalisés ; retirer l'accord efface ce qui avait été noté.

-- ---------------------------------------------------------------------------
-- 1. Disponibilités et contraintes sur la fiche
-- ---------------------------------------------------------------------------
alter table public.athlete_profiles
  add column sessions_per_week smallint check (sessions_per_week between 1 and 14),
  add column available_days text[] not null default '{}'
    check (available_days <@ array['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']::text[]),
  add column max_session_minutes smallint check (max_session_minutes between 10 and 300),
  add column schedule_constraints text check (char_length(schedule_constraints) <= 500),
  -- Données de santé : texte court, sans diagnostic, et SEULEMENT pendant qu'un accord est en cours.
  add column health_constraints text
    check (health_constraints is null or char_length(btrim(health_constraints)) between 1 and 300),
  add column health_consent_at timestamptz,
  add constraint athlete_profiles_health_requires_consent
    check (health_constraints is null or health_consent_at is not null);

comment on column public.athlete_profiles.available_days is
  'Jours où le sportif peut s''entraîner : mon, tue, wed, thu, fri, sat, sun.';
comment on column public.athlete_profiles.health_constraints is
  'Contraintes physiques utiles à l''entraînement (pas de diagnostic). Donnée de santé : jamais sans accord en cours.';
comment on column public.athlete_profiles.health_consent_at is
  'Date de l''accord en cours pour les contraintes physiques. Écrite UNIQUEMENT par grant_health_consent / withdraw_health_consent.';

-- Le coach modifie disponibilités et contraintes. health_consent_at n'est PAS dans la liste :
-- personne ne peut l'écrire directement, seulement via les deux fonctions ci-dessous (qui journalisent).
grant update (sessions_per_week, available_days, max_session_minutes, schedule_constraints, health_constraints)
  on public.athlete_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Journal des accords : on ajoute, on ne modifie ni ne supprime jamais une ligne
-- ---------------------------------------------------------------------------
create table public.athlete_consents (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  athlete_id       uuid not null,
  purpose          text not null default 'health_constraints' check (purpose in ('health_constraints')),
  action           text not null check (action in ('granted', 'withdrawn')),
  -- Qui a enregistré : le sportif lui-même (espace sportif) ou le coach.
  source           text not null check (source in ('athlete', 'coach')),
  -- Quand le coach note un accord, il précise comment il l'a obtenu.
  coach_proof      text check (coach_proof in ('oral', 'written', 'signed_form')),
  recorded_by      uuid references auth.users (id) on delete set null,
  recorded_at      timestamptz not null default now(),
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  check ((source = 'coach' and action = 'granted') = (coach_proof is not null))
);

comment on table public.athlete_consents is
  'Journal des accords et retraits (données de santé). Alimenté uniquement par grant_health_consent et withdraw_health_consent.';

create index athlete_consents_athlete_idx on public.athlete_consents (athlete_id, recorded_at desc);

alter table public.athlete_consents enable row level security;

revoke all on public.athlete_consents from anon, authenticated;
-- Lecture seulement : aucune écriture directe depuis le navigateur.
grant select on public.athlete_consents to authenticated;

create policy "Membres : lecture du journal des accords de leur organisation"
  on public.athlete_consents for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Sportif : lecture de ses propres accords"
  on public.athlete_consents for select to authenticated
  using (exists (
    select 1 from public.athlete_profiles p
    where p.id = athlete_id and p.athlete_user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- 3. Donner ou retirer l'accord : les SEULES portes d'entrée. Chaque fonction vérifie qui appelle :
--    le sportif lié à la fiche (depuis son espace) ou un coach membre de l'organisation.
--    Le journal et la fiche changent ensemble, dans la même transaction.
--    Erreurs (message = code lu par le serveur) : acces_refuse, preuve_invalide.
-- ---------------------------------------------------------------------------
create or replace function public.grant_health_consent(p_athlete_id uuid, p_coach_proof text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_profile public.athlete_profiles%rowtype;
  v_source  text;
  v_proof   text := p_coach_proof;
begin
  select * into v_profile from public.athlete_profiles where id = p_athlete_id for update;
  if v_user_id is null or not found then
    raise exception 'acces_refuse';
  end if;

  if v_profile.athlete_user_id = v_user_id and v_profile.status <> 'archived' then
    v_source := 'athlete';
    v_proof := null;
  elsif private.is_org_member(v_profile.organization_id) then
    v_source := 'coach';
    if v_proof is null or v_proof not in ('oral', 'written', 'signed_form') then
      raise exception 'preuve_invalide';
    end if;
  else
    raise exception 'acces_refuse';
  end if;

  -- Accord déjà en cours : rien à refaire (et rien à journaliser en double).
  if v_profile.health_consent_at is not null then
    return;
  end if;

  insert into public.athlete_consents (organization_id, athlete_id, action, source, coach_proof, recorded_by)
  values (v_profile.organization_id, v_profile.id, 'granted', v_source, v_proof, v_user_id);
  update public.athlete_profiles set health_consent_at = now() where id = v_profile.id;
end;
$$;

create or replace function public.withdraw_health_consent(p_athlete_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_profile public.athlete_profiles%rowtype;
  v_source  text;
begin
  select * into v_profile from public.athlete_profiles where id = p_athlete_id for update;
  if v_user_id is null or not found then
    raise exception 'acces_refuse';
  end if;

  if v_profile.athlete_user_id = v_user_id then
    v_source := 'athlete';
  elsif private.is_org_member(v_profile.organization_id) then
    v_source := 'coach';
  else
    raise exception 'acces_refuse';
  end if;

  if v_profile.health_consent_at is null then
    return;
  end if;

  insert into public.athlete_consents (organization_id, athlete_id, action, source, recorded_by)
  values (v_profile.organization_id, v_profile.id, 'withdrawn', v_source, v_user_id);
  -- Retrait = effacement de ce qui avait été noté (RGPD : pas de donnée de santé sans accord).
  update public.athlete_profiles
     set health_constraints = null, health_consent_at = null
   where id = v_profile.id;
end;
$$;

revoke all on function public.grant_health_consent(uuid, text) from public, anon;
revoke all on function public.withdraw_health_consent(uuid) from public, anon;
grant execute on function public.grant_health_consent(uuid, text) to authenticated;
grant execute on function public.withdraw_health_consent(uuid) to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop function public.withdraw_health_consent(uuid); drop function public.grant_health_consent(uuid, text);
-- drop table public.athlete_consents; puis supprimer les colonnes ajoutées à athlete_profiles.
