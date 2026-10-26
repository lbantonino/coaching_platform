-- D-52 (26/10, demande d'Antonino) : le prix d'une séance encadrée, et son paiement.
-- Prix : facultatif, en centimes. Règle de Gianluca : par virement, la séance est FACTURÉE, le prix
-- est hors TVA et la TVA (21 %) s'ajoute (65 € HTVA = 78,65 € payés) ; en espèces, le prix est
-- « direct », TVA comprise (65 € reçus). La case « TVA comprise » suit le mode choisi, le coach peut
-- la changer (price_vat_included). Collective : un seul prix pour toute la séance (choix d'Antonino).
-- Paiement : quand le coach marque une date « payée », un vrai paiement reçu (athlete_payments) est
-- noté, relié à la séance et à sa date ; il compte dans « Encaissé cette semaine » à la date du
-- paiement (règle D-36 : le chiffre d'affaires suivi = argent réellement reçu). Une seule fois par date.
-- Forfait (même jour, retour de Gianluca relayé par Antonino) : certains sportifs paient 3 mois
-- d'avance, d'autres séance par séance. Un paiement de forfait porte la période qu'il couvre
-- (covers_from, covers_to) ; il compte en entier la semaine où il est reçu, et les dates de séance du
-- sportif dans cette période sont « comprises dans le forfait » (jamais payées une deuxième fois).

alter table public.coach_sessions
  add column price_cents integer check (price_cents is null or price_cents between 1 and 100000000),
  add column price_vat_included boolean not null default true,
  add column payment_method text check (payment_method is null or payment_method in ('cash', 'transfer')),
  -- Un prix sans mode de paiement (ou l'inverse) n'a pas de sens.
  add constraint coach_sessions_price_method_check check ((price_cents is null) = (payment_method is null));

comment on column public.coach_sessions.price_cents is
  'Prix de la séance en centimes (toute la séance pour une collective) ; TVA comprise si price_vat_included, sinon HTVA et la TVA s''ajoute.';

grant update (price_cents, price_vat_included, payment_method) on public.coach_sessions to authenticated;

-- Paiement d'une date de séance. `session_date` = la date de la série (avant un éventuel
-- déplacement), comme coach_session_exceptions.original_date. Séance supprimée : le paiement reste
-- (l'argent a été reçu), seul le lien disparaît. Une collective est payée sans sportif précis : son
-- libellé (titre et date) la désigne alors.
alter table public.athlete_payments
  alter column athlete_id drop not null,
  add column session_id uuid,
  add column session_date date,
  add constraint athlete_payments_session_fkey foreign key (session_id, organization_id)
    references public.coach_sessions (id, organization_id) on delete set null (session_id),
  add constraint athlete_payments_session_date_check check (session_id is null or session_date is not null),
  add constraint athlete_payments_payer_check check (athlete_id is not null or label is not null),
  add column covers_from date,
  add column covers_to date,
  add constraint athlete_payments_covers_check check (
    (covers_from is null) = (covers_to is null)
    and (covers_to is null or covers_to >= covers_from)
    -- Un forfait est payé par un sportif, et ce n'est pas le paiement d'une date de séance.
    and (covers_from is null or (athlete_id is not null and session_id is null))
  );

-- La période d'un forfait se corrige (comme le montant ou la date).
grant update (covers_from, covers_to) on public.athlete_payments to authenticated;

create unique index athlete_payments_session_date_key
  on public.athlete_payments (session_id, session_date) where session_id is not null;

-- Le lien séance / date ne se modifie pas : on supprime le paiement (« Annuler ») et on le refait.
-- (Le droit de mise à jour de athlete_payments reste limité à date, montant, taux, mode et libellé.)

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop index if exists public.athlete_payments_session_date_key;
-- alter table public.athlete_payments drop constraint athlete_payments_covers_check,
--   drop column covers_to, drop column covers_from, drop constraint athlete_payments_payer_check,
--   drop constraint athlete_payments_session_date_check, drop constraint athlete_payments_session_fkey,
--   drop column session_date, drop column session_id;
-- (athlete_id redevient obligatoire seulement s'il n'existe aucun paiement de collective.)
-- alter table public.coach_sessions drop constraint coach_sessions_price_method_check,
--   drop column payment_method, drop column price_vat_included, drop column price_cents;
