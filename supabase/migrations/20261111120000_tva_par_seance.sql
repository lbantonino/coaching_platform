-- D-163 (11/11/2026, demande d'Antonino) : la TVA se choisit à chaque paiement, dépense ou séance,
-- plus dans les Paramètres. Les paiements (athlete_payments.vat_rate) et les dépenses
-- (coach_expenses.vat_rate) avaient déjà leur propre taux ; la séance reçoit le sien.
-- vat_rate = 0 : prix sans TVA (le sportif paie le prix tel quel). vat_rate > 0 : TVA comprise dans le
-- prix si price_vat_included, sinon le prix est HTVA et la TVA s'ajoute. Le paiement noté quand le
-- coach marque une date payée reprend ce taux.
-- Les séances existantes reprennent le taux de leur organisation : les montants à encaisser ne
-- changent pas. organizations.vat_rate reste en place mais l'app ne le lit plus (suppression
-- possible plus tard, après une sauvegarde).

alter table public.coach_sessions
  add column vat_rate numeric(5, 2) not null default 0 check (vat_rate between 0 and 100);

comment on column public.coach_sessions.vat_rate is
  'Taux de TVA du prix de la séance (0 = sans TVA) ; TVA comprise si price_vat_included, sinon elle s''ajoute.';

update public.coach_sessions as session
set vat_rate = organization.vat_rate
from public.organizations as organization
where organization.id = session.organization_id
  and organization.vat_rate > 0;

grant update (vat_rate) on public.coach_sessions to authenticated;

-- Retour arrière :
-- revoke update (vat_rate) on public.coach_sessions from authenticated ;
-- alter table public.coach_sessions drop column vat_rate.
