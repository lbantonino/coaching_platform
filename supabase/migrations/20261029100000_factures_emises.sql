-- Factures émises (D-17 étape B, BIZ-05, D-65), décisions d'Antonino du 29/10/2026 :
-- 1. une facture naît en BROUILLON (modifiable), « Émettre » lui donne son numéro et la FIGE ; une
--    erreur se corrigera par une note de crédit (tranche suivante) ;
-- 2. numéro par structure légale et par année : « FAC-2026-0001 », sans trou ni doublon ;
-- 3. le client (nom et adresse) vient de la fiche du sportif, qui gagne une adresse ;
-- 4. règle de Gianluca : seuls les paiements par virement sont facturés (les espèces, jamais).
-- Les règles légales restent à confirmer par le comptable (OPEN-17).

-- ---------------------------------------------------------------------------
-- 1. Adresse du sportif (fiche, onglet Profil) : reprise sur ses factures.
-- ---------------------------------------------------------------------------
alter table public.athlete_profiles
  add column address_line text
    check (address_line is null or char_length(btrim(address_line)) between 1 and 160),
  add column postal_code text check (postal_code is null or postal_code ~ '^[A-Z0-9 -]{2,10}$'),
  add column city text check (city is null or char_length(btrim(city)) between 1 and 80),
  add column country text not null default 'BE' check (country ~ '^[A-Z]{2}$');

grant update (address_line, postal_code, city, country) on public.athlete_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Clés composées (id, organisation) : une facture ne peut viser qu'un paiement et une structure
--    de SA propre organisation.
-- ---------------------------------------------------------------------------
alter table public.athlete_payments
  add constraint athlete_payments_id_org_unique unique (id, organization_id);
alter table public.organization_legal_entities
  add constraint organization_legal_entities_id_org_unique unique (id, organization_id);

-- ---------------------------------------------------------------------------
-- 3. Factures : brouillon ou émise. Les lignes existantes (suivi de D-35, sans numéro ni structure)
--    restent « émises » et inchangées.
-- ---------------------------------------------------------------------------
alter table public.athlete_invoices
  -- Une facture faite après coup pour un paiement déjà reçu est payée AVANT sa date d'émission.
  drop constraint athlete_invoices_check1,
  add column status text not null default 'issued' check (status in ('draft', 'issued')),
  add column legal_entity_id uuid,
  add column payment_id uuid,
  add column vat_rate smallint check (vat_rate is null or vat_rate in (0, 6, 12, 21)),
  -- Date de la prestation (séance, période), quand elle diffère de la date de facture.
  add column service_on date,
  add column client_name text
    check (client_name is null or char_length(btrim(client_name)) between 1 and 160),
  add column client_address_line text
    check (client_address_line is null or char_length(btrim(client_address_line)) between 1 and 160),
  add column client_postal_code text
    check (client_postal_code is null or client_postal_code ~ '^[A-Z0-9 -]{2,10}$'),
  add column client_city text
    check (client_city is null or char_length(btrim(client_city)) between 1 and 80),
  add column client_country text check (client_country is null or client_country ~ '^[A-Z]{2}$'),
  -- Numéro attribué à l'émission, jamais avant.
  add column number text,
  add column number_year smallint,
  add column number_seq integer check (number_seq is null or number_seq >= 1),
  -- Copie figée de la structure légale au moment de l'émission (raison sociale, TVA, adresse, IBAN…).
  add column seller jsonb,
  add column issued_at timestamptz,
  add constraint athlete_invoices_legal_entity_fkey foreign key (legal_entity_id, organization_id)
    references public.organization_legal_entities (id, organization_id) on delete restrict,
  add constraint athlete_invoices_payment_fkey foreign key (payment_id, organization_id)
    references public.athlete_payments (id, organization_id) on delete set null (payment_id),
  -- Une facture par paiement.
  add constraint athlete_invoices_payment_key unique (payment_id),
  add constraint athlete_invoices_number_key unique (legal_entity_id, number_year, number_seq),
  add constraint athlete_invoices_draft_number_check check (status = 'issued' or number is null),
  add constraint athlete_invoices_issued_check check (
    status = 'draft' or legal_entity_id is null or (
      number is not null and number_year is not null and number_seq is not null
      and seller is not null and issued_at is not null and client_name is not null
      and vat_rate is not null
    )
  );

comment on column public.athlete_invoices.status is
  'draft = brouillon modifiable ; issued = émise, figée (numéro, structure, client, montants).';

-- ---------------------------------------------------------------------------
-- 4. Une facture numérotée ne se modifie ni ne se supprime (correction par note de crédit). Seul
--    son paiement peut changer : marquée payée (mark_athlete_invoice_paid), ou le lien qui tombe si
--    ce paiement est supprimé.
-- ---------------------------------------------------------------------------
create function private.protect_issued_invoice()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
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

create trigger protect_issued_invoice before update or delete on public.athlete_invoices
  for each row execute function private.protect_issued_invoice();

-- ---------------------------------------------------------------------------
-- 5. Numérotation : un compteur par structure et par année, incrémenté dans la MÊME transaction que
--    l'émission (verrou de ligne) : deux émissions simultanées n'ont jamais le même numéro, et une
--    émission qui échoue ne consomme pas de numéro.
-- ---------------------------------------------------------------------------
create table private.invoice_counters (
  legal_entity_id uuid not null references public.organization_legal_entities (id) on delete cascade,
  year            smallint not null,
  last_seq        integer not null check (last_seq >= 1),
  primary key (legal_entity_id, year)
);

