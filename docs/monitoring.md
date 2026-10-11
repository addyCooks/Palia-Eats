# Knowing when something is wrong

Three layers, from "the whole site is down" to "one button crashed for someone".

## 1. Is the site up? (an uptime monitor, free)
The website answers `https://www.paliaeats.online/api/health` with `200` when the site **and** the database are
fine, and `503` when the database does not answer. A free monitor can check it every few minutes and message you.

**Set up UptimeRobot (about 3 minutes, you do this):**
1. Create a free account at uptimerobot.com.
2. **Add New Monitor** → type **HTTP(s)** → URL `https://www.paliaeats.online/api/health` → interval **5 minutes**.
3. Under **Alert contacts** add your email (and the app on your phone, if you like).
4. Optional: a second monitor of type **Keyword** on `https://www.paliaeats.online/` looking for the word `PaliaEats`.

## 2. Did something crash? (built in)
Every crash, on the server or in a visitor's browser, is saved in **Admin → Problems**, grouped, with a count.
A **new** kind of crash also emails `ADMIN_ALERT_EMAIL` (default: the support email), at most 8 emails an hour.
Email addresses and phone numbers are removed from these notes. Old notes are deleted after about 2 months.

## 3. Are the emails and timers working?
- **Admin → Settings → Message log** shows every email/WhatsApp message and any failure, with the reason.
- **Admin → Settings → Send a test email** checks email sending on demand.
- The dashboard shows a red line when messages failed in the last 24 hours.
- Timer problems: see "The timers stopped" in `runbook.md`.

## Numbers
- **Admin dashboard → Where visitors drop off:** how many visits reached each step (visit → opened a restaurant →
  added to cart → reached checkout → ordered). Anonymous: no names, no cookies.
- **Vercel → Analytics** (turned on): visitors, pages, countries and devices, without cookies.
- **Vercel → Speed Insights:** how fast pages feel on real phones.
