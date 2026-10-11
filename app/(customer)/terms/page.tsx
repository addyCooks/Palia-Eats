import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { LEGAL } from "@/lib/utils/legal";
import { supportLinks } from "@/lib/utils/support";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The rules for using PaliaEats: ordering, payment, delivery, cancellations and fair use.",
};

export default function TermsPage() {
  const support = supportLinks();

  return (
    <LegalPage
      current="terms"
      title="Terms of Use"
      intro="By using PaliaEats you agree to these terms. They are written to be read, so please do."
    >
      <h2>1. What PaliaEats is</h2>
      <p>
        PaliaEats is a website that lets you order from restaurants in Palia. <b>Each restaurant</b> cooks your food
        and brings it to you (with its own rider or one arranged by PaliaEats). PaliaEats passes your order to the
        restaurant, shows you its progress and helps if something goes wrong. We don’t cook or sell the food
        ourselves.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You need an account to order. Give true details, especially your phone number and address.</li>
        <li>You are responsible for what happens under your account, so keep your password to yourself.</li>
        <li>One person, one account.</li>
      </ul>

      <h2>3. Prices and your order</h2>
      <ul>
        <li>
          Restaurants set their own prices, minimum order and delivery fee. The total you see at checkout (food plus
          delivery fee) is what you pay.
        </li>
        <li>
          We check prices and availability again when you place the order. If something changed, we tell you before
          anything is sent.
        </li>
        <li>
          Placing an order is a request. It becomes a confirmed order when the restaurant accepts it (you will see it
          move to “Cooking”). If the restaurant doesn’t answer within {LEGAL.autoCancelMinutes} minutes, the order is
          cancelled automatically and we tell you.
        </li>
      </ul>

      <h2>4. Payment</h2>
      <p>
        You pay <b>cash or UPI to the person delivering</b>, when the food arrives. There is no online payment on
        PaliaEats, so we never hold your card or bank details. Please keep the right amount ready.
      </p>

      <h2>5. Delivery</h2>
      <ul>
        <li>Delivery times are estimates. The restaurant decides how long it needs to cook.</li>
        <li>
          Be reachable on the phone number you gave and make sure the address is right. If we can’t reach you or find
          you, the restaurant may cancel the order.
        </li>
        <li>Restaurants may refuse addresses outside their delivery area.</li>
      </ul>

      <h2>6. Cancellations and problems</h2>
      <p>
        Please read our <Link href="/refunds">Cancellations &amp; Refunds</Link> page. In short: ask us to cancel
        before the kitchen starts cooking, and tell us within {LEGAL.reportWithinHours} hours if something is wrong
        with your delivery.
      </p>

      <h2>7. Food safety and allergies</h2>
      <p>
        Restaurants are responsible for the quality, hygiene and safety of their food, and for holding the licences
        the law requires (such as FSSAI). Veg / egg / non-veg marks are set by each restaurant. If you have an
        allergy, tell the restaurant in the note on your order or ask us to check first. We can’t guarantee a dish is
        free of an ingredient.
      </p>

      <h2>8. Ratings</h2>
      <p>
        You can rate an order after it is delivered. Please be honest and polite. Ratings must come from real orders.
        We remove fake or abusive ratings and may block accounts that create them.
      </p>

      <h2>9. Fair use</h2>
      <p>Please don’t:</p>
      <ul>
        <li>place fake orders, or orders you don’t mean to accept;</li>
        <li>rate your own restaurant, or ask others to post false ratings;</li>
        <li>abuse restaurant staff, riders or our team;</li>
        <li>try to break, overload or copy the website, or look at other people’s information.</li>
      </ul>
      <p>
        We may block an account, remove content or refuse orders if these rules are broken. If you think we got it
        wrong, write to us.
      </p>

      <h2>10. Our responsibility</h2>
      <p>
        We work hard to keep PaliaEats running, but we can’t promise it will always be available or error-free. We
        are not responsible for how a restaurant cooks or delivers your food, or for delays that are outside our
        control. Where the law allows, our responsibility for an order is limited to the value of that order. Nothing
        in these terms takes away your rights under the Consumer Protection Act, 2019 or any other law.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may change these terms or the website. When we change the terms we update the date at the top. Using
        PaliaEats after that means you accept the new version.
      </p>

      <h2>12. Law</h2>
      <p>These terms follow Indian law. Courts in Uttar Pradesh, India can decide any dispute.</p>

      <h2>13. Contact</h2>
      <p>
        <b>
          {LEGAL.officerTitle}: {LEGAL.officerName}
        </b>
        , PaliaEats, {LEGAL.place}. Email: <a href={support.emailHref}>{support.email}</a>. We acknowledge a
        complaint within {LEGAL.acknowledgeHours} hours and aim to resolve it within {LEGAL.resolveDays} days. See also
        our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
