import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/layout/LegalPage";
import { LEGAL } from "@/lib/utils/legal";
import { supportLinks } from "@/lib/utils/support";

export const metadata: Metadata = {
  title: "Cancellations & Refunds",
  description:
    "How cancelling an order works on PaliaEats, and what we do when something is wrong with a delivery.",
};

export default function RefundsPage() {
  const support = supportLinks();

  return (
    <LegalPage
      current="refunds"
      title="Cancellations & Refunds"
      intro="You pay at your door, so nothing is charged online. Here is what happens when you want to cancel or something goes wrong."
    >
      <h2>1. Nothing is charged online</h2>
      <p>
        You pay in cash or by UPI to the person delivering. If an order is never delivered, you have paid nothing,
        and there is nothing to refund.
      </p>

      <h2>2. Cancelling an order</h2>
      <ul>
        <li>
          <b>Before the kitchen starts cooking</b> (the order still says “Placed”): ask us to cancel and we will, free.
          Open the order under <Link href="/orders">My orders</Link>, tap “Need help with this order?” and tell us.
        </li>
        <li>
          <b>After cooking has started:</b> the restaurant has already begun. Ask us anyway and we will talk to the
          restaurant, but it may not be possible.
        </li>
        <li>
          <b>On the way:</b> we can’t cancel an order that has already left the kitchen.
        </li>
      </ul>

      <h2>3. When the restaurant or PaliaEats cancels</h2>
      <p>
        A restaurant can cancel an order, for example because an item is out of stock, it is closing early, or your
        address is outside its delivery area. You are always shown the reason. If nobody accepts your order within{" "}
        {LEGAL.autoCancelMinutes} minutes it is cancelled automatically. In all these cases you pay nothing.
      </p>

      <h2>4. Something is wrong with your delivery</h2>
      <p>
        Tell us within <b>{LEGAL.reportWithinHours} hours</b> of the delivery if:
      </p>
      <ul>
        <li>an item is missing or you got the wrong item;</li>
        <li>the food arrived spilled, damaged or not fit to eat;</li>
        <li>the order is marked delivered but you never received it.</li>
      </ul>
      <p>
        Open the order, tap “Need help with this order?” and describe what happened. A photo helps. We will talk to
        the restaurant and the rider and put it right. Depending on what happened, that means a replacement, or a
        refund of the amount you paid for the affected items, which we arrange through the restaurant (usually by
        UPI). We aim to settle it within a few working days.
      </p>

      <h2>5. When we can’t refund</h2>
      <ul>
        <li>You gave a wrong address or phone number, or we couldn’t reach you to deliver.</li>
        <li>You refused or didn’t collect an order that was correct.</li>
        <li>You changed your mind after the food was cooked or on its way.</li>
        <li>The problem is taste or preference (“I didn’t like it”), though please tell us, as we pass it on.</li>
      </ul>

      <h2>6. Late orders</h2>
      <p>
        Cooking and delivery times are estimates. If your order is taking too long, open it and tap “Need help with
        this order?”. We will chase the restaurant straight away.
      </p>

      <h2>7. How to reach us</h2>
      <p>
        Use the help button on your order, or email <a href={support.emailHref}>{support.email}</a>. We reply{" "}
        {support.hours}. If you aren’t happy with our answer, you can complain to the {LEGAL.officerTitle} named in
        our <Link href="/terms">Terms of Use</Link>.
      </p>
    </LegalPage>
  );
}
