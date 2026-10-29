-- Classement des Documents, option D (D-67, choix d'Antonino du 29/10/2026) : des catégories que le
-- coach crée, renomme et supprime (au lieu de la liste fixe de D-60), plus le sportif comme second
-- filtre (déjà en base : athlete_id). Les 5 catégories d'avant deviennent celles de départ de
-- chaque organisation ; supprimer une catégorie laisse ses documents « sans catégorie ».

-- ---------------------------------------------------------------------------
-- 1. Les catégories d'une organisation
-- ---------------------------------------------------------------------------
create table public.document_categories (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null check (char_length(btrim(name)) between 1 and 60),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  unique (id, organization_id)
);

comment on table public.document_categories is
  'Catégories de documents propres à chaque organisation (créées, renommées, supprimées par le coach).';

-- Pas deux catégories du même nom dans une organisation (« Bilans » et « bilans » comptent pareil).
create unique index document_categories_name_key
  on public.document_categories (organization_id, lower(btrim(name)));

create trigger set_updated_at before update on public.document_categories
  for each row execute function public.set_updated_at();

alter table public.document_categories enable row level security;

revoke all on public.document_categories from anon, authenticated;
grant select, insert, delete on public.document_categories to authenticated;
grant update (name) on public.document_categories to authenticated;

create policy "Membres : lecture des catégories de leur organisation"
  on public.document_categories for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de catégories dans leur organisation"
  on public.document_categories for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : renommer les catégories de leur organisation"
  on public.document_categories for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : suppression des catégories de leur organisation"
  on public.document_categories for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- 2. Catégories de départ : pour chaque organisation existante, et à chaque nouvelle organisation.
-- ---------------------------------------------------------------------------
create function private.add_default_document_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.document_categories (organization_id, name)
  select new.id, start.label
  from unnest(array['Programme', 'Facture', 'Contrat', 'Bilan', 'Autre']) as start (label)
  on conflict do nothing;
  return new;
end;
$$;

create trigger add_default_document_categories after insert on public.organizations
  for each row execute function private.add_default_document_categories();

insert into public.document_categories (organization_id, name)
select organization.id, start.label
from public.organizations as organization,
  unnest(array['Programme', 'Facture', 'Contrat', 'Bilan', 'Autre']) as start (label);

-- ---------------------------------------------------------------------------
-- 3. Chaque document pointe vers une catégorie de SON organisation (ou aucune).
-- ---------------------------------------------------------------------------
alter table public.coach_documents
  add column category_id uuid,
  add constraint coach_documents_category_fkey foreign key (category_id, organization_id)
    references public.document_categories (id, organization_id) on delete set null (category_id);

update public.coach_documents as document
set category_id = category.id
from public.document_categories as category
where category.organization_id = document.organization_id
  and category.name = case document.category
    when 'programme' then 'Programme'
    when 'facture' then 'Facture'
    when 'contrat' then 'Contrat'
    when 'bilan' then 'Bilan'
    else 'Autre'
  end;

alter table public.coach_documents drop column category;
grant update (category_id) on public.coach_documents to authenticated;

create index coach_documents_category_idx on public.coach_documents (category_id)
  where category_id is not null;

comment on table public.coach_documents is
  'Documents du coach, rangés par catégorie (propre à l''organisation) et par sportif ; fichier privé.';

-- Rollback (via une nouvelle migration si nécessaire) :
-- alter table public.coach_documents add column category text not null default 'autre'
--   check (category in ('programme', 'facture', 'contrat', 'bilan', 'autre'));
-- update public.coach_documents d set category = lower(c.name) from public.document_categories c
--   where c.id = d.category_id and lower(c.name) in ('programme', 'facture', 'contrat', 'bilan');
-- grant update (category) on public.coach_documents to authenticated;
-- alter table public.coach_documents drop constraint coach_documents_category_fkey,
--   drop column category_id;
-- drop trigger if exists add_default_document_categories on public.organizations;
-- drop function if exists private.add_default_document_categories();
-- drop table if exists public.document_categories;
