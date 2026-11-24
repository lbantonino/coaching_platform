-- Secret de la route /api/alertes vérifié dans le Vault (D-205, 24/11/2026). La tâche planifiée envoie
-- « Bearer <alertes_secret> » (Vault) ; la route le fait vérifier ici, sur la même source. Il n'y a
-- ainsi qu'une copie du secret : plus de décalage possible avec une variable d'environnement collée à
-- la main (mise en ligne du 24/11). Comparaison des empreintes SHA-256 ; serveur seul (service_role).
-- Retour arrière : drop function public.alertes_secret_ok(text).

create or replace function public.alertes_secret_ok(p_given text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select length(s.decrypted_secret) >= 16
      and extensions.digest('Bearer ' || s.decrypted_secret, 'sha256')
        = extensions.digest(coalesce(p_given, ''), 'sha256')
    from vault.decrypted_secrets as s
    where s.name = 'alertes_secret'
  ), false)
$$;

revoke all on function public.alertes_secret_ok(text) from public, anon, authenticated;
grant execute on function public.alertes_secret_ok(text) to service_role;
