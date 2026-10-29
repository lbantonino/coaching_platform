-- Préférence du coach (D-66, demande d'Antonino du 29/10/2026) : proposer aussi les paiements en
-- ESPÈCES dans la carte « À facturer ». Coory sert à tous les coachs : certains facturent leurs
-- espèces, d'autres jamais (Gianluca). Désactivé par défaut : la liste reste celle des paiements
-- reçus sur le compte (virement, Bancontact).
alter table public.coach_profiles
  add column invoice_cash boolean not null default false;

-- Rollback (via une nouvelle migration si nécessaire) :
-- alter table public.coach_profiles drop column invoice_cash;
