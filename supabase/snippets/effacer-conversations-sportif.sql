-- Effacer les conversations de l'Assistant IA qui nomment un sportif (D-212, page Confidentialité :
-- « Si un coach demande la suppression d'un sportif, les conversations qui le nomment sont effacées
-- avec ses données »). Procédure À LA MAIN, dans l'éditeur SQL de Supabase (production), en même
-- temps que l'effacement des données du sportif, dans les 30 jours de la demande.
--
-- 1. Remplacer l'organisation, l'identifiant du sportif et son nom complet ci-dessous.
-- 2. Lancer d'abord le SELECT : vérifier la liste avec le coach si un nom est très courant.
-- 3. Puis le DELETE.

-- Les conversations concernées : le nom, ou l'identifiant (cartes d'action), dans les messages.
select id, title, last_message_at
from public.assistant_conversations
where organization_id = '00000000-0000-0000-0000-000000000000'
  and (messages::text ilike '%Prénom Nom%'
       or messages::text like '%00000000-0000-0000-0000-00000000000s%');

-- delete from public.assistant_conversations
-- where organization_id = '00000000-0000-0000-0000-000000000000'
--   and (messages::text ilike '%Prénom Nom%'
--        or messages::text like '%00000000-0000-0000-0000-00000000000s%');
