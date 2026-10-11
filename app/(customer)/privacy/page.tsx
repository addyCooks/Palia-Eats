import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { LEGAL } from "@/lib/utils/legal";
import { supportLinks } from "@/lib/utils/support";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What PaliaEats collects, why, who sees it, how long we keep it and how you can see, download or delete your information.",
};

export default function PrivacyPage() {
  const support = supportLinks();

  return (
    <LegalPage
      current="privacy"
      title="Privacy Policy"
      intro="We keep this simple: we collect only what we need to bring you your food, we don’t sell your information, and you can see it, download it or delete it yourself."
    >
      <h2>1. Who we are</h2>
      <p>
        PaliaEats is a food ordering website for restaurants in Palia, Uttar Pradesh, India. In this policy “we”
        and “us” mean PaliaEats. For anything about your information, write to{" "}
        <a href={support.emailHref}>{support.email}</a>.
      </p>

      <h2>2. What we collect</h2>
      <ul>
        <li>
          <b>Your account:</b> your name, email address and (if you give it) mobile number. If you sign in with
          Google, Google tells us your name and email address. We never see your Google password.
        </li>
        <li>
          <b>Your delivery addresses:</b> the address, landmark and phone number you type. If you tap “Use my
          current location”, we also save the map position your phone shares. That is optional; we ask your phone
          for it only when you tap the button.
        </li>
        <li>
          <b>Your orders:</b> what you ordered, from which restaurant, the amount, the delivery address and phone
          number at that time, any note you wrote, the status of the order and your rating.
        </li>
        <li>
          <b>Messages you send us:</b> help requests and what you write in them.
        </li>
        <li>
          <b>Notifications:</b> if you switch on order notifications, a technical address from your phone’s
          browser that lets us send them. If you choose WhatsApp updates, your WhatsApp number.
        </li>
        <li>
          <b>Problems and spam protection:</b> when the website crashes we keep a short technical note, with email
          addresses and phone numbers removed. To stop spam we count how often one connection uses a form, using
          a scrambled version of the connection’s address that cannot be turned back into the real one.
        </li>
        <li>
          <b>Visit counts:</b> we count anonymously how many visits reach each step (home page, a restaurant, the
          cart, checkout). No name, no identifier. Our hosting provider also gives us page-view statistics that
          don’t use cookies or track you across other websites.
        </li>
      </ul>

      <h2>3. Why we use it</h2>
      <ul>
        <li>To take your order, pass it to the restaurant and let you follow it.</li>
        <li>To email or message you about your order (placed, cooking, on the way, delivered, cancelled).</li>
        <li>To help you when something goes wrong, and to protect the service from fake orders and abuse.</li>
        <li>To fix bugs and make the website faster and easier to use.</li>
      </ul>
      <p>We do not sell your information and we do not show advertising.</p>

      <h2>4. Who sees it</h2>
      <ul>
        <li>
          <b>The restaurant you order from</b> sees your name, phone number, delivery address (and map position if
          you shared it) and your note, so it can cook and deliver your order. The rider delivering it sees the same.
        </li>
        <li>
          <b>Companies that help us run PaliaEats</b>, only for that purpose: our database, login and file storage
          provider (Supabase), our website host (Vercel), an email delivery service, and, only if you choose them,
          Google (sign-in), WhatsApp / Meta (order updates) and your browser’s notification service. If you share
          your location, the small map preview is loaded from OpenStreetMap.
        </li>
        <li>
          <b>The authorities</b>, if the law requires us to share something.
        </li>
      </ul>

      <h2>5. Cookies and similar storage</h2>
      <ul>
        <li>A login cookie keeps you signed in. It is needed for the website to work.</li>
        <li>Your cart, your light/dark choice and your language are stored on your own device.</li>
        <li>
          A small note in your browser’s session storage makes sure a visit is counted once. It disappears when you
          close the tab.
        </li>
        <li>Restaurants using their panel get a cookie that keeps their panel open.</li>
      </ul>
      <p>There are no advertising or tracking cookies, so there is no cookie banner to click.</p>

      <h2>6. How long we keep it</h2>
      <ul>
        <li>Your account details and addresses: until you delete your account.</li>
        <li>
          Orders: restaurants need their sales records, so orders stay. When you delete your account they are
          anonymised: your name, phone number, address and notes are wiped from them.
        </li>
        <li>Delivery and email logs: about 6 months. Crash notes: about 2 months. Spam counters: a day.</li>
        <li>Help requests: up to a year after they are closed.</li>
        <li>Anonymous visit counts: up to 2 years.</li>
      </ul>

      <h2>7. Your choices</h2>
      <ul>
        <li>
          <b>See and fix</b> your name, number and addresses under <Link href="/account">My account</Link>.
        </li>
        <li>
          <b>Download</b> a copy of everything we hold about you (a file) from My account → Your data.
        </li>
        <li>
          <b>Delete your account</b> from My account → Your data. This can’t be undone. You can’t delete while an
          order is still on its way.
        </li>
        <li>
          <b>Switch off</b> notifications or WhatsApp updates in My account, or reply STOP to a WhatsApp message.
        </li>
        <li>
          <b>Choose</b> not to share your location: it is always optional.
        </li>
      </ul>

      <h2>8. Keeping it safe</h2>
      <p>
        Connections to PaliaEats are encrypted. Passwords are stored in scrambled form by our login provider and we
        can’t read them. Access to customer information is limited to the people who need it, and the admin area can
        be protected with a second step at login. No system is perfectly safe, so if we ever find that your
        information has been exposed we will tell you.
      </p>

      <h2>9. Children</h2>
      <p>
        PaliaEats is meant for people aged 18 and over. Younger people should order only with a parent’s or
        guardian’s permission.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        If we change this policy we will update the date at the top. For big changes we will also tell you on the
        website.
      </p>

      <h2>11. Questions and complaints</h2>
      <p>
        <b>
          {LEGAL.officerTitle}: {LEGAL.officerName}
        </b>
        , PaliaEats, {LEGAL.place}. Email: <a href={support.emailHref}>{support.email}</a>. We acknowledge a complaint
        within {LEGAL.acknowledgeHours} hours and aim to resolve it within {LEGAL.resolveDays} days.
      </p>
    </LegalPage>
  );
}
