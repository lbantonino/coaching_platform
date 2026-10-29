-- Coory à l'international, étape 1 (D-69, décisions d'Antonino du 29/10/2026) :
--   - chaque organisation a un PAYS et une DEVISE, demandés dès l'inscription du coach ;
--   - chaque montant (paiement, facture, prix de séance) garde SA devise : le jour où le coach
--     change de devise (déménagement, étape 2), le passé reste juste et seul le futur est converti ;
--   - le taux de TVA est LIBRE (0 à 100 %, 2 décimales) : Coory ne tient aucune liste de taux par
--     pays (D-66) ; chaque structure a son taux habituel, proposé sur chaque facture ;
--   - les numéros d'entreprise et de TVA ne suivent le format belge que pour une structure belge ;
--   - « Coordonnées de paiement » libres pour les pays sans IBAN.

-- ---------------------------------------------------------------------------
-- 1. Pays et devise de l'organisation
-- ---------------------------------------------------------------------------
-- Devises proposées : uniquement des devises à 2 décimales (Coory compte en centimes).
create function private.is_supported_currency(code text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select code in ('EUR', 'CHF', 'GBP', 'USD', 'CAD', 'AUD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN',
    'CZK', 'RON', 'MAD', 'AED', 'SGD', 'HKD', 'ZAR', 'BRL', 'MXN');
$$;
grant execute on function private.is_supported_currency(text) to authenticated;

alter table public.organizations
  add column country text not null default 'BE' check (country ~ '^[A-Z]{2}$'),
  add column currency text not null default 'EUR' check (private.is_supported_currency(currency));

comment on column public.organizations.country is
  'Pays du coach (ISO 3166-1, ex. BE) : valeurs proposées par défaut, nom des moyens de paiement.';
comment on column public.organizations.currency is
  'Devise de l''organisation (ISO 4217) ; ne change que par change_organization_currency (étape 2).';

-- Le pays se modifie dans Paramètres (même règle que le nom : propriétaire seulement, policy existante).
grant update (country) on public.organizations to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Chaque montant garde sa devise
-- ---------------------------------------------------------------------------
alter table public.athlete_payments
  add column currency text not null default 'EUR' check (private.is_supported_currency(currency));
alter table public.athlete_invoices
  add column currency text not null default 'EUR' check (private.is_supported_currency(currency));
alter table public.coach_sessions
  add column currency text not null default 'EUR' check (private.is_supported_currency(currency));

comment on column public.athlete_payments.currency is 'Devise du montant reçu (celle de l''organisation ce jour-là).';
comment on column public.athlete_invoices.currency is 'Devise de la facture (figée à l''émission).';
comment on column public.coach_sessions.currency is 'Devise du prix de la séance.';

-- Un nouveau montant prend la devise de son organisation : le navigateur ne la choisit pas.
-- SECURITY INVOKER exprès : current_user vaut « authenticated » pour une écriture du coach, et le
-- propriétaire des tables dans une fonction SECURITY DEFINER (mark_athlete_invoice_paid transmet
-- la devise de la facture) ou dans les seeds, qui gardent alors la devise donnée.
create function private.set_currency_from_organization()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user = 'authenticated' then
    select organization.currency into new.currency
    from public.organizations as organization
    where organization.id = new.organization_id;
  end if;
  return new;
end;
$$;

create trigger set_currency before insert on public.athlete_payments
  for each row execute function private.set_currency_from_organization();
create trigger set_currency before insert on public.athlete_invoices
  for each row execute function private.set_currency_from_organization();
create trigger set_currency before insert on public.coach_sessions
  for each row execute function private.set_currency_from_organization();

-- Prix d'une séance modifié : il est saisi dans la devise actuelle de l'organisation.
create function private.set_session_price_currency()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.price_cents is distinct from old.price_cents and current_user = 'authenticated' then
    select organization.currency into new.currency
    from public.organizations as organization
    where organization.id = new.organization_id;
  end if;
  return new;
end;
$$;

create trigger set_price_currency before update of price_cents on public.coach_sessions
  for each row execute function private.set_session_price_currency();

-- ---------------------------------------------------------------------------
-- 3. Taux de TVA libre (0 à 100 %, 2 décimales)
-- ---------------------------------------------------------------------------
alter table public.athlete_payments drop constraint athlete_payments_vat_rate_check;
-- Valeur par défaut neutre (0 %) : l'application donne toujours le taux ; plus de 21 % belge d'office.
alter table public.athlete_payments
  alter column vat_rate set default 0,
  alter column vat_rate type numeric(5, 2),
  add constraint athlete_payments_vat_rate_check check (vat_rate between 0 and 100);

alter table public.athlete_invoices drop constraint athlete_invoices_vat_rate_check;
alter table public.athlete_invoices
  alter column vat_rate type numeric(5, 2),
  add constraint athlete_invoices_vat_rate_check
    check (vat_rate is null or vat_rate between 0 and 100);

-- ---------------------------------------------------------------------------
-- 4. Structures : taux habituel, numéros hors Belgique, coordonnées de paiement
-- ---------------------------------------------------------------------------
alter table public.organization_legal_entities
  add column default_vat_rate numeric(5, 2) check (default_vat_rate between 0 and 100),
  add column payment_details text
    check (payment_details is null or char_length(btrim(payment_details)) between 1 and 300);

-- Structures déjà assujetties : 21 %, le taux qu'elles utilisaient (Belgique).
update public.organization_legal_entities set default_vat_rate = 21 where vat_status = 'subject';
-- Le taux habituel n'existe que pour une structure assujettie.
alter table public.organization_legal_entities
  add constraint organization_legal_entities_default_vat_rate_status_check
    check ((vat_status = 'subject') = (default_vat_rate is not null));

comment on column public.organization_legal_entities.default_vat_rate is
  'Taux de TVA habituel de la structure (%), proposé sur chaque facture ; null si non assujettie.';
comment on column public.organization_legal_entities.payment_details is
  'Coordonnées de paiement libres (pays sans IBAN, autre moyen), imprimées sur la facture.';

alter table public.organization_legal_entities
  drop constraint organization_legal_entities_enterprise_number_check,
  drop constraint organization_legal_entities_vat_number_check,
  add constraint organization_legal_entities_enterprise_number_check
    check (enterprise_number is null or enterprise_number ~ '^[A-Za-z0-9 ./-]{2,30}$'),
  add constraint organization_legal_entities_vat_number_check
    check (vat_number is null or vat_number ~ '^[A-Za-z0-9 ./-]{2,30}$'),
  -- Structure belge : numéro BCE (10 chiffres) et numéro de TVA « BE » + ces 10 chiffres.
  add constraint organization_legal_entities_be_numbers_check
    check (country <> 'BE' or (
      (enterprise_number is null or enterprise_number ~ '^[01][0-9]{9}$')
      and (vat_number is null or vat_number ~ '^BE[01][0-9]{9}$')));

grant update (default_vat_rate, payment_details) on public.organization_legal_entities to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Émission et paiement d'une facture : coordonnées de paiement figées, devise de la facture
-- ---------------------------------------------------------------------------
create or replace function public.issue_athlete_invoice(p_invoice_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  invoice public.athlete_invoices;
  entity public.organization_legal_entities;
  today date := (now() at time zone 'Europe/Brussels')::date;
  invoice_year smallint := extract(year from (now() at time zone 'Europe/Brussels'))::smallint;
  seq integer;
  invoice_number text;
begin
  select * into invoice from public.athlete_invoices where id = p_invoice_id for update;
  if not found or not private.is_org_member(invoice.organization_id) then
    raise exception 'Facture introuvable.' using errcode = 'P0002';
  end if;
  if invoice.status <> 'draft' then
    raise exception 'Cette facture est déjà émise.' using errcode = 'P0001';
  end if;
  if invoice.legal_entity_id is null then
    raise exception 'Choisis la structure qui facture.' using errcode = 'P0001';
  end if;
  if invoice.client_name is null or invoice.vat_rate is null then
    raise exception 'Le client et le taux de TVA sont obligatoires.' using errcode = 'P0001';
  end if;
  select * into entity from public.organization_legal_entities where id = invoice.legal_entity_id;
  if entity.vat_status <> 'subject' and invoice.vat_rate <> 0 then
    raise exception 'Cette structure ne facture pas de TVA : mets le taux à 0 %%.' using errcode = 'P0001';
  end if;

  insert into private.invoice_counters as counter (legal_entity_id, year, last_seq)
  values (entity.id, invoice_year, 1)
  on conflict (legal_entity_id, year) do update set last_seq = counter.last_seq + 1
  returning last_seq into seq;
  invoice_number := entity.invoice_prefix || '-' || invoice_year || '-' || lpad(seq::text, 4, '0');

  update public.athlete_invoices
  set status = 'issued',
      number = invoice_number,
      number_year = invoice_year,
      number_seq = seq,
      issued_on = today,
      due_on = greatest(due_on, today),
      issued_at = now(),
      seller = jsonb_build_object(
        'name', entity.name,
        'legalForm', entity.legal_form,
        'enterpriseNumber', entity.enterprise_number,
        'vatStatus', entity.vat_status,
        'vatNumber', entity.vat_number,
        'addressLine', entity.address_line,
        'postalCode', entity.postal_code,
        'city', entity.city,
        'country', entity.country,
        'iban', entity.iban,
        'bic', entity.bic,
        'paymentDetails', entity.payment_details,
        'email', entity.billing_email,
        'legalMentions', entity.legal_mentions
      )
  where id = invoice.id;
  return invoice_number;
end;
$$;

create or replace function public.mark_athlete_invoice_paid(p_invoice_id uuid, p_received_on date, p_method text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invoice public.athlete_invoices;
  new_payment_id uuid;
begin
  select * into invoice from public.athlete_invoices where id = p_invoice_id for update;
  if not found or not private.is_org_member(invoice.organization_id) then
    raise exception 'Facture introuvable.' using errcode = 'P0002';
  end if;
  if invoice.paid_on is not null then
    raise exception 'Cette facture est déjà payée.' using errcode = 'P0001';
  end if;
  if p_received_on is null or p_received_on < date '2000-01-01'
     or p_received_on > (now() at time zone 'Europe/Brussels')::date then
    raise exception 'Indique la date du paiement (pas dans le futur).' using errcode = 'P0001';
  end if;
  -- Le paiement est reçu dans la devise de la facture (même après un changement de devise).
  insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents,
    vat_rate, currency, method, label, created_by)
  values (invoice.organization_id, invoice.athlete_id, p_received_on, invoice.amount_cents,
    coalesce(invoice.vat_rate, 0), invoice.currency, p_method,
    left(coalesce(invoice.number || ' · ', '') || invoice.label, 120), (select auth.uid()))
  returning id into new_payment_id;
  update public.athlete_invoices
  set paid_on = p_received_on, payment_id = new_payment_id
  where id = invoice.id;
  return new_payment_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Inscription : pays, devise et (facultatif) TVA, avec la première structure
-- ---------------------------------------------------------------------------
drop function public.complete_signup(text, text, text, text, text, text);

-- p_vat_status null = « je verrai plus tard » : aucune structure créée (le coach la crée dans
-- Paramètres, Coory la lui demande avant sa première facture).
create function public.complete_signup(
  p_kind text,
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_organization_name text,
  p_terms_version text,
  p_country text default 'BE',
  p_currency text default 'EUR',
  p_vat_status text default null,
  p_vat_rate numeric default null,
  p_vat_number text default null
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
    -- Identifiant d'URL unique et neutre (le nom affiché reste libre). Pays et devise vérifiés par
    -- les contraintes de la table.
    insert into public.organizations (name, slug, country, currency, created_by)
    values (v_org_name, 'coach-' || substr(md5(v_user_id::text || clock_timestamp()::text), 1, 12),
      coalesce(p_country, 'BE'), coalesce(p_currency, 'EUR'), v_user_id)
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

    -- Première structure (facultative) : le nom de l'organisation, « indépendant », sa TVA. Le reste
    -- (adresse, IBAN…) se complète dans Paramètres.
    if p_vat_status is not null then
      insert into public.organization_legal_entities (organization_id, name, legal_form, vat_status,
        default_vat_rate, vat_number, country, is_default, created_by)
      values (v_org_id, left(v_org_name, 120), 'independent', p_vat_status,
        case when p_vat_status = 'subject' then p_vat_rate end,
        case when p_vat_status = 'subject' then nullif(btrim(coalesce(p_vat_number, '')), '') end,
        coalesce(p_country, 'BE'), true, v_user_id);
    end if;
  end if;

  return p_kind;
end;
$$;

revoke all on function public.complete_signup(text, text, text, text, text, text, text, text, text, numeric, text)
  from public, anon;
grant execute on function public.complete_signup(text, text, text, text, text, text, text, text, text, numeric, text)
  to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- recréer complete_signup à 6 paramètres (20261023074320), issue_athlete_invoice et
-- mark_athlete_invoice_paid (20261029100000) ;
-- alter table public.organization_legal_entities drop constraint organization_legal_entities_be_numbers_check,
--   drop constraint organization_legal_entities_default_vat_rate_status_check,
--   drop column default_vat_rate, drop column payment_details ; remettre les anciens formats BE ;
-- remettre vat_rate en smallint check (vat_rate in (0, 6, 12, 21)) (paiements et factures) ;
-- drop trigger set_price_currency on public.coach_sessions ; drop trigger set_currency on les 3 tables ;
-- drop function private.set_session_price_currency(), private.set_currency_from_organization() ;
-- alter table ... drop column currency (paiements, factures, séances) ;
-- alter table public.organizations drop column country, drop column currency ;
-- drop function private.is_supported_currency(text).
