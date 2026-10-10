# Demo guide

The no-credential experience opens as an explicit **Demo** workspace. All samples represent the fictional Acme Wallet brand; the records are synthetic and never claim to be live discoveries.

1. Start the app without a `.env` file.
2. On Overview, inspect metrics derived from the local fixture, including a completed, partial, and failed scan.
3. Open Brands, then Acme Wallet. The registered official assets are clearly marked as verified.
4. Open Findings. `Acme Wallet Support` and `Acme Wallett` appear as active look-alike candidates with evidence and heuristic scores.
5. Open the excluded `Acme Wallet` app record in the App monitor. Its exact verified package identifier prevents it from entering the active threat queue.
6. Change a finding to under review, confirmed threat, false positive, or resolved. In demo mode, the change is persisted to local browser storage.
7. Start a demo scan from Overview. It records a new synthetic scan activity event without claiming that an external provider was called.

## Database fixture

For a controlled database demo, first create an authenticated account, obtain its organization UUID, then run:

```powershell
$env:SUPABASE_URL = 'https://fyxzifxlaupkixmyjdnd.supabase.co'
$env:SUPABASE_SERVICE_ROLE_KEY = 'server-side-only-value'
$env:DEMO_ORGANIZATION_ID = 'organization-uuid'
npm run seed:demo
```

The seed script requires a service-role key and must be run only in a trusted local or CI environment. It inserts synthetic records labelled `synthetic`; it never contacts third-party sources.
