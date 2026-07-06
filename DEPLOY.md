# Deploying travel-planner (Phase 1: share by email + working link)

The app is a Vite SPA plus serverless functions in `/api`. Sharing needs three things
that only exist once deployed: a public URL, a database, and an email service.

## What was added

- `api/share.ts` — `POST /api/share`: saves a trip snapshot to Postgres and (if a
  recipient email is given) emails them a link via Resend. Returns `{ id, link, emailed }`.
- `api/share/[id].ts` — `GET /api/share/:id`: returns a stored trip.
- `src/screens/SharedTrip.tsx` — the read-only page the recipient opens (`/?shared=<id>`),
  with a "Save a copy" button that imports the trip into their own browser.
- `ShareMenu` now calls the real API instead of showing a fake "Invite sent" toast.

## One-time setup

1. **Push to GitHub** and import the repo at https://vercel.com/new
   (framework preset: **Vite**). Vercel auto-detects `/api` as serverless functions.

2. **Add a database:** Vercel dashboard → Storage → create a **Neon** Postgres database
   and connect it to the project. This sets `DATABASE_URL` automatically. (The `shares`
   table is created on first request — no migration step.)

3. **Add Resend:** create an account at https://resend.com, then in Vercel → Settings →
   Environment Variables add:
   - `RESEND_API_KEY` — from the Resend dashboard.
   - `EMAIL_FROM` — e.g. `Travel Planner <noreply@yourdomain.com>`.

   ⚠️ **Verify your sending domain in Resend** (add its DNS records). Without a verified
   domain, mail is sent from a sandbox sender and usually lands in spam — the exact
   "he didn't receive it" symptom you started with. Domain verification is what actually
   fixes deliverability.

4. **Redeploy** so the new env vars take effect.

## Local development

```bash
npm i -g vercel        # once
vercel link            # link this folder to the Vercel project
vercel env pull .env.local
vercel dev             # runs the SPA + /api functions together on one port
```

`npm run dev` (plain Vite) will NOT run the `/api` functions — use `vercel dev` to test
sharing locally.

## Env vars

See `.env.example`. Required: `DATABASE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`.
Optional: `PUBLIC_BASE_URL` to force the link host.
