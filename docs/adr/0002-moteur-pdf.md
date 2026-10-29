# ADR 0002 — Moteur PDF : React-PDF

- **Statut** : accepté (29/10/2026), story D-65 (factures émises).
- **Décideur** : Antonino, sur proposition argumentée (trois options comparées).

## Contexte

Les factures du coach (D-17 étape B, BIZ-05) doivent se télécharger en PDF. Le même moteur servira aux PDF des programmes publiés (P5). `CLAUDE.md` demande **un seul** moteur PDF TypeScript/Node, choisi après un rendu réel.

## Décision

**`@react-pdf/renderer` 4.9.0**, rendu **côté serveur** dans une Route Handler (`/coach/facturation/[invoiceId]/pdf`), lu avec la session du coach (la RLS ne laisse sortir que les factures de son organisation).

| Option | Pour | Contre | Verdict |
|---|---|---|---|
| **React-PDF** | Le document s'écrit en composants React et en TypeScript ; pas de navigateur sur le serveur ; léger, marche chez n'importe quel hébergeur | La mise en page est un sous-ensemble de CSS (flexbox) | **Retenu** |
| Chromium (HTML → PDF) | Rendu identique au navigateur, tout le CSS | Un navigateur à faire tourner sur le serveur : lourd, lent, compliqué chez beaucoup d'hébergeurs | Écarté |
| pdf-lib | Très léger | Chaque texte et chaque trait placés à la main en coordonnées : long à écrire et à faire évoluer | Écarté |

## Conséquences

- Police : **Helvetica**, intégrée au format PDF (aucun fichier à embarquer). Elle n'a pas l'espace fine insécable des montants à la belge : on la remplace par une espace simple dans le PDF.
- Couleurs du PDF écrites en hexadécimal dans `src/features/billing/invoice-pdf.tsx` : un PDF ne lit pas les variables CSS du thème. Document imprimable : fond blanc, texte noir, un filet or.
- Vérification : rendu réel ouvert et relu (en-tête, client, tableau, totaux, IBAN, mentions), test e2e qui contrôle le type `application/pdf`, la signature `%PDF` et le nom du fichier.
