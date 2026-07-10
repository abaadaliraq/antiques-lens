This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## KISHIB production push notifications

Production behavior:

- Android package: `com.kishib.app`
- Firebase Android config: `android/app/google-services.json`
- Notification channel: `kishib_general`
- Capacitor production URL: `https://antiques-lens.vercel.app`

By default, Android builds keep `server.url` enabled through `capacitor.config.ts`, so the installed app loads the production Vercel web code. This is the correct Play Store behavior for KISHIB because API routes such as `/api/admin/push/send` must run on the server.

Only use bundled web mode intentionally:

```bash
KISHIB_CAPACITOR_BUNDLED_WEB=1 npx cap sync android
```

Bundled mode removes `server.url`; do not use it for production unless the app has a valid static export and no server-only API dependency.

Required Vercel production environment variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
KISHIB_ADMIN_EMAILS
KISHIB_ADMIN_PUSH_SECRET
```

Notes:

- `FIREBASE_PROJECT_ID` should match `kishib`.
- `FIREBASE_PRIVATE_KEY` must come from a Firebase service account JSON. In Vercel it can be pasted with escaped newlines (`\n`) or real newlines.
- `KISHIB_ADMIN_EMAILS` is a comma-separated allowlist for the admin reminder action, for example `owner@example.com,admin@example.com`.
- `KISHIB_ADMIN_PUSH_SECRET` is a shared server-to-server secret accepted through the `x-kishib-admin-push-secret` header for the external admin dashboard.
- Admin access is enforced server-side. The client menu only shows the action after `/api/admin/push/send` confirms the logged-in session is admin.

Deploy web code:

```bash
npm run build
npx vercel --prod
```

After deploy, open the Vercel production URL and confirm the account menu works for the admin account.

Build Android production candidate:

```bash
npm run build
npx cap sync android
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug --rerun-tasks
```

For Play Store release, build the signed release artifact with the project release signing setup:

```bash
cd android
.\gradlew.bat bundleRelease
```

Production test before Play Store release:

1. Install the latest APK/AAB candidate on a real Android device.
2. Log in with a normal user account.
3. Confirm Android notification permission is enabled in system settings.
4. Open the app once and confirm the token is saved in Supabase `push_tokens` with `active = true`.
5. Send a Firebase Console test message to that exact FCM token. Confirm it reaches the phone.
6. Log in as an admin account listed in `KISHIB_ADMIN_EMAILS`.
7. Open the KISHIB account menu and choose `Admin reminders`.
8. Press `Preview`; confirm the active target count is expected.
9. Press `Send`; confirm the success count is greater than zero.
10. Confirm the normal user device receives the KISHIB reminder notification.
11. Check Vercel logs for `[PUSH][FAILED]`. There should be no server credential or Firebase errors.

Do not submit to Play Store until a real production device receives a notification through the admin reminder action, not only through Firebase Console.
