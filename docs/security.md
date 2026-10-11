# Security checklist

What protects PaliaEats, and the few things only the owner can switch on.

## Already in the code
- **Row Level Security** on every table, tested by `supabase/tests/rls_check.sql`.
- **Prices re-checked in the database** when an order is placed; orders are rate limited.
- **Browser rules** on every page (`next.config.ts`): no framing, content-security-policy (only our own scripts and
  Supabase), no camera/microphone, location only when asked.
- **Passwords** are handled by Supabase (never stored by PaliaEats). Login and sign-up are rate limited, and the
  sign-up, join and help forms have hidden traps that catch robots.
- **Restaurant panel links** are signed, expire, and a new link cancels all older ones.
- **Admin actions** are written to Admin → Activity, which nobody can edit.
- **Personal data**: customers can download or delete theirs; crash notes have emails and phone numbers removed;
  old records are deleted on a schedule (`supabase/migrations/0019_cron_jobs.sql`).
- The support phone number is a server-only setting and never appears in a page.

## Please switch these on
- [ ] **Admin 2-step login**: Admin → Security → Turn on. (Needs a free authenticator app.)
- [ ] **Backups**: Supabase → Project Settings → Add-ons / Billing. The free plan has no restorable backups.
- [ ] **Uptime monitor**: see `monitoring.md`.
- [ ] **Email from your own domain**: see `email-setup.md`.
- [ ] **Branch protection** on `main` so broken changes cannot be merged: see `runbook.md`.
- [ ] **Second Supabase project for testing.** Today the live database is also used for development, so a test
      can touch real data. Create a second (free) project, run all migrations there, and point your local
      `.env.local` and Vercel *Preview* environment at it.
- [ ] **Google account of the project** (Supabase, Vercel, GitHub, Gmail): turn on 2-step verification on each.

## Rotating secrets
See "Change a secret" in `runbook.md`.

## Reporting a problem
Anyone who finds a security issue can write to the support email. We acknowledge within 48 hours.
