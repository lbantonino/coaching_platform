-- Compte de démonstration partagé (OPEN-24, décisions d'Antonino du 14/11/2026, docs/DEMO_SYNODE.md).
-- Les visiteurs de Synode entrent dans Coory avec une adresse et un mot de passe publics, sans
-- s'inscrire. Trois garanties, toutes dans la base :
--   1. personne ne confisque le compte : mot de passe, e-mail et téléphone sont figés (l'API
--      d'authentification permet à un utilisateur connecté de les changer sans passer par l'app) ;
--      seul l'administrateur les change (private.set_demo_password) ;
--   2. aucun fichier n'est déposé depuis le compte de démo (le stockage ne se nettoie pas en SQL, et un
--      visiteur pourrait y mettre de vrais documents) ;
--   3. les données fictives sont remises à zéro chaque nuit (pg_cron), sans toucher au compteur de
--      l'Assistant IA (le plafond de 100 demandes par mois doit tenir) ni à une autre organisation.
-- L'utilisateur est créé par Antonino dans Supabase (adresse et mot de passe jamais dans Git), puis :
--   select private.setup_demo_account('demo@synode-agency.com');

create extension if not exists pg_cron with schema pg_catalog;

create table private.demo_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table private.demo_accounts is
  'Comptes de démonstration partagés (OPEN-24) : un coach et son organisation, remis à zéro chaque nuit.';
revoke all on table private.demo_accounts from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Personne ne confisque le compte de démo.
-- ---------------------------------------------------------------------------
create function private.protect_demo_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Changement voulu par l'administrateur (private.set_demo_password).
  if current_setting('coory.demo_admin', true) = 'on' then
    return new;
  end if;
  if exists (select 1 from private.demo_accounts d where d.user_id = old.id) then
    new.encrypted_password := old.encrypted_password;
    new.email := old.email;
    new.email_change := old.email_change;
    new.email_change_token_new := old.email_change_token_new;
    new.email_change_token_current := old.email_change_token_current;
    new.email_change_confirm_status := old.email_change_confirm_status;
    new.phone := old.phone;
    new.phone_change := old.phone_change;
    new.phone_change_token := old.phone_change_token;
    -- Relecture : des métadonnées gonflées (elles vont dans chaque jeton) bloqueraient les connexions.
    new.raw_user_meta_data := old.raw_user_meta_data;
  end if;
  return new;
end;
$$;

create trigger protect_demo_account
  before update on auth.users
  for each row execute function private.protect_demo_account();

-- Changer le mot de passe de la démo (administrateur seul, SQL Editor).
create function private.set_demo_password(p_email text, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  select d.user_id into v_user
  from private.demo_accounts d
  join auth.users u on u.id = d.user_id
  where lower(u.email) = lower(btrim(coalesce(p_email, '')));
  if v_user is null then
    raise exception 'compte_demo_introuvable';
  end if;
  if char_length(coalesce(p_password, '')) < 10 then
    raise exception 'mot_de_passe_trop_court';
  end if;
  perform set_config('coory.demo_admin', 'on', true);
  update auth.users
  set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf'))
  where id = v_user;
  perform set_config('coory.demo_admin', 'off', true);
end;
$$;
revoke all on function private.set_demo_password(text, text) from public, anon, authenticated;

-- L'app affiche le bandeau de la démo et refuse ce qui y est désactivé.
create function public.is_demo_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from private.demo_accounts d where d.user_id = (select auth.uid()));
$$;
revoke all on function public.is_demo_account() from public, anon;
grant execute on function public.is_demo_account() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Aucun fichier depuis le compte de démo (en plus des règles de chaque espace de stockage).
-- ---------------------------------------------------------------------------
create policy "Démo : aucun fichier déposé"
  on storage.objects
  as restrictive
  for insert
  to authenticated
  with check (not public.is_demo_account());

create policy "Démo : aucun fichier remplacé"
  on storage.objects
  as restrictive
  for update
  to authenticated
  using (not public.is_demo_account());

-- ---------------------------------------------------------------------------
-- 3. Données fictives et remise à zéro.
-- ---------------------------------------------------------------------------

-- Une facture émise ne se supprime jamais, SAUF pendant la remise à zéro d'une démo (un visiteur
-- pourrait en émettre une en appelant la base directement, ce qui bloquerait la remise à zéro).
create or replace function private.protect_issued_invoice()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('coory.demo_reset', true) = 'on' then
      if exists (select 1 from private.demo_accounts d where d.organization_id = old.organization_id) then
        return old;
      end if;
    end if;
    if old.number is not null then
      raise exception 'Une facture émise ne se supprime pas.' using errcode = 'P0001';
    end if;
    return old;
  end if;
  if old.number is not null
     and (to_jsonb(new) - 'payment_id' - 'paid_on' - 'updated_at')
       <> (to_jsonb(old) - 'payment_id' - 'paid_on' - 'updated_at') then
    raise exception 'Une facture émise ne se modifie pas.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Le programme de la démo : les 4 premières semaines du modèle « Premier 10 km » (structure validée par
