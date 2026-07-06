# KISHIB Staging Local Environment Report

Date: 2026-07-06

## Result

Local Staging startup is ready. No Production env file was edited, no deployment was performed, and no secret value was written to source control or printed during verification.

Run it with:

```powershell
npm run dev:staging
```

To select a port:

```powershell
npm run dev:staging -- --port 3001
```

## Files changed

- `package.json`: added only the `dev:staging` script. Existing `dev` and `build` scripts are unchanged.
- `scripts/dev-staging.mjs`: added the isolated Staging launcher.
- `STAGING_LOCAL_ENV_REPORT.md`: this report.

`.env.local` and `.env.staging.local` were not modified.

## How environment files are loaded

Next.js automatically reads its standard env files, including `.env.local`; it does not natively treat `.env.staging.local` as a special environment name. A plain `next dev` wrapper would therefore risk mixing Production and Staging values.

The new launcher:

1. Reads `.env.staging.local` directly.
2. Requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to be present.
3. Refuses startup unless the URL is HTTPS and its exact hostname is `hvjwjbomfsuwaauolgyh.supabase.co`.
4. Creates a restricted child-process environment containing required operating-system variables and Staging variables.
5. Pre-masks variables found in standard Next.js env files before Next starts, preventing `.env.local` values from filling missing Staging values.
6. Starts `next dev` without changing the normal `dev` command.

Next may still display `.env.local` in its informational startup line because it discovers that filename. Its values cannot override the pre-set child environment. The built browser bundle verification below confirms that the Staging host was embedded and the Production host was not.

## Supabase verification

- `.env.staging.local` exists and is ignored by Git through the existing `.env*` rule.
- Staging Supabase URL is present, uses HTTPS, and exactly matches `hvjwjbomfsuwaauolgyh.supabase.co`.
- Staging anon key is present.
- Staging service-role key is present.
- No values were copied into this report.

## Service-role boundary

`SUPABASE_SERVICE_ROLE_KEY` is referenced only by server-side code:

- `src/app/api/account/delete/route.ts`
- `src/app/api/user-activity/route.ts`
- `src/lib/analysisAccessServer.ts` (explicit `server-only` guard)
- `src/lib/similarImageUsageServer.ts` (explicit `server-only` guard)
- `src/lib/marketReferences.ts` (imported by the server API route `/api/analyze`)

The browser Supabase client uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Checks performed

- TypeScript: `npx tsc --noEmit` — passed.
- Staging-isolated production build: `node scripts/dev-staging.mjs --build` — passed.
- Local startup: `npm run dev:staging -- --port 3999` — reached Ready successfully; the temporary server was then stopped.
- Browser bundle scan (`.next/static`):
  - Staging public hostname present: yes (expected).
  - Production public hostname present: no.
  - Actual service-role value present: no.
  - `SUPABASE_SERVICE_ROLE_KEY` variable name present: no.

The first diagnostic build used development mode during a production build and failed while prerendering `/_not-found`. The launcher was corrected to use `NODE_ENV=production` for its internal build-validation mode and `NODE_ENV=development` for `dev`; the subsequent full build passed.

## Scope and safety

- Normal `npm run dev` is unchanged.
- Normal `npm run build` is unchanged.
- Production keys and files are unchanged.
- No GitHub or Vercel action was performed.
- No Supabase SQL or remote project mutation was performed.
