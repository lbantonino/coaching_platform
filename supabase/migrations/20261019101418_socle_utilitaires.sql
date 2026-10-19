-- P0-03 : utilitaires transverses du schéma. Aucune table métier ici :
-- organisations, memberships et RLS arrivent en P1, avec leurs tests d'isolation.

-- Met à jour automatiquement la colonne updated_at des tables métier.
-- Usage (P1+) : create trigger set_updated_at before update on <table>
--               for each row execute function public.set_updated_at();
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Trigger BEFORE UPDATE : renseigne updated_at avec l''horodatage de la transaction.';

-- Rollback (Supabase n'exécute pas de migration descendante ; à appliquer via une nouvelle migration) :
-- drop function if exists public.set_updated_at();
