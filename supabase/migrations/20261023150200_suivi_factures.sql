-- Étape 4a (D-35) : suivi des factures des sportifs, première tranche de D-17 étape A (« suivi »).
-- Sources : 00_INDEX D-17 (statut payé / en attente / en retard, tableau de bord calculé sur des
-- données réelles), prompt Claude Design §7.2 (carte Activité financière du tableau de bord).
--
-- Ce n'est PAS encore le document légal de la facture (numérotation continue, mentions légales, TVA ou
-- franchise, PDF) : il viendra avec l'étape B de D-17, après OPEN-17 (vérification par un comptable).
-- Aucun paiement ne transite par Coory : `paid_on` est la date à laquelle le coach a reçu l'argent.
-- Statut calculé, jamais stocké : payée (paid_on), en retard (non payée et due_on dépassée), en attente.
-- Montants en centimes d'euro (entiers : pas d'erreur d'arrondi).

create table public.athlete_invoices (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null,
  athlete_id       uuid not null,
  label            text not null check (char_length(btrim(label)) between 1 and 120),
  amount_cents     integer not null check (amount_cents between 1 and 100000000),
  issued_on        date not null check (issued_on >= date '2000-01-01'),
  due_on           date not null,
  paid_on          date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  foreign key (athlete_id, organization_id)
    references public.athlete_profiles (id, organization_id) on delete cascade,
  check (due_on >= issued_on),
  check (paid_on is null or paid_on >= issued_on)
);

comment on table public.athlete_invoices is
  'Suivi des factures des sportifs (D-17 étape A). Statut calculé : payée, en retard ou en attente. Montants en centimes.';

create index athlete_invoices_org_idx on public.athlete_invoices (organization_id, issued_on);

create trigger set_updated_at before update on public.athlete_invoices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS : lecture par les coachs de l'organisation. La saisie (nouvelle facture, paiement reçu) viendra avec
-- la page Facturation (4f), avec ses propres règles et tests. Le sportif n'a encore aucun accès.
-- ---------------------------------------------------------------------------
alter table public.athlete_invoices enable row level security;

revoke all on public.athlete_invoices from anon, authenticated;
grant select on public.athlete_invoices to authenticated;

create policy "Membres : lecture des factures de leur organisation"
  on public.athlete_invoices for select to authenticated
  using ((select private.is_org_member(organization_id)));

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop table if exists public.athlete_invoices;
