# ByteXL

ByteXL is a digital risk protection prototype for investigating potentially impersonating social profiles and app listings. It uses explainable, heuristic signals and explicit official-asset exclusions; it does not report, contact, block, or take down third-party accounts.

## Local development

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Without a configured publishable key, the app opens its clearly labelled synthetic demo workspace. To use the connected Supabase project, set a real `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`, deploy the migration and Edge Function, then create an account from the sign-up screen.

## Commands

```powershell
npm run dev
npm run test
npm run lint
npm run build
npm run seed:demo
```

## Documentation

- [Architecture](docs/architecture.md)
- [Integration setup and constraints](docs/api-integrations.md)
- [Reproducible demo](docs/demo-guide.md)

## Project structure

- `src/` contains the React interface, client authentication gate, local demo fixture, and testable detection engine.
- `supabase/migrations/` contains the version-controlled RLS schema and private brand-logo bucket policies.
- `supabase/functions/scan-brand/` contains the authenticated live scan orchestrator and provider adapters.
- `scripts/seed-demo.ts` seeds only explicitly requested synthetic fixture data into a selected organization.
