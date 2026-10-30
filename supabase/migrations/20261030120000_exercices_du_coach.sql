-- « Créer un exercice » (D-76, demande d'Antonino du 30/10/2026) : un coach ajoute ses propres
-- exercices à la bibliothèque (mobilité, échauffements, variantes…), avec une photo et un lien vidéo
-- (YouTube, Instagram, TikTok). Ils appartiennent à SON organisation : invisibles pour les autres
-- coachs, modifiables et supprimables par ses membres. Le catalogue commun reste en lecture seule.
--
-- Les photos vont dans un espace de stockage PRIVÉ, rangé par organisation :
--   org/<organization_id>/<uuid>.<ext>
-- Aucune adresse publique : l'app les sert par sa route /exercices/images/<id>, avec la session.

-- ---------------------------------------------------------------------------
-- 1. Les exercices d'une organisation
-- ---------------------------------------------------------------------------
alter table public.exercises
  add column video_url text
    check (video_url is null or (video_url ~ '^https://[^[:space:]]+$' and char_length(video_url) <= 300));

alter table public.exercises drop constraint exercises_image_source_check;
alter table public.exercises add constraint exercises_image_source_check
  check (image_source in ('repdb', 'coory', 'coach'));

-- Un exercice d'organisation vient toujours d'un coach, sans clé du catalogue ni donnée RepDB, et sa
-- photo est rangée dans le dossier de SON organisation.
alter table public.exercises add constraint exercises_organization_row_check
  check (
    organization_id is null
    or (
      source = 'coach' and key is null and not attribution_required
      and (image_main is null or image_main like 'org/' || organization_id::text || '/%')
      and (image_source is null or image_source = 'coach')
    )
  );

comment on column public.exercises.video_url is
  'Lien vers une vidéo de démonstration (https), ouvert dans un nouvel onglet ; jamais intégré.';

-- Écriture : seulement ces colonnes, et seulement pour les lignes d'une organisation dont on est
-- membre (les lignes du catalogue commun ont organization_id null : aucune politique ne les couvre).
grant insert (
  id, organization_id, name_fr, category, equipment, primary_muscles, bodyweight, instructions_fr,
  image_main, image_source, video_url, variant_of, source, created_by
) on public.exercises to authenticated;
grant update (
  name_fr, category, equipment, primary_muscles, bodyweight, instructions_fr, image_main,
  image_source, video_url
) on public.exercises to authenticated;
grant delete on public.exercises to authenticated;

create policy "Membres : ajout d'un exercice de l'organisation"
  on public.exercises for insert to authenticated
  with check (
    organization_id is not null
    and (select private.is_org_member(organization_id))
    and source = 'coach'
    and created_by = (select auth.uid())
  );
create policy "Membres : modification d'un exercice de l'organisation"
  on public.exercises for update to authenticated
  using (organization_id is not null and (select private.is_org_member(organization_id)))
  with check (organization_id is not null and (select private.is_org_member(organization_id)));
create policy "Membres : suppression d'un exercice de l'organisation"
  on public.exercises for delete to authenticated
  using (organization_id is not null and (select private.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- 2. Les photos (stockage privé)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('exercise-images', 'exercise-images', false, 5242880, '{image/jpeg,image/png,image/webp}')
on conflict (id) do nothing;

create policy "Photos d'exercices : lecture (coachs de l'organisation)"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'exercise-images'
    and (storage.foldername(name))[1] = 'org'
    and private.is_org_member_text((storage.foldername(name))[2])
  );

create policy "Photos d'exercices : ajout (coachs de l'organisation)"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'exercise-images'
    and (storage.foldername(name))[1] = 'org'
    and private.is_org_member_text((storage.foldername(name))[2])
  );

create policy "Photos d'exercices : suppression (coachs de l'organisation)"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'exercise-images'
    and (storage.foldername(name))[1] = 'org'
    and private.is_org_member_text((storage.foldername(name))[2])
  );

-- Retour arrière : drop policy ... (les six ci-dessus) ; delete from storage.buckets where id =
-- 'exercise-images' ; revoke insert, update, delete on public.exercises from authenticated ;
-- alter table public.exercises drop constraint exercises_organization_row_check, drop column video_url ;
-- remettre exercises_image_source_check à ('repdb', 'coory').