-- Émettre un brouillon : date du jour (Bruxelles), numéro suivant, copie figée de la structure.
-- SECURITY DEFINER pour écrire le compteur (schéma privé) ; l'appartenance est vérifiée ici.
create function public.issue_athlete_invoice(p_invoice_id uuid)
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
        'email', entity.billing_email,
        'legalMentions', entity.legal_mentions
      )
  where id = invoice.id;
  return invoice_number;
end;
$$;

revoke all on function public.issue_athlete_invoice(uuid) from public, anon;
grant execute on function public.issue_athlete_invoice(uuid) to authenticated;

-- Marquer payée une facture (brouillon ou émise) qui ne l'est pas encore : crée le VRAI paiement reçu
-- (Comptabilité, « encaissé ») avec le montant et la TVA de la facture, et les relie. Aucun argent
-- ne passe par Coory : le coach note ce qu'il a reçu. SECURITY DEFINER pour écrire paid_on sur une
-- facture émise (la RLS n'y autorise rien d'autre) ; l'appartenance est vérifiée ici.
create function public.mark_athlete_invoice_paid(p_invoice_id uuid, p_received_on date, p_method text)
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
  insert into public.athlete_payments (organization_id, athlete_id, received_on, amount_cents,
    vat_rate, method, label, created_by)
  values (invoice.organization_id, invoice.athlete_id, p_received_on, invoice.amount_cents,
    coalesce(invoice.vat_rate, 21), p_method,
    left(coalesce(invoice.number || ' · ', '') || invoice.label, 120), (select auth.uid()))
  returning id into new_payment_id;
  update public.athlete_invoices
  set paid_on = p_received_on, payment_id = new_payment_id
  where id = invoice.id;
  return new_payment_id;
end;
$$;

revoke all on function public.mark_athlete_invoice_paid(uuid, date, text) from public, anon;
grant execute on function public.mark_athlete_invoice_paid(uuid, date, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. RLS : les coachs de l'organisation créent, modifient et suppriment leurs BROUILLONS. L'émission
--    passe par issue_athlete_invoice ; une facture émise n'est plus modifiable (trigger ci-dessus).
-- ---------------------------------------------------------------------------
grant insert, delete on public.athlete_invoices to authenticated;
grant update (legal_entity_id, label, amount_cents, vat_rate, service_on, due_on, client_name,
  client_address_line, client_postal_code, client_city, client_country)
  on public.athlete_invoices to authenticated;

create policy "Membres : brouillons de factures dans leur organisation"
  on public.athlete_invoices for insert to authenticated
  with check (
    (select private.is_org_member(organization_id))
    and created_by = (select auth.uid())
    and status = 'draft' and number is null
  );

create policy "Membres : modification des brouillons de leur organisation"
  on public.athlete_invoices for update to authenticated
  using ((select private.is_org_member(organization_id)) and status = 'draft')
  with check ((select private.is_org_member(organization_id)) and status = 'draft');

create policy "Membres : suppression des brouillons de leur organisation"
  on public.athlete_invoices for delete to authenticated
  using ((select private.is_org_member(organization_id)) and status = 'draft');

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop policy if exists "Membres : suppression des brouillons de leur organisation" on public.athlete_invoices;
-- drop policy if exists "Membres : modification des brouillons de leur organisation" on public.athlete_invoices;
-- drop policy if exists "Membres : brouillons de factures dans leur organisation" on public.athlete_invoices;
-- revoke insert, delete, update on public.athlete_invoices from authenticated;
-- drop function if exists public.mark_athlete_invoice_paid(uuid, date, text);
-- drop function if exists public.issue_athlete_invoice(uuid);
-- drop table if exists private.invoice_counters;
-- drop trigger if exists protect_issued_invoice on public.athlete_invoices;
-- drop function if exists private.protect_issued_invoice();
-- delete from public.athlete_invoices where status = 'draft' or number is not null;
-- alter table public.athlete_invoices drop constraint athlete_invoices_issued_check,
--   drop constraint athlete_invoices_draft_number_check, drop constraint athlete_invoices_number_key,
--   drop constraint athlete_invoices_payment_key, drop constraint athlete_invoices_payment_fkey,
--   drop constraint athlete_invoices_legal_entity_fkey, drop column issued_at, drop column seller,
--   drop column number_seq, drop column number_year, drop column number, drop column client_country,
--   drop column client_city, drop column client_postal_code, drop column client_address_line,
--   drop column client_name, drop column service_on, drop column vat_rate, drop column payment_id,
--   drop column legal_entity_id, drop column status,
--   add constraint athlete_invoices_check1 check (paid_on is null or paid_on >= issued_on);
-- alter table public.organization_legal_entities drop constraint organization_legal_entities_id_org_unique;
-- alter table public.athlete_payments drop constraint athlete_payments_id_org_unique;
-- revoke update (address_line, postal_code, city, country) on public.athlete_profiles from authenticated;
-- alter table public.athlete_profiles drop column country, drop column city, drop column postal_code,
--   drop column address_line;
