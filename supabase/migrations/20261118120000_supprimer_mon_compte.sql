-- « Supprimer mon compte » (décisions d'Antonino du 18/11/2026 ; droit à l'effacement du RGPD, exigé
-- aussi par Apple et Google) : le coach efface TOUTES les données de son organisation, tout de suite.
-- Cette fonction efface les données. L'action serveur de l'app (src/features/account/delete-account.ts)
-- est son SEUL point d'entrée : elle vérifie le mot « SUPPRIMER », efface les fichiers du stockage
-- (avant, sinon on ne saurait plus où ils sont), appelle cette fonction, supprime le compte lui-même
-- (auth.admin.deleteUser, la voie officielle de Supabase), puis déconnecte. D'où les droits : le
-- serveur seulement (service_role), jamais la session d'un coach (relecture du 18/11 : appelée
-- directement, elle effaçait l'organisation sans le mot, en laissant les fichiers et le compte).
--
-- Garde-fous : jamais sans compte ; jamais le compte de démonstration partagé ; jamais une organisation
-- partagée avec un autre coach (ses données ne sont pas les siennes ; pas encore possible dans le MVP).
-- Ordre imposé par deux liens « restrict » : les factures (liées aux entités juridiques), puis les
-- sportifs (liés à l'organisation), puis l'organisation, qui emporte le reste en cascade. Un sportif
-- qui a son propre compte le garde (seul le lien vers sa fiche disparaît, « set null »).
-- Rejouable : relancée après une étape qui a échoué plus loin, elle ne trouve plus rien et passe.

create function public.delete_account_data(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
begin
  if p_user_id is null then
    raise exception 'Compte inconnu.' using errcode = '42501';
  end if;
  if exists (select 1 from private.demo_accounts d where d.user_id = p_user_id) then
    raise exception 'Le compte de démonstration ne se supprime pas.' using errcode = '42501';
  end if;
  if exists (
    select 1
    from public.organization_members m
    join public.organization_members other
      on other.organization_id = m.organization_id and other.user_id <> p_user_id
    where m.user_id = p_user_id
  ) then
    raise exception 'Ton organisation est partagée avec un autre coach.' using errcode = 'CY412';
  end if;

  for v_org in
    select m.organization_id from public.organization_members m where m.user_id = p_user_id
  loop
    -- Les factures émises sont protégées (jamais supprimées ni modifiées) ; la suppression du compte,
    -- et elle seule, les emporte pour CETTE organisation (le coach reste responsable de les conserver :
    -- politique de confidentialité, il les télécharge avant).
    perform set_config('coory.account_delete', v_org::text, true);
    delete from public.athlete_invoices where organization_id = v_org;
    delete from public.athlete_profiles where organization_id = v_org;
    delete from public.organizations where id = v_org;
  end loop;
  perform set_config('coory.account_delete', '', true);
end;
$$;

revoke all on function public.delete_account_data(uuid) from public, anon, authenticated;
grant execute on function public.delete_account_data(uuid) to service_role;

-- Factures émises (20261029100000, démo 20261114150000) : la suppression d'un compte peut les effacer,
-- pour l'organisation qu'elle efface et dans sa transaction seulement.
create or replace function private.protect_issued_invoice()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if current_setting('coory.demo_reset', true) = 'on' then
      if exists (select 1 from private.demo_accounts d where d.organization_id = old.organization_id) then
        return old;
      end if;
    end if;
    if current_setting('coory.account_delete', true) = old.organization_id::text then
      return old;
    end if;
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