-- l'éditeur ; un test de l'app relit ce JSON entre les marqueurs et le vérifie).
create function private.demo_program_plan()
returns jsonb
language sql
immutable
set search_path = ''
as $demo$
  select $plan${"schemaVersion":2,"title":"Objectif 10 km · 4 semaines","discipline":"running","aimDefaults":{"running":"hr","strength":"kg"},"sessionsPerWeek":4,"phases":[{"id":"p1","name":"Base","weekFrom":1,"weekTo":2},{"id":"p2","name":"Développement","weekFrom":3,"weekTo":4}],"weeks":[{"index":1,"light":false,"scheduling":"ordered","sessions":[{"title":"Endurance","sessionType":"Endurance","durationMinutes":30,"content":{"discipline":"running","items":[{"id":"s1","kind":"step","role":"run","measure":{"type":"time","seconds":1800},"target":{"kind":"hr","zone":2}}]},"key":"t2-s1-1","athleteCanMove":false},{"title":"Fractionné court","sessionType":"Fractionné","durationMinutes":50,"objective":"Développer la VMA","content":{"discipline":"running","items":[{"id":"e1","kind":"step","role":"warmup","measure":{"type":"time","seconds":1200},"target":{"kind":"hr","zone":2}},{"id":"r1","kind":"repeat","times":6,"steps":[{"id":"r1a","kind":"step","role":"run","measure":{"type":"distance","meters":400},"target":{"kind":"pace","fromSecPerKm":240,"toSecPerKm":240,"vmaPercent":{"from":95,"to":95}}},{"id":"r1b","kind":"step","role":"recovery","measure":{"type":"time","seconds":90}}]},{"id":"c1","kind":"step","role":"cooldown","measure":{"type":"time","seconds":600}}]},"key":"t2-s1-2","athleteCanMove":false},{"title":"Sortie longue","sessionType":"Sortie longue","durationMinutes":45,"objective":"Construire l'endurance de fond","coachTip":"Reste en aisance respiratoire du début à la fin.","content":{"discipline":"running","items":[{"id":"s1","kind":"step","role":"run","label":"Sortie longue","measure":{"type":"time","seconds":2700},"target":{"kind":"hr","zone":2}}]},"key":"t2-s1-3","athleteCanMove":false},{"title":"Renfo jambes et chevilles","sessionType":"Renforcement","durationMinutes":36,"objective":"Renforcer jambes, chevilles et gainage au poids du corps","coachTip":"Exercices sur une jambe ou d'un côté : répétitions par côté. Mouvements lents et propres, sans douleur.","content":{"discipline":"strength","warmup":"Mobilité des chevilles et des hanches, montées de genoux et talons-fesses, 10 min","items":[{"id":"ss1","kind":"superset","rounds":2,"restSec":60,"exercises":[{"id":"x1","kind":"exercise","exerciseId":"f04352aa-2058-573f-a105-76a1fbf32543","name":"Squat au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":12}],"cue":"Genoux dans l'axe des pieds, talons au sol."},{"id":"x2","kind":"exercise","exerciseId":"37ad2ff4-0e17-55b9-8aa0-dff64d0e3c57","name":"Pont fessier","loadMode":"kg","sets":[{"type":"normal","repsMin":12}],"cue":"Serre les fessiers en haut, 1 s de pause."}]},{"id":"x3","kind":"exercise","exerciseId":"3d09239b-e152-5140-ba5b-d05e3f425207","name":"Fentes arrière au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":8},{"type":"normal","repsMin":8}],"restSec":60,"cue":"Par jambe. Genou avant au-dessus de la cheville."},{"id":"x4","kind":"exercise","exerciseId":"de573e76-334c-54e0-bf56-9f7a89579461","name":"Step-up avec équilibre","loadMode":"kg","sets":[{"type":"normal","repsMin":8},{"type":"normal","repsMin":8}],"restSec":60,"cue":"Par jambe. Marche ou banc bas et stable, tiens l'équilibre 2 s en haut."},{"id":"ss2","kind":"superset","rounds":2,"restSec":60,"exercises":[{"id":"x5","kind":"exercise","exerciseId":"f4a5891b-91c1-5d86-8c32-c6d33c28c7fd","name":"Extension des mollets au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":15}],"cue":"Monte haut, redescends en 2 s."},{"id":"x6","kind":"exercise","exerciseId":"e0ad5297-4e95-572d-a8a5-71430a60d5bc","name":"Relevé de pointes de pied kettlebell","loadMode":"kg","sets":[{"type":"normal","repsMin":12,"kg":4}],"cue":"Par jambe. Talon au sol, descente lente."}]},{"id":"ss3","kind":"superset","rounds":2,"restSec":60,"exercises":[{"id":"x7","kind":"exercise","exerciseId":"e49ec3d5-fc1f-58b9-9f8a-6d20f2081412","name":"Dead bug","loadMode":"kg","sets":[{"type":"normal","repsMin":8}],"cue":"Par côté. Bas du dos plaqué au sol."},{"id":"x8","kind":"exercise","exerciseId":"0f257af5-998c-521b-a276-ad0f190be378","name":"Bird dog","loadMode":"kg","sets":[{"type":"normal","repsMin":8}],"cue":"Par côté. Bassin immobile, 2 s de pause."}]}],"cooldown":"Étirements doux des mollets, des cuisses et des fessiers, 5 min"},"key":"t2-s1-4","athleteCanMove":false}]},{"index":2,"light":false,"scheduling":"ordered","sessions":[{"title":"Endurance","sessionType":"Endurance","durationMinutes":35,"content":{"discipline":"running","items":[{"id":"s1","kind":"step","role":"run","measure":{"type":"time","seconds":2100},"target":{"kind":"hr","zone":2}}]},"key":"t2-s2-1","athleteCanMove":false},{"title":"Fractionné court","sessionType":"Fractionné","durationMinutes":50,"objective":"Développer la VMA","content":{"discipline":"running","items":[{"id":"e1","kind":"step","role":"warmup","measure":{"type":"time","seconds":1200},"target":{"kind":"hr","zone":2}},{"id":"r1","kind":"repeat","times":7,"steps":[{"id":"r1a","kind":"step","role":"run","measure":{"type":"distance","meters":400},"target":{"kind":"pace","fromSecPerKm":240,"toSecPerKm":240,"vmaPercent":{"from":95,"to":95}}},{"id":"r1b","kind":"step","role":"recovery","measure":{"type":"time","seconds":90}}]},{"id":"c1","kind":"step","role":"cooldown","measure":{"type":"time","seconds":600}}]},"key":"t2-s2-2","athleteCanMove":false},{"title":"Sortie longue","sessionType":"Sortie longue","durationMinutes":50,"objective":"Construire l'endurance de fond","coachTip":"Reste en aisance respiratoire du début à la fin.","content":{"discipline":"running","items":[{"id":"s1","kind":"step","role":"run","label":"Sortie longue","measure":{"type":"time","seconds":3000},"target":{"kind":"hr","zone":2}}]},"key":"t2-s2-3","athleteCanMove":false},{"title":"Renfo jambes et chevilles","sessionType":"Renforcement","durationMinutes":43,"objective":"Renforcer jambes, chevilles et gainage au poids du corps","coachTip":"Exercices sur une jambe ou d'un côté : répétitions par côté. Mouvements lents et propres, sans douleur.","content":{"discipline":"strength","warmup":"Mobilité des chevilles et des hanches, montées de genoux et talons-fesses, 10 min","items":[{"id":"ss1","kind":"superset","rounds":3,"restSec":60,"exercises":[{"id":"x1","kind":"exercise","exerciseId":"f04352aa-2058-573f-a105-76a1fbf32543","name":"Squat au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":12}],"cue":"Genoux dans l'axe des pieds, talons au sol."},{"id":"x2","kind":"exercise","exerciseId":"37ad2ff4-0e17-55b9-8aa0-dff64d0e3c57","name":"Pont fessier","loadMode":"kg","sets":[{"type":"normal","repsMin":12}],"cue":"Serre les fessiers en haut, 1 s de pause."}]},{"id":"x3","kind":"exercise","exerciseId":"3d09239b-e152-5140-ba5b-d05e3f425207","name":"Fentes arrière au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":8},{"type":"normal","repsMin":8},{"type":"normal","repsMin":8}],"restSec":60,"cue":"Par jambe. Genou avant au-dessus de la cheville."},{"id":"x4","kind":"exercise","exerciseId":"de573e76-334c-54e0-bf56-9f7a89579461","name":"Step-up avec équilibre","loadMode":"kg","sets":[{"type":"normal","repsMin":8},{"type":"normal","repsMin":8}],"restSec":60,"cue":"Par jambe. Marche ou banc bas et stable, tiens l'équilibre 2 s en haut."},{"id":"ss2","kind":"superset","rounds":3,"restSec":60,"exercises":[{"id":"x5","kind":"exercise","exerciseId":"f4a5891b-91c1-5d86-8c32-c6d33c28c7fd","name":"Extension des mollets au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":15}],"cue":"Monte haut, redescends en 2 s."},{"id":"x6","kind":"exercise","exerciseId":"e0ad5297-4e95-572d-a8a5-71430a60d5bc","name":"Relevé de pointes de pied kettlebell","loadMode":"kg","sets":[{"type":"normal","repsMin":12,"kg":4}],"cue":"Par jambe. Talon au sol, descente lente."}]},{"id":"ss3","kind":"superset","rounds":2,"restSec":60,"exercises":[{"id":"x7","kind":"exercise","exerciseId":"e49ec3d5-fc1f-58b9-9f8a-6d20f2081412","name":"Dead bug","loadMode":"kg","sets":[{"type":"normal","repsMin":8}],"cue":"Par côté. Bas du dos plaqué au sol."},{"id":"x8","kind":"exercise","exerciseId":"0f257af5-998c-521b-a276-ad0f190be378","name":"Bird dog","loadMode":"kg","sets":[{"type":"normal","repsMin":8}],"cue":"Par côté. Bassin immobile, 2 s de pause."}]}],"cooldown":"Étirements doux des mollets, des cuisses et des fessiers, 5 min"},"key":"t2-s2-4","athleteCanMove":false}]},{"index":3,"light":false,"scheduling":"ordered","sessions":[{"title":"Endurance","sessionType":"Endurance","durationMinutes":40,"content":{"discipline":"running","items":[{"id":"s1","kind":"step","role":"run","measure":{"type":"time","seconds":2400},"target":{"kind":"hr","zone":2}}]},"key":"t2-s3-1","athleteCanMove":false},{"title":"Fractionné court","sessionType":"Fractionné","durationMinutes":50,"objective":"Développer la VMA","content":{"discipline":"running","items":[{"id":"e1","kind":"step","role":"warmup","measure":{"type":"time","seconds":1200},"target":{"kind":"hr","zone":2}},{"id":"r1","kind":"repeat","times":8,"steps":[{"id":"r1a","kind":"step","role":"run","measure":{"type":"distance","meters":400},"target":{"kind":"pace","fromSecPerKm":240,"toSecPerKm":240,"vmaPercent":{"from":95,"to":95}}},{"id":"r1b","kind":"step","role":"recovery","measure":{"type":"time","seconds":90}}]},{"id":"c1","kind":"step","role":"cooldown","measure":{"type":"time","seconds":600}}]},"key":"t2-s3-2","athleteCanMove":false},{"title":"Sortie longue","sessionType":"Sortie longue","durationMinutes":55,"objective":"Construire l'endurance de fond","coachTip":"Reste en aisance respiratoire du début à la fin.","content":{"discipline":"running","items":[{"id":"s1","kind":"step","role":"run","label":"Sortie longue","measure":{"type":"time","seconds":3300},"target":{"kind":"hr","zone":2}}]},"key":"t2-s3-3","athleteCanMove":false},{"title":"Renfo jambes et chevilles","sessionType":"Renforcement","durationMinutes":43,"objective":"Renforcer jambes, chevilles et gainage au poids du corps","coachTip":"Exercices sur une jambe ou d'un côté : répétitions par côté. Mouvements lents et propres, sans douleur.","content":{"discipline":"strength","warmup":"Mobilité des chevilles et des hanches, montées de genoux et talons-fesses, 10 min","items":[{"id":"ss1","kind":"superset","rounds":3,"restSec":60,"exercises":[{"id":"x1","kind":"exercise","exerciseId":"f04352aa-2058-573f-a105-76a1fbf32543","name":"Squat au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":12}],"cue":"Genoux dans l'axe des pieds, talons au sol."},{"id":"x2","kind":"exercise","exerciseId":"37ad2ff4-0e17-55b9-8aa0-dff64d0e3c57","name":"Pont fessier","loadMode":"kg","sets":[{"type":"normal","repsMin":12}],"cue":"Serre les fessiers en haut, 1 s de pause."}]},{"id":"x3","kind":"exercise","exerciseId":"3d09239b-e152-5140-ba5b-d05e3f425207","name":"Fentes arrière au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":8},{"type":"normal","repsMin":8},{"type":"normal","repsMin":8}],"restSec":60,"cue":"Par jambe. Genou avant au-dessus de la cheville."},{"id":"x4","kind":"exercise","exerciseId":"de573e76-334c-54e0-bf56-9f7a89579461","name":"Step-up avec équilibre","loadMode":"kg","sets":[{"type":"normal","repsMin":8},{"type":"normal","repsMin":8}],"restSec":60,"cue":"Par jambe. Marche ou banc bas et stable, tiens l'équilibre 2 s en haut."},{"id":"ss2","kind":"superset","rounds":3,"restSec":60,"exercises":[{"id":"x5","kind":"exercise","exerciseId":"f4a5891b-91c1-5d86-8c32-c6d33c28c7fd","name":"Extension des mollets au poids du corps","loadMode":"kg","sets":[{"type":"normal","repsMin":15}],"cue":"Monte haut, redescends en 2 s."},{"id":"x6","kind":"exercise","exerciseId":"e0ad5297-4e95-572d-a8a5-71430a60d5bc","name":"Relevé de pointes de pied kettlebell","loadMode":"kg","sets":[{"type":"normal","repsMin":12,"kg":4}],"cue":"Par jambe. Talon au sol, descente lente."}]},{"id":"ss3","kind":"superset","rounds":2,"restSec":60,"exercises":[{"id":"x7","kind":"exercise","exerciseId":"e49ec3d5-fc1f-58b9-9f8a-6d20f2081412","name":"Dead bug","loadMode":"kg","sets":[{"type":"normal","repsMin":8}],"cue":"Par côté. Bas du dos plaqué au sol."},{"id":"x8","kind":"exercise","exerciseId":"0f257af5-998c-521b-a276-ad0f190be378","name":"Bird dog","loadMode":"kg","sets":[{"type":"normal","repsMin":8}],"cue":"Par côté. Bassin immobile, 2 s de pause."}]}],"cooldown":"Étirements doux des mollets, des cuisses et des fessiers, 5 min"},"key":"t2-s3-4","athleteCanMove":false}]},{"index":4,"light":false,"scheduling":"ordered","sessions":[{"title":"Endurance","sessionType":"Endurance","durationMinutes":45,"content":{"discipline":"running","items":[{"id":"s1","kind":"step","role":"run","measure":{"type":"time","seconds":2700},"target":{"kind":"hr","zone":2}}]},"key":"t2-s4-1","athleteCanMove":false},{"title":"Fractionné court","sessionType":"Fractionné","durationMinutes":50,"objective":"Développer la VMA","content":{"discipline":"running","items":[{"id":"e1","kind":"step","role":"warmup","measure":{"type":"time","seconds":1200},"target":{"kind":"hr","zone":2}},{"id":"r1","kind":"repeat","times":9,"steps":[{"id":"r1a","kind":"step","role":"run","measure":{"type":"distance","meters":400},"target":{"kind":"pace","fromSecPerKm":240,"toSecPerKm":240,"vmaPercent":{"from":95,"to":95}}},{"id":"r1b","kind":"step","role":"recovery","measure":{"type":"time","seconds":90}}]},{"id":"c1","kind":"step","role":"cooldown","measure":{"type":"time","seconds":600}}]},"key":"t2-s4-2","athleteCanMove":false},{"title":"Sortie longue","sessionType":"Sortie longue","durationMinutes":60,"objective":"Construire l'endurance de fond","coachTip":"Reste en aisance respiratoire du début à la fin.","content":{"discipline":"running","items":[{"id":"s1","kind":"step","role":"run","label":"Sortie longue","measure":{"type":"time","seconds":3600},"target":{"kind":"hr","zone":2}}]},"key":"t2-s4-3","athleteCanMove":false},{"title":"Renfo jambes et chevilles","sessionType":"Renforcement","durationMinutes":39,"objective":"Charges légères et sauts pour des appuis plus toniques","coachTip":"Sauts légers, réception souple sur l'avant du pied. Exercices sur une jambe ou d'un côté : répétitions par côté.","content":{"discipline":"strength","warmup":"Mobilité des chevilles et des hanches, montées de genoux et talons-fesses, 10 min","items":[{"id":"ss1","kind":"superset","rounds":2,"restSec":90,"exercises":[{"id":"x1","kind":"exercise","exerciseId":"3833a411-996f-53cf-9b0d-415d46ae2907","name":"Squat sauté","loadMode":"kg","sets":[{"type":"normal","repsMin":6}],"cue":"Réception souple, genoux dans l'axe des pieds."},{"id":"x2","kind":"exercise","exerciseId":"abb294ee-8f9a-527f-b9a5-8a19aa82a9e0","name":"Corde à sauter","loadMode":"kg","sets":[{"type":"normal","repsMin":40}],"cue":"40 sauts légers sur l'avant des pieds."}]},{"id":"x3","kind":"exercise","exerciseId":"90d201e1-5bf0-5e09-a057-68df0fd1d970","name":"Goblet squat","loadMode":"kg","sets":[{"type":"normal","repsMin":10,"kg":8,"rir":3},{"type":"normal","repsMin":10,"kg":8,"rir":3}],"restSec":60,"cue":"Kettlebell contre la poitrine, buste droit."},{"id":"x4","kind":"exercise","exerciseId":"6402cbde-0b58-59e0-ab29-b50dff4e14ec","name":"Fentes goblet kettlebell","loadMode":"kg","sets":[{"type":"normal","repsMin":8,"kg":6,"rir":3},{"type":"normal","repsMin":8,"kg":6,"rir":3}],"restSec":60,"cue":"Par jambe. Genou avant au-dessus de la cheville."},{"id":"x5","kind":"exercise","exerciseId":"c20e9f9b-9b05-5311-b074-099a5bb1cf4d","name":"Pont fessier à une jambe","loadMode":"kg","sets":[{"type":"normal","repsMin":10},{"type":"normal","repsMin":10}],"restSec":60,"cue":"Par jambe. Bassin bien horizontal."},{"id":"ss2","kind":"superset","rounds":2,"restSec":60,"exercises":[{"id":"x6","kind":"exercise","exerciseId":"7ddeffc9-37aa-5f15-8aad-2a9156469488","name":"Extension des mollets à une jambe","loadMode":"kg","sets":[{"type":"normal","repsMin":12}],"cue":"Par jambe. Montée franche, descente en 2 s."},{"id":"x7","kind":"exercise","exerciseId":"e0ad5297-4e95-572d-a8a5-71430a60d5bc","name":"Relevé de pointes de pied kettlebell","loadMode":"kg","sets":[{"type":"normal","repsMin":12,"kg":4}],"cue":"Par jambe. Talon au sol, descente lente."}]},{"id":"x8","kind":"exercise","exerciseId":"e7b55dce-b63d-5695-8e25-1837bd033b5f","name":"Planche latérale avec levée de jambe","loadMode":"kg","sets":[{"type":"normal","repsMin":8},{"type":"normal","repsMin":8}],"restSec":60,"cue":"Par côté. Hanches hautes, bassin immobile."}],"cooldown":"Étirements doux des mollets, des cuisses et des fessiers, 5 min"},"key":"t2-s4-4","athleteCanMove":false}]}]}$plan$::jsonb;
