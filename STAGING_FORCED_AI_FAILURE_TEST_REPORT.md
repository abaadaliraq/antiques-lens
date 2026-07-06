# Staging Forced AI Failure Test Report

Date: 2026-07-06

## Implementation

The Staging-only failure hook is evaluated in `/api/analyze` immediately after `authorizeAnalysisRequest` returns a runnable request and the active `request_id` is recorded. At that point the existing atomic authorization RPC has reserved/consumed the free credit, but no OpenAI client or other AI provider has been created.

The hook activates only when all of these conditions are true:

- `STAGING_FORCE_AI_FAILURE=true` (case-insensitive after trimming).
- `NODE_ENV` is not `production`.
- `NEXT_PUBLIC_SUPABASE_URL` is HTTPS and has the exact hostname `hvjwjbomfsuwaauolgyh.supabase.co`.

If any condition is false, behavior is unchanged. Vercel Production runs with `NODE_ENV=production`, so the hook cannot activate there even if the variable is mistakenly configured.

## Failure behavior

When enabled:

1. Authentication, request ID creation/idempotency, and atomic credit reservation run normally.
2. The route throws `STAGING_FORCED_AI_FAILURE` before constructing an AI client or parsing/saving a successful result.
3. The existing catch path calls `failAndRefundAnalysis(userId, requestId, reason)`.
4. The database `fail_analysis_request` RPC performs the idempotent refund and closes the attempt as `refunded` (or the existing non-credit failure state where no credit was consumed).
5. The response is HTTP 500 with code and message `STAGING_FORCED_AI_FAILURE`.
6. No successful evaluation is inserted.
7. Reusing the same request ID remains closed by the existing authorization RPC and cannot start AI again or refund twice.

## Files changed

- `src/app/api/analyze/route.ts`
- `src/lib/stagingForcedAiFailure.ts`
- `scripts/phase1-1-refund-idempotency.test.mjs`
- `STAGING_FORCED_AI_FAILURE_TEST_REPORT.md`

No SQL, pricing, subscription UI, deployment, or Production environment file was changed.

## Local configuration

Add this only to the ignored `.env.staging.local` file when running the failure test:

```dotenv
STAGING_FORCE_AI_FAILURE=true
```

Remove it or set it to `false` for normal Staging analysis.

Run:

```powershell
npm run dev:staging
```

## Verification

- `npx tsc --noEmit`: passed.
- Staging-isolated build (`node scripts/dev-staging.mjs --build`): passed.
- Phase 1 security and refund/idempotency tests: 16 passed, 0 failed.
- The new behavioral test verifies the actual modeled balance transitions: `used_count` starts at 2, becomes 3 after reservation, returns to 2 after failure, and remains 2 after a duplicate refund call.
- The test verifies zero AI runs, no evaluation record, a final `refunded` status, duplicate refund rejection, and rejection of the same request ID.
- Guard tests verify activation on local Staging and rejection in Production, against another Supabase project, and when the flag is false.

## Expected Supabase state

For a free-trial user with available credit:

- `analysis_requests.request_id`: created normally and unique.
- Request status: finishes as `refunded` after the forced failure.
- Failure reason: contains `STAGING_FORCED_AI_FAILURE`.
- Credit/`used_count`: temporarily increments during reservation, then returns to its original value exactly once.
- Refund accounting: one refund only for the request.
- `evaluations`: no successful row for that request ID.
- Repeating the same request ID: no new reservation, no provider execution, and no second refund.

Lifetime or actively subscribed access does not consume a trial credit; the request still fails deliberately and is closed through the same failure path without inventing a credit refund.
