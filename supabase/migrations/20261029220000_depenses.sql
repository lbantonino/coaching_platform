-- Dépenses du coach et résultat (D-73, décisions d'Antonino du 29/10/2026) : loyer de salle,
-- matériel, assurance… rangés dans des catégories que le coach modifie (liste de départ, comme les
-- Documents). Montant PAYÉ TVA comprise + taux : un coach soumis à la TVA voit son résultat HTVA et
-- la TVA récupérable ; sinon tout est TVA comprise. Une dépense peut se répéter CHAQUE MOIS (loyer,
-- abonnement), avec une date de fin facultative. Aucun argent ne passe par Coory.

-- ---------------------------------------------------------------------------
-- 1. Catégories de dépenses (par organisation)
-- ---------------------------------------------------------------------------
create table public.expense_categories (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null check (char_length(btrim(name)) between 1 and 60),
  color            text not null default 'grey'
    check (color in ('gold', 'blue', 'violet', 'orange', 'teal', 'green', 'pink', 'sky', 'grey')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  unique (id, organization_id)
);

comment on table public.expense_categories is
  'Catégories de dépenses propres à chaque organisation (créées, renommées, supprimées par le coach).';

create unique index expense_categories_name_key
  on public.expense_categories (organization_id, lower(btrim(name)));

create trigger set_updated_at before update on public.expense_categories
  for each row execute function public.set_updated_at();

alter table public.expense_categories enable row level security;
revoke all on public.expense_categories from anon, authenticated;
grant select, insert, delete on public.expense_categories to authenticated;
grant update (name, color) on public.expense_categories to authenticated;

create policy "Membres : lecture des catégories de dépenses"
  on public.expense_categories for select to authenticated
  using ((select private.is_org_member(organization_id)));
create policy "Membres : ajout de catégories de dépenses"
  on public.expense_categories for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));
create policy "Membres : modification des catégories de dépenses"
  on public.expense_categories for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));
create policy "Membres : suppression des catégories de dépenses"
  on public.expense_categories for delete to authenticated
  using ((select private.is_org_member(organization_id)));

create function private.add_default_expense_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.expense_categories (organization_id, name, color)
  select new.id, start.label, start.color
  from unnest(
    array['Loyer et salle', 'Matériel', 'Assurance', 'Déplacements', 'Formation',
      'Logiciels et abonnements', 'Autre'],
    array['blue', 'orange', 'violet', 'teal', 'green', 'sky', 'grey']
  ) as start (label, color)
  on conflict do nothing;
  return new;
end;
$$;

create trigger add_default_expense_categories after insert on public.organizations
  for each row execute function private.add_default_expense_categories();

insert into public.expense_categories (organization_id, name, color)
select organization.id, start.label, start.color
from public.organizations as organization,
  unnest(
    array['Loyer et salle', 'Matériel', 'Assurance', 'Déplacements', 'Formation',
      'Logiciels et abonnements', 'Autre'],
    array['blue', 'orange', 'violet', 'teal', 'green', 'sky', 'grey']
  ) as start (label, color);

-- ---------------------------------------------------------------------------
-- 2. Dépenses
-- ---------------------------------------------------------------------------
create table public.coach_expenses (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  category_id      uuid,
  label            text not null check (char_length(btrim(label)) between 1 and 120),
  -- Date de la dépense (de la première, pour une dépense qui se répète chaque mois).
  spent_on         date not null check (spent_on >= date '2000-01-01'),
  -- Montant payé, TVA comprise, en centimes, dans la devise de l'organisation ce jour-là.
  amount_cents     integer not null check (amount_cents between 1 and 100000000),
  vat_rate         numeric(5, 2) not null default 0 check (vat_rate between 0 and 100),
  currency         text not null default 'EUR' check (private.is_supported_currency(currency)),
  repeats_monthly  boolean not null default false,
  -- Dernier jour où une dépense répétée compte (facultatif).
  ends_on          date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  foreign key (category_id, organization_id)
    references public.expense_categories (id, organization_id) on delete set null (category_id),
  check (ends_on is null or (repeats_monthly and ends_on >= spent_on))
);

comment on table public.coach_expenses is
  'Dépenses du coach (TVAC + taux), éventuellement répétées chaque mois ; servent au résultat.';

create index coach_expenses_org_day_idx on public.coach_expenses (organization_id, spent_on);

create trigger set_updated_at before update on public.coach_expenses
  for each row execute function public.set_updated_at();
create trigger set_currency before insert on public.coach_expenses
  for each row execute function private.set_currency_from_organization();

alter table public.coach_expenses enable row level security;
revoke all on public.coach_expenses from anon, authenticated;
grant select, insert, delete on public.coach_expenses to authenticated;
grant update (category_id, label, spent_on, amount_cents, vat_rate, repeats_monthly, ends_on)
  on public.coach_expenses to authenticated;

create policy "Membres : lecture des dépenses"
  on public.coach_expenses for select to authenticated
  using ((select private.is_org_member(organization_id)));
create policy "Membres : ajout de dépenses"
  on public.coach_expenses for insert to authenticated
  with check ((select private.is_org_member(organization_id)) and created_by = (select auth.uid()));
