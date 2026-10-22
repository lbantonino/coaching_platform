-- P2-03 (fin) / P2-04 étape 2 : notes du coach. Sources : docs/03 §2 (« notes visibles coach, séparées de
-- notes visibles sportif »), roadmap P2-03, maquette de fiche d'Antonino (D-21).
--
-- Deux notes au plus par sportif : une PRIVÉE (coachs de l'organisation) et une VISIBLE par le sportif.
-- Table à part, et non colonnes de athlete_profiles : le sportif peut lire sa propre fiche, il lirait donc
-- aussi une note privée qui y serait stockée. Ici, la RLS ne lui montre que la note qui lui est destinée.

create table public.athlete_notes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  athlete_id       uuid not null,
  visibility       text not null check (visibility in ('coach', 'athlete')),
  body             text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  updated_by       uuid references auth.users (id) on delete set null,
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  -- Une note de chaque sorte par sportif : on la met à jour, on n'en empile pas.
  unique (athlete_id, visibility)
);

comment on table public.athlete_notes is
  'Notes du coach : visibility = coach (privée, coachs de l''organisation) ou athlete (visible par le sportif).';

create trigger set_updated_at before update on public.athlete_notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS : les coachs de l'organisation gèrent les deux notes ; le sportif lit SEULEMENT la note qui lui est
-- destinée, sur SA fiche. Il ne peut rien écrire.
-- ---------------------------------------------------------------------------
alter table public.athlete_notes enable row level security;

revoke all on public.athlete_notes from anon, authenticated;
grant select, insert, delete on public.athlete_notes to authenticated;
grant update (body, updated_by) on public.athlete_notes to authenticated;

create policy "Membres : lecture des notes de leur organisation"
  on public.athlete_notes for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Sportif : lecture de la note qui lui est destinée"
  on public.athlete_notes for select to authenticated
  using (
    visibility = 'athlete'
    and exists (
      select 1 from public.athlete_profiles p
      where p.id = athlete_id and p.athlete_user_id = (select auth.uid())
    )
  );

create policy "Membres : écriture de notes dans leur organisation"
  on public.athlete_notes for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : mise à jour des notes de leur organisation"
  on public.athlete_notes for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)) and updated_by = (select auth.uid()));

create policy "Membres : suppression des notes de leur organisation"
  on public.athlete_notes for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.athlete_notes;
