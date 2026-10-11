# Sending email from your own domain

PaliaEats sends two kinds of email:

1. **Order and admin emails** (new order to the restaurant, status updates to customers, help requests, crash
   alerts, weekly summaries). Sent by the website through the `SMTP_*` settings in Vercel.
2. **Login emails** (confirm your email, reset your password). Sent by Supabase through **Supabase → Authentication →
   Emails → SMTP Settings**.

Today both go through the personal Gmail account `paliaeats@gmail.com`. That works, but:

- Gmail allows only about **500 emails a day**, then blocks sending.
- Emails from a Gmail address sent by a program are **often put in spam**, and a customer who never receives the
  "confirm your email" or "reset your password" email simply cannot sign up or log in.
- Supabase itself warns: "this SMTP provider is designed for personal rather than transactional email".

The fix is a free transactional email service plus your own domain `paliaeats.online`, so emails come from, say,
`orders@paliaeats.online` and carry proof that you really sent them.

## Steps (about 30 minutes, once)

### 1. Create the account (you do this)
Pick one. Both are free for PaliaEats' size.
- **Brevo** (brevo.com): 300 emails/day free.
- **Resend** (resend.com): 100 emails/day, 3,000/month free.

### 2. Add your domain in that service
In the service, find **Domains** (or **Senders & domains**) and add `paliaeats.online`. It shows a few DNS records
to add: usually one **SPF** record, one or two **DKIM** records and a **verification** record.

### 3. Add the DNS records
The domain's DNS is managed on **Vercel** (the name servers are ns1.vercel-dns.com and ns2.vercel-dns.com).
Either:
- Vercel → your team → **Domains** → `paliaeats.online` → **DNS Records** → **Add**, one row per record, or
- tell Claude the records and it will add them with `vercel dns add paliaeats.online ...`.

Also add a **DMARC** record (it tells receivers what to do with fake emails): type TXT, name `_dmarc`, value
`v=DMARC1; p=none; rua=mailto:paliaeats@gmail.com`

Back in the email service press **Verify**. It can take a few minutes.

### 4. Tell the website
In **Vercel → Settings → Environment Variables** set (then **redeploy**):

| Name | Value |
| --- | --- |
| `SMTP_HOST` | from the service (Brevo: `smtp-relay.brevo.com`, Resend: `smtp.resend.com`) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | from the service (Resend: `resend`) |
| `SMTP_PASS` | the SMTP key/API key the service gives you (keep it secret) |
| `EMAIL_FROM` | `PaliaEats <orders@paliaeats.online>` |
| `EMAIL_REPLY_TO` | `paliaeats@gmail.com` (so replies still reach your Gmail) |

### 5. Tell Supabase (so login emails use it too)
Supabase → **Authentication → Emails → SMTP Settings**: same host, port, username and password; sender email
`auth@paliaeats.online` (or `orders@...`), sender name `PaliaEats`. Save.

### 6. Test
- **Admin → Settings → Send a test email to me.** It should arrive in your inbox, not spam.
- In Gmail open the email → ⋮ → **Show original**: SPF, DKIM and DMARC should all say **PASS**.
- Try **Forgot password?** on the login page with a test account.

## Good to know
- The reset-password email template in Supabase was updated so its link works on any phone or browser. If you
  ever edit it, keep the `{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=recovery` link.
- The code already supports any SMTP service: nothing else needs changing when you switch providers.
