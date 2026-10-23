-- D-36 (24/10, retour de Gianluca) : paiements reçus des sportifs. Le chiffre d'affaires suivi est
-- l'argent RÉELLEMENT REÇU (un forfait de 3 000 € compte le jour où il est payé). Coach assujetti à la
-- TVA : on note le montant reçu TVA comprise et le taux ; le HTVA et la TVA se calculent.
-- Mode de paiement : espèces, virement, Bancontact ou autre (filtre espèces / compte bancaire).
-- Aucun argent ne transite par Coory : c'est le coach qui note ce qu'il a reçu (D-17).
-- Taux et règles à faire valider par un comptable (OPEN-17) ; pas encore de lien avec une facture.

create table public.athlete_payments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  athlete_id       uuid not null,
  received_on      date not null check (received_on >= date '2000-01-01'),
  -- Montant reçu, TVA comprise, en centimes.
  amount_cents     integer not null check (amount_cents between 1 and 100000000),
  vat_rate         smallint not null default 21 check (vat_rate in (0, 6, 12, 21)),
  method           text not null check (method in ('cash', 'transfer', 'bancontact', 'other')),
  label            text check (label is null or char_length(btrim(label)) between 1 and 120),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade
);

comment on table public.athlete_payments is
  'Paiements reçus des sportifs (montant TVAC en centimes, taux de TVA, mode). Le CA suivi = argent reçu.';

create index athlete_payments_org_day_idx on public.athlete_payments (organization_id, received_on);

create trigger set_updated_at before update on public.athlete_payments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS : coachs de l'organisation uniquement. Un paiement noté par erreur se corrige ou se supprime
-- (ce n'est pas une facture légale). Le sportif n'y a pas accès.
-- ---------------------------------------------------------------------------
alter table public.athlete_payments enable row level security;

revoke all on public.athlete_payments from anon, authenticated;
grant select, insert, delete on public.athlete_payments to authenticated;
grant update (received_on, amount_cents, vat_rate, method, label) on public.athlete_payments to authenticated;

create policy "Membres : lecture des paiements de leur organisation"
  on public.athlete_payments for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy "Membres : ajout de paiements dans leur organisation"
  on public.athlete_payments for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));

create policy "Membres : correction des paiements de leur organisation"
  on public.athlete_payments for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy "Membres : suppression des paiements de leur organisation"
  on public.athlete_payments for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.athlete_payments;
