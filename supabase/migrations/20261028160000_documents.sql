-- Étape 4e (D-60) : Documents du coach. Source : prompt Claude Design §7 `/coach/documents` (liste
-- Tous / Programme / Facture / Contrat / Bilan + recherche ; fichier, catégorie, associé à, modifié ;
-- clic = aperçu ; « + Importer un fichier » : nom, catégorie, sportif). Demande d'Antonino (28/10) :
-- les voir, les créer, les modifier et les supprimer.
--
-- Les fichiers vont dans un espace de stockage PRIVÉ, rangé par organisation :
--   org/<organization_id>/<uuid>.<ext>
-- Aucune adresse publique : l'app les sert par sa route /documents/<id>, avec la session de la
-- personne (RLS). Le sportif n'y a pas accès : le partage avec lui viendra avec les publications (P5).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coach-documents', 'coach-documents', false, 10485760,
  '{application/pdf,image/jpeg,image/png,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet}'
)
on conflict (id) do nothing;

create policy "Documents : lecture (coachs de l'organisation)"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = 'org'
    and private.is_org_member_text((storage.foldername(name))[2])
  );

create policy "Documents : ajout (coachs de l'organisation)"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = 'org'
    and private.is_org_member_text((storage.foldername(name))[2])
  );

create policy "Documents : suppression (coachs de l'organisation)"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'coach-documents'
    and (storage.foldername(name))[1] = 'org'
    and private.is_org_member_text((storage.foldername(name))[2])
  );

create table public.coach_documents (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  -- Sportif concerné, facultatif (même organisation).
  athlete_id       uuid,
  name             text not null check (char_length(btrim(name)) between 1 and 160),
  category         text not null default 'autre'
    check (category in ('programme', 'facture', 'contrat', 'bilan', 'autre')),
  -- Le fichier est toujours rangé dans le dossier de SA organisation.
  storage_path     text not null unique
    check (storage_path like 'org/' || organization_id::text || '/%'),
  mime_type        text not null check (mime_type in (
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )),
  size_bytes       integer not null check (size_bytes between 1 and 10485760),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete set null (athlete_id)
);

comment on table public.coach_documents is
  'Documents du coach (programme, facture, contrat, bilan, autre), fichier privé par organisation.';

create index coach_documents_org_idx on public.coach_documents (organization_id, updated_at desc);
create index coach_documents_athlete_idx on public.coach_documents (athlete_id) where athlete_id is not null;

create trigger set_updated_at before update on public.coach_documents
  for each row execute function public.set_updated_at();

alter table public.coach_documents enable row level security;

revoke all on public.coach_documents from anon, authenticated;
grant select, insert, delete on public.coach_documents to authenticated;
-- Modifier = renommer, changer la catégorie ou le sportif ; jamais le fichier ni l'organisation.
grant update (name, category, athlete_id) on public.coach_documents to authenticated;

create policy "Membres : lecture des documents de leur organisation"
  on public.coach_documents for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de documents dans leur organisation"
  on public.coach_documents for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : mise à jour des documents de leur organisation"
  on public.coach_documents for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : suppression des documents de leur organisation"
  on public.coach_documents for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.coach_documents;
-- drop policy ... on storage.objects (les trois ci-dessus) ; delete from storage.buckets where id = 'coach-documents';
