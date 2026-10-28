-- D-57 (28/10, demande d'Antonino) : une vraie page Paramètres. Trois ajouts :
-- 1. Préférences du coach (coach_profiles ; le téléphone existe déjà depuis l'inscription libre) :
--    valeurs par défaut d'une nouvelle séance
--    (durée, lieu, prix, mode de paiement), heures affichées dans l'agenda, et ce qui compte dans la
--    cloche des notifications. Chaque coach a les siennes.
-- 2. Le propriétaire d'une organisation peut la renommer (jusqu'ici, aucune écriture possible).
-- 3. Les structures légales d'une organisation (organization_legal_entities) : un coach peut en avoir
--    plusieurs (ex. une activité d'indépendant assujetti à la TVA et une ASBL), chacune avec sa raison
--    sociale, son numéro d'entreprise, sa TVA, son adresse, son IBAN, son préfixe de factures. Les
--    factures choisiront plus tard la bonne structure (D-17, OPEN-17). Pas d'abonnement Coory ici (P8).

-- ---------------------------------------------------------------------------
-- 1. Préférences du coach
-- ---------------------------------------------------------------------------
alter table public.coach_profiles
  add column default_session_minutes smallint not null default 60
    check (default_session_minutes between 15 and 480),
  add column default_location text
    check (default_location is null or char_length(btrim(default_location)) between 1 and 120),
  add column default_price_cents integer
    check (default_price_cents is null or default_price_cents between 1 and 100000000),
  -- La TVA du prix par défaut suit le mode (règle de Gianluca, D-52) : virement = hors TVA, espèces = TVA comprise.
  add column default_payment_method text not null default 'transfer'
    check (default_payment_method in ('cash', 'transfer')),
  add column agenda_first_hour smallint not null default 6 check (agenda_first_hour between 0 and 12),
  add column agenda_last_hour smallint not null default 22 check (agenda_last_hour between 13 and 24),
  add column notify_competitions boolean not null default true,
  add column notify_messages boolean not null default true,
  add column notify_tasks boolean not null default true,
  add column notify_invoices boolean not null default true,
  add column notify_profiles boolean not null default true;

-- ---------------------------------------------------------------------------
-- 2. Renommer son organisation (propriétaire seulement)
-- ---------------------------------------------------------------------------
create or replace function private.is_org_owner(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = 'owner'
      and o.status = 'active'
  );
$$;

revoke all on function private.is_org_owner(uuid) from public, anon;
grant execute on function private.is_org_owner(uuid) to authenticated;

grant update (name) on public.organizations to authenticated;

create policy "Propriétaire : renommer son organisation"
  on public.organizations
  for update
  to authenticated
  using ((select private.is_org_owner(id)))
  with check ((select private.is_org_owner(id)));

-- ---------------------------------------------------------------------------
-- 3. Structures légales
-- ---------------------------------------------------------------------------
create table public.organization_legal_entities (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null references public.organizations (id) on delete cascade,
  name               text not null check (char_length(btrim(name)) between 1 and 120),
  legal_form         text not null check (legal_form in ('independent', 'asbl', 'srl', 'sa', 'other')),
  -- Numéro d'entreprise belge (BCE), 10 chiffres sans points (ex. 0123456749).
  enterprise_number  text check (enterprise_number is null or enterprise_number ~ '^[01][0-9]{9}$'),
  vat_status         text not null check (vat_status in ('subject', 'franchise', 'not_subject')),
  vat_number         text check (vat_number is null or vat_number ~ '^BE[01][0-9]{9}$'),
  address_line       text check (address_line is null or char_length(btrim(address_line)) between 1 and 160),
  postal_code        text check (postal_code is null or postal_code ~ '^[A-Z0-9 -]{2,10}$'),
  city               text check (city is null or char_length(btrim(city)) between 1 and 80),
  country            text not null default 'BE' check (country ~ '^[A-Z]{2}$'),
  iban               text check (iban is null or iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{10,30}$'),
  bic                text check (bic is null or bic ~ '^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$'),
  billing_email      text check (billing_email is null or billing_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  invoice_prefix     text not null default 'FAC' check (invoice_prefix ~ '^[A-Z0-9-]{1,12}$'),
  legal_mentions     text check (legal_mentions is null or char_length(btrim(legal_mentions)) between 1 and 1000),
  is_default         boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references auth.users (id) on delete set null,
  -- Assujetti à la TVA : son numéro de TVA est obligatoire.
  check (vat_status <> 'subject' or vat_number is not null)
);

comment on table public.organization_legal_entities is
  'Structures légales d''une organisation (raison sociale, BCE, TVA, adresse, IBAN) ; une seule par défaut.';

-- Une seule structure par défaut par organisation.
create unique index organization_legal_entities_default_key
  on public.organization_legal_entities (organization_id) where is_default;
create index organization_legal_entities_org_idx on public.organization_legal_entities (organization_id);

create trigger set_updated_at before update on public.organization_legal_entities
  for each row execute function public.set_updated_at();

alter table public.organization_legal_entities enable row level security;

revoke all on public.organization_legal_entities from anon, authenticated;
grant select, insert, delete on public.organization_legal_entities to authenticated;
grant update (name, legal_form, enterprise_number, vat_status, vat_number, address_line, postal_code,
  city, country, iban, bic, billing_email, invoice_prefix, legal_mentions, is_default)
  on public.organization_legal_entities to authenticated;

create policy "Membres : lecture des structures de leur organisation"
  on public.organization_legal_entities for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de structures dans leur organisation"
  on public.organization_legal_entities for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : modification des structures de leur organisation"
  on public.organization_legal_entities for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : suppression des structures de leur organisation"
  on public.organization_legal_entities for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.organization_legal_entities;
-- drop policy if exists "Propriétaire : renommer son organisation" on public.organizations;
-- revoke update (name) on public.organizations from authenticated;
-- drop function if exists private.is_org_owner(uuid);
-- alter table public.coach_profiles drop column default_session_minutes,
--   drop column default_location, drop column default_price_cents, drop column default_payment_method,
--   drop column agenda_first_hour, drop column agenda_last_hour, drop column notify_competitions,
--   drop column notify_messages, drop column notify_tasks, drop column notify_invoices,
--   drop column notify_profiles;
