-- Coory à l'international, étape 2 (D-70, choix d'Antonino du 29/10/2026 : « passé gardé, futur
-- converti ») : un coach qui déménage change la devise de son organisation. Le passé reste dans sa
-- devise (paiements reçus, factures émises : c'est de l'argent réel, sur les relevés bancaires) ; le
-- coach saisit le taux (1 EUR = 0,94 CHF) et Coory convertit ce qui est À VENIR : prix des séances qui
-- ont encore des dates, brouillons de facture sans paiement relié, prix par défaut des coachs.
-- Chaque changement est gardé (historique) : il sert aux totaux convertis « à titre indicatif ».

-- ---------------------------------------------------------------------------
-- 1. Historique des changements de devise
-- ---------------------------------------------------------------------------
create table public.organization_currency_changes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  from_currency    text not null check (private.is_supported_currency(from_currency)),
  to_currency      text not null check (private.is_supported_currency(to_currency)),
  -- 1 from_currency = rate to_currency.
  rate             numeric(16, 6) not null check (rate > 0),
  changed_on       date not null,
  created_at       timestamptz not null default now(),
  created_by       uuid references auth.users (id) on delete set null,
  check (from_currency <> to_currency)
);

comment on table public.organization_currency_changes is
  'Changements de devise d''une organisation (déménagement) : de, vers, taux saisi par le coach, date.';

create index organization_currency_changes_org_idx
  on public.organization_currency_changes (organization_id, created_at);

alter table public.organization_currency_changes enable row level security;
revoke all on public.organization_currency_changes from anon, authenticated;
grant select on public.organization_currency_changes to authenticated;

-- Lecture par les membres ; aucune écriture directe (seulement par change_organization_currency).
create policy "Membres : lecture des changements de devise de leur organisation"
  on public.organization_currency_changes for select to authenticated
  using ((select private.is_org_member(organization_id)));

-- ---------------------------------------------------------------------------
-- 2. Changer de devise (propriétaire seulement), en une seule transaction
-- ---------------------------------------------------------------------------
create function public.change_organization_currency(
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

  -- Séances qui ont encore des dates : une séance hebdomadaire sans fin ou qui finit aujourd'hui ou
  -- plus tard, une séance unique d'aujourd'hui ou plus tard.
  update public.coach_sessions
  set price_cents = greatest(1, round(price_cents * p_rate)::integer),
      currency = p_currency
  where organization_id = p_organization_id
    and currency = old_currency
    and price_cents is not null
    and (case when repeats_weekly then coalesce(ends_on, 'infinity'::date) >= today
              else starts_on >= today end);
  get diagnostics sessions_count = row_count;

  -- Brouillons sans paiement relié (un brouillon relié garde la devise de l'argent reçu).
  update public.athlete_invoices
  set amount_cents = greatest(1, round(amount_cents * p_rate)::integer),
      currency = p_currency
  where organization_id = p_organization_id
    and status = 'draft'
    and payment_id is null
    and currency = old_currency;
  get diagnostics drafts_count = row_count;

  -- Prix par défaut des coachs de l'organisation (Paramètres › Préférences).
  update public.coach_profiles as profile
  set default_price_cents = greatest(1, round(profile.default_price_cents * p_rate)::integer)
  where profile.default_price_cents is not null
    and profile.user_id in (
      select member.user_id from public.organization_members as member
      where member.organization_id = p_organization_id
    );
  get diagnostics prices_count = row_count;

  update public.organizations set currency = p_currency where id = p_organization_id;

  insert into public.organization_currency_changes (organization_id, from_currency, to_currency,
    rate, changed_on, created_by)
  values (p_organization_id, old_currency, p_currency, p_rate, today, (select auth.uid()));

  return jsonb_build_object('sessions', sessions_count, 'drafts', drafts_count,
    'defaultPrices', prices_count);
end;
$$;

revoke all on function public.change_organization_currency(uuid, text, numeric) from public, anon;
grant execute on function public.change_organization_currency(uuid, text, numeric) to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop function if exists public.change_organization_currency(uuid, text, numeric);
-- drop table if exists public.organization_currency_changes;
