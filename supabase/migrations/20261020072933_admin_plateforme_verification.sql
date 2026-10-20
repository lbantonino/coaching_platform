-- P1-04 : permettre au serveur de savoir si l'utilisateur connecté est administrateur de la plateforme,
-- sans jamais rendre la table platform_admins lisible depuis le navigateur.
--
-- La fonction ne répond que pour l'appelant (auth.uid()) : impossible d'interroger le statut d'un tiers.
-- Exposée dans `public` car l'API Supabase (RPC) n'appelle que les schémas exposés.

create or replace function public.current_user_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins a
    where a.user_id = (select auth.uid())
      and a.is_active
  );
$$;

comment on function public.current_user_is_platform_admin() is
  'Vrai si l''utilisateur connecté est administrateur actif de la plateforme. Ne révèle rien sur les autres comptes.';

revoke all on function public.current_user_is_platform_admin() from public, anon;
grant execute on function public.current_user_is_platform_admin() to authenticated;

-- Rollback (via une nouvelle migration si nécessaire) :
-- drop function if exists public.current_user_is_platform_admin();
