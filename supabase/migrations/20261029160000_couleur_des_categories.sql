-- Couleur des catégories de documents (D-68, demande d'Antonino du 29/10/2026) : l'icône d'un
-- document prend la couleur de sa catégorie (Facture en or, Bilan en bleu…). Une couleur parmi une
-- palette fermée (jetons du design system), choisie par le coach dans « Gérer les catégories ».

alter table public.document_categories
  add column color text not null default 'grey'
    check (color in ('gold', 'blue', 'violet', 'orange', 'teal', 'green', 'pink', 'sky', 'grey'));

comment on column public.document_categories.color is
  'Couleur de l''icône des documents de cette catégorie (palette fermée du design system).';

grant update (color) on public.document_categories to authenticated;

-- Catégories de départ : chacune sa couleur.
create or replace function private.add_default_document_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.document_categories (organization_id, name, color)
  select new.id, start.label, start.color
  from unnest(
    array['Programme', 'Facture', 'Contrat', 'Bilan', 'Autre'],
    array['green', 'gold', 'violet', 'blue', 'grey']
  ) as start (label, color)
  on conflict do nothing;
  return new;
end;
$$;

-- Organisations existantes : leurs catégories de départ (encore présentes) reçoivent la même couleur.
update public.document_categories as category
set color = start.color
from unnest(
  array['Programme', 'Facture', 'Contrat', 'Bilan'],
  array['green', 'gold', 'violet', 'blue']
) as start (label, color)
where category.name = start.label;

-- Rollback (via une nouvelle migration si nécessaire) :
-- revoke update (color) on public.document_categories from authenticated;
-- alter table public.document_categories drop column color;
-- (et remettre la fonction add_default_document_categories de 20261029140000)