$demo$;

-- Les données fictives, relatives au jour de la remise à zéro (heure de Bruxelles).
create function private.seed_demo_data(p_org uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'Europe/Brussels')::date;
  v_monday date := date_trunc('week', (now() at time zone 'Europe/Brussels'))::date;
  v_sarah uuid := gen_random_uuid();
  v_hugo uuid := gen_random_uuid();
  v_lucas uuid := gen_random_uuid();
  v_emma uuid := gen_random_uuid();
  v_yanis uuid := gen_random_uuid();
  v_manon uuid := gen_random_uuid();
  v_sarah_session uuid := gen_random_uuid();
  v_group uuid := gen_random_uuid();
  v_list uuid := gen_random_uuid();
  v_program uuid := gen_random_uuid();
begin
  -- Sportifs (personnes inventées).
  insert into public.athlete_profiles
    (id, organization_id, first_name, last_name, status, level, program_type, sex, created_by)
  values
    (v_sarah, p_org, 'Sarah', 'Vermeulen', 'active', 'intermediate', 'running', 'female', p_user),
    (v_hugo, p_org, 'Hugo', 'Lefèvre', 'active', 'advanced', 'hyrox', 'male', p_user),
    (v_lucas, p_org, 'Lucas', 'Janssens', 'active', 'intermediate', 'hybrid', 'male', p_user),
    (v_emma, p_org, 'Emma', 'Laurent', 'active', 'beginner', 'strength', 'female', p_user),
    (v_yanis, p_org, 'Yanis', 'Khelifi', 'active', 'competitor', 'strength', 'male', p_user),
    (v_manon, p_org, 'Manon', 'Dupont', 'paused', 'beginner', 'running', 'female', p_user);

  insert into public.athlete_goals
    (organization_id, athlete_id, goal_type, priority, status, target_date, competition_name,
     competition_location, hyrox_category, created_by)
  values
    (p_org, v_sarah, 'run_10k', 'main', 'active', v_monday + 41, '10 km de Bruxelles', 'Bruxelles', null, p_user),
    (p_org, v_hugo, 'hyrox', 'main', 'active', v_monday + 69, 'Hyrox Gand', 'Gand', 'pro', p_user),
    (p_org, v_lucas, 'run_half', 'main', 'active', v_monday + 83, 'Semi-marathon d''Anvers', 'Anvers', null, p_user),
    (p_org, v_emma, 'fitness', 'main', 'active', null, null, null, null, p_user);

  -- Agenda : des séances chaque semaine (les dates passées non payées vont dans « À encaisser »).
  insert into public.coach_sessions
    (id, organization_id, kind, title, discipline, location, athlete_id, starts_on, start_time,
     duration_minutes, repeats_weekly, price_cents, payment_method, created_by)
  values
    (v_sarah_session, p_org, 'individual', 'Coaching running', 'running', 'Parc du Cinquantenaire',
     v_sarah, v_monday - 13, '18:00', 60, true, 4500, 'transfer', p_user),
    (gen_random_uuid(), p_org, 'individual', 'Coaching Hyrox', 'hyrox', 'Box de Bruxelles',
     v_hugo, v_monday - 18, '07:00', 75, true, 5500, 'cash', p_user),
    (gen_random_uuid(), p_org, 'individual', 'Coaching hybride', 'hybrid', 'Bois de la Cambre',
     v_lucas, v_monday + 2, '12:15', 60, true, 5000, 'transfer', p_user),
    (gen_random_uuid(), p_org, 'individual', 'Renfo débutante', 'strength', 'Salle Coory',
     v_emma, v_monday - 7, '17:30', 45, true, 4000, 'cash', p_user),
    (gen_random_uuid(), p_org, 'individual', 'Coaching force', 'strength', 'Salle Coory',
     v_yanis, v_monday + 4, '08:15', 60, false, 5000, 'transfer', p_user),
    (v_group, p_org, 'group', 'Small group Hyrox', 'hyrox', 'Box de Bruxelles',
     null, v_monday - 9, '10:00', 90, true, 6000, 'cash', p_user);
  insert into public.coach_session_athletes (session_id, organization_id, athlete_id, created_by)
  values
    (v_group, p_org, v_hugo, p_user),
    (v_group, p_org, v_lucas, p_user),
    (v_group, p_org, v_yanis, p_user);

  -- Paiements et dépenses (sans TVA, comme la démo locale).
  insert into public.athlete_payments
    (organization_id, athlete_id, session_id, session_date, received_on, amount_cents, vat_rate,
     method, label, created_by)
  values
    (p_org, v_sarah, v_sarah_session, v_monday - 13, v_monday - 12, 4500, 0, 'transfer', null, p_user),
    (p_org, v_emma, null, null, v_today - 3, 35000, 0, 'bancontact', 'Carnet de 10 séances', p_user);
  insert into public.coach_expenses
    (organization_id, category_id, label, spent_on, amount_cents, vat_rate, repeats_monthly, created_by)
  select p_org, c.id, e.label, e.spent_on, e.amount_cents, 0, e.monthly, p_user
  from (values
      ('Matériel', 'Kettlebells 16 et 24 kg', v_today - 5, 8900, false),
      ('Loyer et salle', 'Location de la salle', date_trunc('month', v_today)::date, 35000, true)
    ) as e (category, label, spent_on, amount_cents, monthly)
  join public.expense_categories c on c.organization_id = p_org and c.name = e.category;

  -- Tâches.
  insert into public.coach_task_lists (id, organization_id, name, color, position, created_by)
  values (v_list, p_org, 'Administratif', 'amber', 0, p_user);
  insert into public.coach_tasks
    (organization_id, title, priority, due_on, athlete_id, list_id, done_at, done_by, created_by)
  values
    (p_org, 'Appeler Hugo pour son bilan Hyrox', 'high', v_today, v_hugo, null, null, null, p_user),
    (p_org, 'Préparer le programme de Lucas', 'normal', v_today + 2, v_lucas, null, null, null, p_user),
    (p_org, 'Envoyer le récapitulatif du mois à Emma', 'normal', v_today + 5, v_emma, v_list, null, null, p_user),
    (p_org, 'Commander des bandes élastiques', 'normal', null, null, v_list, now(), p_user, p_user);

  -- Un programme en brouillon pour Sarah, qui commence lundi prochain (à relire et publier).
  insert into public.programs
    (id, organization_id, athlete_id, title, goal, discipline, start_date, weeks_count, status, created_by)
  values
    (v_program, p_org, v_sarah, 'Objectif 10 km · 4 semaines', '10 km de Bruxelles', 'running',
     v_monday + 7, 4, 'draft', p_user);
  insert into public.program_drafts (program_id, organization_id, revision, draft_json, updated_by)
  values (
    v_program, p_org, 1,
    private.demo_program_plan() || jsonb_build_object('startDate', to_char(v_monday + 7, 'YYYY-MM-DD')),
    p_user
  );
