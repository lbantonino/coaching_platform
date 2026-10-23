-- Inscription libre (D-30) : un coach ou un sportif crée lui-même son compte (e-mail + mot de passe,
-- ou plus tard Google / Facebook / Apple). Après confirmation de l'adresse e-mail, la fonction
-- complete_signup finalise le compte :
--   - coach   : crée SON organisation et l'en déclare propriétaire (avant : comptes créés à la main) ;
--   - sportif : compte sans coach ; un coach le rattache ensuite par l'invitation existante.
-- L'acceptation des conditions et de la politique de confidentialité est enregistrée (date, version).

create table public.account_signups (
  user_id           uuid primary key references auth.users (id) on delete cascade,
  kind              text not null check (kind in ('coach', 'athlete')),
  first_name        text not null check (char_length(btrim(first_name)) between 1 and 80),
  last_name         text not null check (char_length(btrim(last_name)) between 1 and 80),
  phone             text check (phone is null or phone ~ '^\+?[0-9 ]{6,20}$'),
  terms_version     text not null check (char_length(terms_version) between 1 and 40),
  terms_accepted_at timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

comment on table public.account_signups is
  'Comptes créés par inscription libre : type (coach ou sportif), identité, acceptation datée des conditions.';

alter table public.account_signups enable row level security;
revoke all on public.account_signups from anon, authenticated;
grant select on public.account_signups to authenticated;

-- Chacun lit sa propre inscription ; aucune écriture directe (seulement par complete_signup).
create policy "Compte : lecture de sa propre inscription"
  on public.account_signups for select to authenticated
  using (user_id = (select auth.uid()));

-- Téléphone du coach (facultatif), saisi à l'inscription ou dans Paramètres.
alter table public.coach_profiles
  add column phone text check (phone is null or phone ~ '^\+?[0-9 ]{6,20}$');
grant update (phone) on public.coach_profiles to authenticated;

-- Finalisation d'un compte, appelée par l'utilisateur connecté lui-même. SECURITY DEFINER : crée
-- l'organisation et le rôle de propriétaire, que le navigateur ne peut jamais écrire directement.
create or replace function public.complete_signup(
  p_kind text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_organization_name text,
  p_terms_version text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id   uuid := (select auth.uid());
  v_confirmed timestamptz;
  v_org_id    uuid;
  v_org_name  text;
  v_phone     text := nullif(btrim(coalesce(p_phone, '')), '');
begin
  if v_user_id is null then
    raise exception 'non_connecte';
  end if;

  select u.email_confirmed_at into v_confirmed from auth.users u where u.id = v_user_id;
  if v_confirmed is null then
    raise exception 'email_non_confirme';
  end if;

  -- Une seule finalisation, et jamais pour un compte qui a déjà un rôle.
  if exists (select 1 from public.account_signups s where s.user_id = v_user_id)
     or exists (select 1 from public.organization_members m where m.user_id = v_user_id)
     or exists (select 1 from public.athlete_profiles p where p.athlete_user_id = v_user_id) then
    raise exception 'deja_inscrit';
  end if;

  if p_kind not in ('coach', 'athlete') then
    raise exception 'type_invalide';
  end if;
  if coalesce(btrim(p_terms_version), '') = '' then
    raise exception 'conditions_non_acceptees';
  end if;

  -- Les contraintes CHECK de la table vérifient le prénom, le nom et le téléphone.
  insert into public.account_signups (user_id, kind, first_name, last_name, phone, terms_version)
  values (v_user_id, p_kind, btrim(p_first_name), btrim(p_last_name), v_phone, btrim(p_terms_version));

  if p_kind = 'coach' then
    v_org_name := coalesce(
      nullif(btrim(coalesce(p_organization_name, '')), ''),
      btrim(p_first_name) || ' ' || btrim(p_last_name)
    );
    -- Identifiant d'URL unique et neutre (le nom affiché reste libre).
    insert into public.organizations (name, slug, created_by)
    values (v_org_name, 'coach-' || substr(md5(v_user_id::text || clock_timestamp()::text), 1, 12), v_user_id)
    returning id into v_org_id;

    insert into public.organization_members (organization_id, user_id, role)
    values (v_org_id, v_user_id, 'owner');

    insert into public.coach_profiles (user_id, first_name, last_name, phone, company_name)
    values (
      v_user_id, btrim(p_first_name), btrim(p_last_name), v_phone,
      nullif(btrim(coalesce(p_organization_name, '')), '')
    )
    on conflict (user_id) do update
      set first_name = excluded.first_name,
          last_name = excluded.last_name,
          phone = excluded.phone,
          company_name = excluded.company_name;
  end if;

  return p_kind;
end;
$$;

revoke all on function public.complete_signup(text, text, text, text, text, text) from public, anon;
grant execute on function public.complete_signup(text, text, text, text, text, text) to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop function if exists public.complete_signup(text, text, text, text, text, text);
-- alter table public.coach_profiles drop column if exists phone;
-- drop table if exists public.account_signups;
