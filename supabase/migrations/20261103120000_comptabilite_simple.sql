-- Comptabilité simple (D-90, décision d'Antonino du 03/11/2026 sur l'audit de facturation, OPEN-20) :
-- Coory ne fait plus de factures. Les règles de facturation changent d'un pays à l'autre (Peppol en
-- Belgique, plateformes agréées en France) : les factures se font dans le logiciel du coach (Odoo…)
-- ou chez son comptable. Coory garde un aperçu visuel : gagné, dépensé, résultat, « à encaisser ».
--
--   1. le taux de TVA devient un réglage de l'ORGANISATION (0 = pas de TVA), repris de sa structure
--      par défaut : il sert au prix des séances et au résultat HTVA, comme avant ;
--   2. la notification « Factures en retard » devient « Séances à encaisser » ;
--   3. l'inscription demande pays, devise et taux de TVA, sans créer de structure.
--
-- Rien n'est effacé : les tables des factures et des structures restent en base, l'application ne
-- les lit plus. Une migration de nettoyage pourra les supprimer une fois la décision confirmée.

-- ---------------------------------------------------------------------------
-- 1. Taux de TVA de l'organisation
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column vat_rate numeric(5, 2) not null default 0 check (vat_rate between 0 and 100);

comment on column public.organizations.vat_rate is
  'Taux de TVA du coach (%), libre ; 0 = pas de TVA. Prix des séances, résultat HTVA.';

-- Le taux de la structure par défaut (ou de la plus ancienne) de chaque organisation.
update public.organizations as organization
set vat_rate = entity.default_vat_rate
from (
  select distinct on (organization_id) organization_id, default_vat_rate
  from public.organization_legal_entities
  order by organization_id, is_default desc, created_at
) as entity
where entity.organization_id = organization.id and entity.default_vat_rate is not null;

-- Se modifie dans Paramètres, comme le pays : propriétaire seulement (policy existante sur l'update).
grant update (vat_rate) on public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- 2. « Séances à encaisser » remplace « Factures en retard »
-- ---------------------------------------------------------------------------
alter table public.coach_profiles rename column notify_invoices to notify_unpaid;

-- Les états (lu, masqué) des anciennes notifications de factures n'ont plus d'objet.
delete from public.coach_notification_states where key like 'invoice:%';
alter table public.coach_notification_states
  drop constraint coach_notification_states_key_check,
  add constraint coach_notification_states_key_check
    check (key ~ '^(competition|message|task|unpaid|profile):[0-9a-z:-]{1,120}$');

-- ---------------------------------------------------------------------------
-- 3. Inscription : pays, devise et taux de TVA (0 par défaut), sans structure
-- ---------------------------------------------------------------------------
drop function public.complete_signup(text, text, text, text, text, text, text, text, text, numeric, text);

create function public.complete_signup(
  p_kind text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_organization_name text,
  p_terms_version text,
  p_country text default 'BE',
  p_currency text default 'EUR',
  p_vat_rate numeric default 0
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
    -- Identifiant d'URL unique et neutre (le nom affiché reste libre). Pays, devise et taux de TVA
    -- vérifiés par les contraintes de la table.
    insert into public.organizations (name, slug, country, currency, vat_rate, created_by)
    values (v_org_name, 'coach-' || substr(md5(v_user_id::text || clock_timestamp()::text), 1, 12),
      coalesce(p_country, 'BE'), coalesce(p_currency, 'EUR'), coalesce(p_vat_rate, 0), v_user_id)
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

revoke all on function public.complete_signup(text, text, text, text, text, text, text, text, numeric)
  from public, anon;
grant execute on function public.complete_signup(text, text, text, text, text, text, text, text, numeric)
  to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- recréer complete_signup à 11 paramètres (20261029180000) ;
-- remettre la contrainte coach_notification_states_key_check avec « invoice » au lieu de « unpaid » ;
-- alter table public.coach_profiles rename column notify_unpaid to notify_invoices ;
-- revoke update (vat_rate) on public.organizations from authenticated ;
-- alter table public.organizations drop column vat_rate.
