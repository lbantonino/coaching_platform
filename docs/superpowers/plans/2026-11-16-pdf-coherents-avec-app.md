# PDF cohérents avec l'app (après D-187 et D-188) : plan

> Exécution native, sans commit (Antonino commite) ; relecture indépendante à la fin. Décisions
> d'Antonino du 16/11 (6 questions posées une par une). Les PDF restent tels qu'il les aime (« super
> élégants, super compréhensifs ») : on aligne le contenu et les signes, pas la mise en page.

**Goal :** les deux PDF (Agenda, Fiches et repères) disent la même chose que l'app : plus de pastilles,
musculation comme les cartes (exercices listés, superset en cadre, charge, pas de RIR), allures avec
leur unité, étiquettes en rectangles arrondis.

**Spec :** les décisions ci-dessous + D-187 (`docs/superpowers/specs/2026-11-15-seances-en-cartes-design.md`)
et D-188 (`docs/superpowers/plans/2026-11-16-cartes-programme-menu-et-pastilles.md`).

## Décisions d'Antonino (16/11)
1. Puces rondes devant les lignes (Agenda, fiche Hyrox) → **petit trait de couleur** de la discipline.
2. Agenda PDF, musculation : **lister les exercices** (nom + volume, superset groupé « Superset · 3 tours »)
   **+ le lien** vers sa fiche.
3. Fiche musculation : **RIR retiré** du commentaire (tempo et consigne du coach restent).
4. Fiche musculation : **colonne « Charge »** (charge de la 1re séance de la fiche : kg si connus, sinon
   « 70 % du max ») ET le tableau « Charges semaine par semaine » reste.
5. Superset : **un cadre comme la carte de l'app** (« Superset », « 3 tours », A1/A2 avec répétitions,
   charge, commentaire, « Repos 1:30 après chaque tour » en bas) ; le conseil « A1 + A2 = superset »
   disparaît.
6. Allures : **unité dans la colonne** (« 6:15 /km », « 5:00 – 5:10 /km », « 2:10 /500 m ») ; la note
   « Course en min/km… » disparaît.
- Sans question (règle D-188) : étiquettes des PDF en rectangles arrondis, jamais en capsule.

## Choix pris par Claude
- L'ordre de la séance est gardé : exercices seuls dans un tableau, superset dans son cadre à sa place,
  les exercices suivants dans un nouveau tableau (en-tête répété).
- L'EMOM suit la même règle que le superset (un cadre « EMOM · 12 min »), comme sa carte dans l'app.
- « % du max » s'écrit en entier partout dans les PDF (fiche et charges semaine par semaine), comme l'app.
- Agenda : une séance de musculation listée n'a plus son résumé (« 4 exercices · % du max ») ; le Hyrox
  trop long garde résumé + renvoi. L'estimation de hauteur compte les lignes listées ; une semaine trop
  pleine raccourcit aussi une musculation (le renvoi à la fiche reste).

## Review Focus
1. Une semaine chargée (4 séances par jour, D-164) tient encore sur sa page dans l'Agenda.
2. Superset en premier, au milieu ou en dernier ; deux supersets ; superset d'un seul tour ; EMOM.
3. Séance v1 (texte) de musculation : rien ne casse (blocs numérotés).
4. Charge absente (poids du corps) : « — » ; kilos d'une plage « 40-45 kg » ; secondes (exercice tenu).
5. Allures d'ergomètres et plages de course : unité une seule fois, pas de « /km /km ».

### Task 1 : domaine (Vitest d'abord)
`pdf-agenda.ts` (lignes de musculation + renvoi, superset groupé, hauteur), `pdf-fiches.ts` (RIR,
charge, sections tableau / cadre dans l'ordre, conseil, allures, note), tests `pdf-agenda.test.ts`,
`pdf-fiches.test.ts`.

### Task 2 : rendu React-PDF
`pdf-kit.tsx` (trait au lieu de la puce, bloc répété), `agenda-pdf.tsx` (musculation listée + renvoi),
`fiches-pdf.tsx` (colonne Charge, cadre superset / EMOM, étiquettes arrondies) ; `pdf-render.test.ts`,
`program-pdf.spec.ts` ; captures avant / après des PDF de démo (Inès « Prépa HYROX · bloc 2 », Thomas).
