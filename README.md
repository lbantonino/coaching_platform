# Coory

Application web pour les coachs sportifs (running, musculation, Hyrox, hybride). Le coach y gère ses sportifs, ses programmes d'entraînement, son agenda et ses paiements, avec un assistant IA qui prépare les actions et les lui fait valider.

**Bêta en ligne :** [coory-beta.vercel.app](https://coory-beta.vercel.app)

## Stack

Next.js · React · TypeScript · Tailwind CSS · Supabase (PostgreSQL, Auth, Storage) · API Claude · Vercel

## Lancer le projet en local

Prérequis : Node.js 24 et Docker Desktop.

```bash
npm install
cp .env.example .env.local   # valeurs données par : npm run db:status
npm run db:start             # Supabase en local
npm run db:reset             # base de démonstration
npm run dev                  # http://localhost:3000
```

## Tests

```bash
npm run check      # lint, types, format et tests unitaires
npm run db:test    # tests de la base et de la sécurité (pgTAP)
npm run test:e2e   # parcours complets (Playwright)
```

---

Antonino Lo Bianco · 2026
