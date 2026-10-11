# PaliaEats

Palia's own food ordering website: customers order from the restaurants of Palia (Uttar Pradesh), the
restaurants cook and deliver, and people pay cash or UPI at the door. Live at **https://www.paliaeats.online**.

Restaurants do not have accounts. Each gets a private, signed link by email that opens its orders panel.

## What it does

**Customers** browse restaurants and dishes, order (cash or UPI on delivery), follow the order live, rate it,
save favourites and addresses, get emails (and optionally phone notifications and WhatsApp messages), and can
read the site in English or Hindi. They can download or delete their data and write to support from the Help page.

**Restaurants** (through their panel link) see orders on a live board with a sound alert, move them along,
print a kitchen slip, edit the menu and opening hours, mark dishes sold out, see sales, and get a summary email
every Monday.

**The admin** manages restaurants, menus, riders, customers and orders, approves new restaurants, answers help
requests, checks for fake ratings, watches the "Problems" log and the visit funnel, downloads CSV files, and can
protect the login with 2-step verification.

## Built with

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, login, storage, live
updates, timers) · Vercel (hosting) · Nodemailer (email) · web-push (phone notifications).

## Run it on your computer

```bash
npm install
cp .env.example .env.local      # then fill in the values (see the table below)
npm run dev                     # http://localhost:3000
```

You need a Supabase project: run the files in `supabase/migrations/` in order in the Supabase **SQL Editor**
(0001, 0002, ... then the newest), and `supabase/seed.sql` for sample restaurants (development only!).

| Command | What it does |
| --- | --- |
| `npm run dev` | the site on your computer |
| `npm run build` / `npm start` | the production build, and running it |
| `npm run lint` | style and mistake checks |
| `npm run typecheck` | type check (run `npx next typegen` first after adding a page) |
| `npm test` | the automatic tests in `tests/` |

The same checks run on every push (`.github/workflows/ci.yml`).

## Settings (environment variables)

Set them in `.env.local` on your computer and in **Vercel → Project → Settings → Environment Variables**.
`.env.example` explains each one in more detail.

| Name | Needed | What it is for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | connects the site to Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server-only master key (never in browser code) |
| `NEXT_PUBLIC_SITE_URL` | yes | the site's address, used in emails and links |
| `PANEL_TOKEN_SECRET` | yes | signs restaurant panel links (changing it cancels every link) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` | yes | sending email (see `docs/email-setup.md`) |
| `SUPPORT_PHONE` | optional | support WhatsApp number, kept server-side and never shown |
| `NEXT_PUBLIC_SUPPORT_EMAIL`, `NEXT_PUBLIC_SUPPORT_HOURS` | optional | support email and hours |
| `ADMIN_ALERT_EMAIL`, `EMAIL_REPLY_TO` | optional | where crash alerts go, and where email replies go |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | optional | phone notifications |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | optional | shows "Continue with Google" once Google is set up in Supabase |
| `WHATSAPP_*`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | optional | WhatsApp ordering (see `docs/whatsapp-setup.md`) |
| `CRON_SECRET` | optional | lets you run a timer job by hand |

## Where things are

| Folder | What is in it |
| --- | --- |
| `app/` | pages and routes: `(customer)` the public site, `(auth)` login pages, `admin/`, `panel/` (restaurants), `api/` (timers, health, reports) |
| `components/` | screen pieces, grouped by area (`cart`, `order`, `admin`, `panel`, `support`...) |
| `lib/actions/` | everything that changes data (server actions); each checks who is asking |
| `lib/queries/` | everything that reads data |
| `lib/i18n/` | English (`en.ts`) and Hindi (`hi.ts`) text. Add a line to both |
| `lib/email/`, `lib/push/`, `lib/whatsapp/` | the three ways customers are told about their order |
| `supabase/migrations/` | the database, in order. `supabase/tests/` holds SQL self-tests |
| `tests/` | automatic tests (`npm test`) |
| `docs/` | guides, see below |

## Rules the code follows

- **Row Level Security** protects every table; customers can only touch their own rows. After any database
  change, run `supabase/tests/rls_check.sql` in the SQL Editor: it must end with "ALL SECURITY CHECKS PASSED".
- The **service-role key** is used only on the server (`lib/supabase/admin.ts` imports `server-only`), always after
  checking who is asking: `requireAdmin()` for admin, the signed panel link for restaurants.
- Prices are **re-checked in the database** when an order is placed (`place_order`), never trusted from the browser.
- Admin actions are written to **Admin → Activity**. Crashes land in **Admin → Problems** (and by email).
- Words shown to customers go through `lib/i18n` so they can be translated. Names of restaurants and dishes are data.

## Timers (database jobs)

Three jobs run inside Supabase (pg_cron, see `supabase/migrations/0014` and `0019`) and call the site with a
key stored in the database: every minute they remind or cancel unanswered orders, on Monday morning they send
restaurants their weekly summary, and every night they delete records that are no longer needed.

## Deploying

Pushing to `main` deploys to Vercel automatically. The database is changed by hand: paste the new migration in
the Supabase SQL Editor (do it **before** deploying code that needs it), then run `rls_check.sql`.
The domain's DNS is managed on Vercel.

## More guides

- `docs/runbook.md`: what to do when something goes wrong
- `docs/email-setup.md`: sending email from your own domain
- `docs/monitoring.md`: knowing when the site is down or broken
- `docs/security.md`: the security checklist
- `docs/whatsapp-setup.md`: switching on WhatsApp ordering
