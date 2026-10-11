# Runbook: when something goes wrong

Plain steps for the usual problems. "Admin" means the PaliaEats admin area (`/admin`).

## The site is down or very slow
1. Open https://www.paliaeats.online/api/health. `"status":"ok"` means the site and the database are fine.
   `"degraded"` means the database is not answering: check https://status.supabase.com and your Supabase project.
2. If the page itself will not load: check https://www.vercel-status.com and the **Vercel → Deployments** list.
3. If it broke right after a deploy: in Vercel open the **last good deployment** and choose **Promote to
   Production** (instant rollback). Then fix the problem and push again.

## I got a "PaliaEats hit a new problem" email
Open **Admin → Problems**. Each line is one kind of crash, with how many times it happened and where. Open
"Technical details" and send them to whoever fixes the code. Press **Mark fixed** afterwards: if it ever happens
again it reopens by itself and you get a new email.

## Restaurants are not getting order emails
1. **Admin → Settings → Message log** lists every email and WhatsApp message and whether it failed, with the reason.
2. **Admin → Settings → Send a test email to me** tells you if sending works at all (and shows the error if not).
3. Common causes: the email password was changed, Gmail's daily limit was reached (see `email-setup.md`), or the
   restaurant's notification email is wrong (fix it under **Restaurants → Edit**).
4. Meanwhile, restaurants can always see new orders in their panel.

## A customer cannot log in
- They can use **Forgot password?** on the login page. The email comes from the address set in Supabase →
  Authentication → Emails (see `email-setup.md`).
- If reset emails never arrive: check Supabase → Authentication → Logs, and the email limits of your provider.
- To block someone, see the next item.

## Fake orders or fake ratings
**Admin → Ratings** scores every rating for signs of fake orders and lets you remove a rating or block the customer.
**Admin → Customers → open the customer → Block** stops new orders from that account.

## A restaurant lost its panel link
**Admin → Restaurants → open it → Panel link → Create a new link**, and send it to them. This cancels all older
links (including ones in old emails).

## An order is stuck or wrong
Open it under **Admin → Orders**: you can move it along, step back once, assign a rider or cancel it with a reason.
Orders nobody answers are cancelled automatically after 15 minutes (the customer is told).

## A customer asks to delete their data
They can do it themselves: **My account → Your data → Delete my account** (and **Download my data**). Orders stay
for the restaurants' records but lose the name, phone number, address and notes.

## Change the support WhatsApp number
Vercel → Settings → Environment Variables → edit `SUPPORT_PHONE` → redeploy. The number is never written into pages.

## Change a secret (key, password)
- `PANEL_TOKEN_SECRET`: changing it **cancels every restaurant's panel link**. You would have to send new links.
- `SUPABASE_SERVICE_ROLE_KEY` / email password: change it in the provider first, then in Vercel, then redeploy.
- Never put secrets in the code or in a chat. They belong in Vercel's Environment Variables.

## Change the database
1. Save the new SQL as `supabase/migrations/00NN_name.sql` in the project.
2. Open Supabase → SQL Editor, paste it, **Run**.
3. Run `supabase/tests/rls_check.sql`: the last message must be "ALL SECURITY CHECKS PASSED".
4. Then deploy the code that needs it.

## The timers stopped (no reminders, no weekly summary)
In the Supabase SQL Editor run:
`select jobname, schedule, active from cron.job;` (all four jobs should be active) and
`select jobid, status, return_message, start_time from cron.job_run_details order by start_time desc limit 20;`
to see recent runs and errors. A timer calls the site, so a broken site stops them too.

## The admin lost the phone with the 2-step code
Open your Supabase project → Authentication → Users → your account → remove the authenticator (factor). Log in
with the password, then turn 2-step login on again under **Admin → Security**.

## Backups
The database is on Supabase. The free plan keeps no restorable backups, so **upgrade to Pro (it adds daily backups
and, optionally, point-in-time restore) before real money or many customers depend on the data**. In the meantime
export what matters: **Admin → Orders → Download CSV** and **Admin → Customers → Download CSV**. After any restore,
run `rls_check.sql`.

## Make the checks block bad changes
GitHub → the repository → Settings → Branches → add a rule for `main` → "Require status checks to pass" → pick
**check**. Then a change that fails type check, lint, tests or build cannot be merged. (Vercel deploys whatever is
merged, so this keeps the live site safe.)