create policy "Membres : modification des dépenses"
  on public.coach_expenses for update to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));
create policy "Membres : suppression des dépenses"
  on public.coach_expenses for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- 3. Changement de devise (D-70) : les dépenses à venir sont converties aussi. Une dépense répétée
--    déjà commencée est coupée : l'ancienne s'arrête la veille de sa prochaine date, une copie
--    convertie reprend à cette date.
-- ---------------------------------------------------------------------------
create function private.next_monthly_date(p_start date, p_from date)
returns date
language sql
immutable
set search_path = ''
as $$
  -- Même jour du mois que p_start (ramené au dernier jour d'un mois plus court), à partir de p_from.
  with months as (
    select (date_trunc('month', p_from) + make_interval(months => step))::date as month_start
    from generate_series(0, 1) as step
  )
  select min(candidate) from (
    select least(
      month_start + (extract(day from p_start)::integer - 1),
      (month_start + interval '1 month - 1 day')::date
    ) as candidate
    from months
  ) as dates
  where candidate >= p_from;
$$;

create or replace function public.change_organization_currency(
  p_organization_id uuid,
  p_currency text,
  p_rate numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_currency text;
  today date := (now() at time zone 'Europe/Brussels')::date;
  sessions_count integer;
  drafts_count integer;
  prices_count integer;
  expenses_count integer;
  split_count integer;
begin
  if not private.is_org_owner(p_organization_id) then
    raise exception 'Seul le propriétaire peut changer la devise.' using errcode = '42501';
  end if;
  select currency into old_currency from public.organizations
  where id = p_organization_id for update;
  if not private.is_supported_currency(p_currency) then
    raise exception 'Devise non proposée.' using errcode = 'P0001';
  end if;
  if p_currency = old_currency then
    raise exception 'C''est déjà la devise de ton organisation.' using errcode = 'P0001';
  end if;
  if p_rate is null or p_rate <= 0 or p_rate > 1000000 then
    raise exception 'Indique le taux de change (un nombre plus grand que 0).' using errcode = 'P0001';
  end if;

  update public.coach_sessions
  set price_cents = greatest(1, round(price_cents * p_rate)::integer),
      currency = p_currency
  where organization_id = p_organization_id
    and currency = old_currency
    and price_cents is not null
    and (case when repeats_weekly then coalesce(ends_on, 'infinity'::date) >= today
              else starts_on >= today end);
  get diagnostics sessions_count = row_count;

  update public.athlete_invoices
  set amount_cents = greatest(1, round(amount_cents * p_rate)::integer),
      currency = p_currency
  where organization_id = p_organization_id
    and status = 'draft'
    and payment_id is null
    and currency = old_currency;
  get diagnostics drafts_count = row_count;

  update public.coach_profiles as profile
  set default_price_cents = greatest(1, round(profile.default_price_cents * p_rate)::integer)
  where profile.default_price_cents is not null
    and profile.user_id in (
      select member.user_id from public.organization_members as member
      where member.organization_id = p_organization_id
    );
  get diagnostics prices_count = row_count;

  -- Dépenses répétées déjà commencées et encore en cours : coupées à leur prochaine date.
  with running as (
    select expense.*, private.next_monthly_date(expense.spent_on, today) as next_on
    from public.coach_expenses as expense
    where expense.organization_id = p_organization_id
      and expense.currency = old_currency
      and expense.repeats_monthly
      and expense.spent_on < today
  ),
  continuing as (
    select * from running where ends_on is null or ends_on >= next_on
  ),
  copies as (
    insert into public.coach_expenses (organization_id, category_id, label, spent_on, amount_cents,
      vat_rate, currency, repeats_monthly, ends_on, created_by)
    select organization_id, category_id, label, next_on,
      greatest(1, round(amount_cents * p_rate)::integer), vat_rate, p_currency, true, ends_on,
      created_by
    from continuing
    returning id
  )
  update public.coach_expenses as expense
  set ends_on = continuing.next_on - 1
  from continuing
  where expense.id = continuing.id;
  get diagnostics split_count = row_count;

  -- Dépenses à venir (une fois, ou répétées qui n'ont pas encore commencé).
  update public.coach_expenses
  set amount_cents = greatest(1, round(amount_cents * p_rate)::integer),
      currency = p_currency
  where organization_id = p_organization_id
    and currency = old_currency
    and spent_on >= today;
  get diagnostics expenses_count = row_count;

  update public.organizations set currency = p_currency where id = p_organization_id;

  insert into public.organization_currency_changes (organization_id, from_currency, to_currency,
    rate, changed_on, created_by)
  values (p_organization_id, old_currency, p_currency, p_rate, today, (select auth.uid()));

  return jsonb_build_object('sessions', sessions_count, 'drafts', drafts_count,
    'defaultPrices', prices_count, 'expenses', expenses_count + split_count);
end;
$$;

-- Rollback (via une nouvelle migration si nécessaire) :
-- recréer change_organization_currency de 20261029200000 ;
-- drop function if exists private.next_monthly_date(date, date);
-- drop table if exists public.coach_expenses;
-- drop trigger if exists add_default_expense_categories on public.organizations;
-- drop function if exists private.add_default_expense_categories();
-- drop table if exists public.expense_categories;