end;
$$;

-- Remise à zéro de toutes les démos : ce que les visiteurs ont ajouté ou changé disparaît, les
-- données fictives reviennent. Jamais le compteur de l'Assistant IA, jamais une autre organisation.
create function private.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  perform set_config('coory.demo_reset', 'on', true);
  for r in select d.organization_id as org, d.user_id from private.demo_accounts d loop
    delete from public.athlete_invoices where organization_id = r.org;
    delete from public.athlete_payments where organization_id = r.org;
    delete from public.coach_tasks where organization_id = r.org;
    delete from public.coach_task_lists where organization_id = r.org;
    delete from public.coach_expenses where organization_id = r.org;
    delete from public.coach_documents where organization_id = r.org;
    delete from public.coach_notification_states where organization_id = r.org;
    delete from public.coach_sessions where organization_id = r.org;
    delete from public.programs where organization_id = r.org;
    delete from public.program_templates where organization_id = r.org;
    delete from public.session_templates where organization_id = r.org;
    delete from public.exercise_favorites where user_id = r.user_id;
    delete from public.exercises where organization_id = r.org;
    delete from public.athlete_profiles where organization_id = r.org;
    delete from public.organization_currency_changes where organization_id = r.org;
    delete from public.organization_legal_entities where organization_id = r.org;
    delete from public.document_categories where organization_id = r.org;
    delete from public.expense_categories where organization_id = r.org;

    -- Catégories par défaut, comme à la création d'une organisation.
    insert into public.document_categories (organization_id, name, color)
    select r.org, start.label, start.color
    from unnest(
      array['Programme', 'Facture', 'Contrat', 'Bilan', 'Autre'],
      array['green', 'gold', 'violet', 'blue', 'grey']
    ) as start (label, color);
    insert into public.expense_categories (organization_id, name, color)
    select r.org, start.label, start.color
    from unnest(
      array['Loyer et salle', 'Matériel', 'Assurance', 'Déplacements', 'Formation',
        'Logiciels et abonnements', 'Autre'],
      array['blue', 'orange', 'violet', 'teal', 'green', 'sky', 'grey']
    ) as start (label, color);

    update public.organizations
    set name = 'Démo Coory', country = 'BE', currency = 'EUR', vat_rate = 0
    where id = r.org;
    -- Tout le profil revient à ses réglages par défaut (lieu, prix, heures de l'agenda, alertes).
    update public.coach_profiles
    set first_name = 'Camille', last_name = 'Lambert', phone = null, company_name = 'Démo Coory',
        photo_path = null, default_session_minutes = default, default_location = default,
        default_price_cents = default, default_payment_method = default,
        agenda_first_hour = default, agenda_last_hour = default,
        notify_competitions = default, notify_messages = default, notify_tasks = default,
        notify_unpaid = default, notify_profiles = default, invoice_cash = default
    where user_id = r.user_id;

    perform private.seed_demo_data(r.org, r.user_id);
  end loop;
  perform set_config('coory.demo_reset', 'off', true);
end;
$$;
revoke all on function private.reset_demo_data() from public, anon, authenticated;
revoke all on function private.seed_demo_data(uuid, uuid) from public, anon, authenticated;

-- Mise en place par l'administrateur : l'utilisateur existe déjà (créé dans Supabase), il reçoit son
-- organisation, son profil de coach et les données fictives. Rejouable sans doublon.
create function private.setup_demo_account(p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_org uuid;
begin
  select u.id into v_user from auth.users u where lower(u.email) = lower(btrim(coalesce(p_email, '')));
  if v_user is null then
    raise exception 'utilisateur_introuvable';
  end if;

  select d.organization_id into v_org from private.demo_accounts d where d.user_id = v_user;
  if v_org is null then
    if exists (select 1 from public.organization_members m where m.user_id = v_user)
       or exists (select 1 from public.athlete_profiles p where p.athlete_user_id = v_user) then
      raise exception 'compte_deja_utilise';
    end if;
    insert into public.organizations (name, slug, country, currency, vat_rate, created_by)
    values ('Démo Coory', 'demo-' || substr(md5(v_user::text), 1, 12), 'BE', 'EUR', 0, v_user)
    returning id into v_org;
    insert into public.organization_members (organization_id, user_id, role)
    values (v_org, v_user, 'owner');
    insert into public.account_signups (user_id, kind, first_name, last_name, terms_version)
    values (v_user, 'coach', 'Camille', 'Lambert', 'demo')
    on conflict (user_id) do nothing;
    insert into public.coach_profiles (user_id, first_name, last_name, company_name)
    values (v_user, 'Camille', 'Lambert', 'Démo Coory')
    on conflict (user_id) do nothing;
    insert into private.demo_accounts (user_id, organization_id) values (v_user, v_org);
  end if;

  perform private.reset_demo_data();
  return v_org;
end;
$$;
revoke all on function private.setup_demo_account(text) from public, anon, authenticated;

-- Chaque nuit à 2 h UTC (3 h l'hiver, 4 h l'été à Bruxelles).
select cron.schedule('coory-demo-reset', '0 2 * * *', 'select private.reset_demo_data()');
