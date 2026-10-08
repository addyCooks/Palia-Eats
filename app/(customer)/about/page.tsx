import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, Bike, ChefHat, MessageCircle, Radio, ReceiptText, Store, UtensilsCrossed } from "lucide-react";
import { whatsAppChatUrl } from "@/lib/utils/site";
import { Heart } from "@/components/ui/Heart";

export const metadata: Metadata = {
  title: "About",
  description:
    "PaliaEats is Palia's own food app: order from the restaurants of Palia, follow your order live and pay cash or UPI at your door. Made with love in Palia.",
};

const STEPS = [
  {
    icon: UtensilsCrossed,
    title: "Pick your craving",
    text: "Browse Palia's restaurants and their menus, with photos, prices and veg marks. Add what you love to your cart.",
  },
  {
    icon: ChefHat,
    title: "Made fresh for you",
    text: "Your order goes straight to the restaurant's kitchen. They start cooking, and you watch every step live.",
  },
  {
    icon: Bike,
    title: "At your door",
    text: "The restaurant brings it to you, hot and fresh. You pay in cash or by UPI when it arrives.",
  },
];

// Public "About PaliaEats" page. Linked only from the footer.
export default function AboutPage() {
  const whatsapp = whatsAppChatUrl();

  const promises = [
    { icon: Store, title: "Local first", text: "Every restaurant on PaliaEats is right here in Palia." },
    { icon: Banknote, title: "Pay at your door", text: "Cash or UPI when your food arrives. Nothing to pay online." },
    { icon: Radio, title: "Live tracking", text: "Placed, cooking, on the way, delivered: it updates by itself." },
    { icon: ReceiptText, title: "Clear prices", text: "You see the full price, delivery fee included, before you order." },
    ...(whatsapp
      ? [{ icon: MessageCircle, title: "Order on WhatsApp", text: "No app needed: just send us a message." }]
      : []),
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-14 px-4 pb-28 pt-6 sm:px-6 lg:gap-20 lg:px-12 lg:pb-16 lg:pt-12">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
        <div className="flex flex-col gap-5">
          <span className="kicker">About PaliaEats</span>
          <h1 className="font-display text-[42px] leading-[1.03] tracking-[-0.5px] sm:text-[56px] lg:text-[68px]">
            Palia&apos;s own food app
          </h1>
          <p className="font-display text-2xl italic text-accent sm:text-[28px]">
            Made with <Heart /> in Palia
          </p>
          <p className="max-w-xl text-pretty text-[16px] leading-[1.7] text-stone-600 sm:text-[17px]">
            PaliaEats brings the kitchens of Palia to your phone. Pick a dish from a restaurant down the road, the
            restaurant cooks it fresh and brings it to your door, and you pay when it arrives. Good local food, made
            fresh for moments worth savoring, and just a tap away.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#restaurants"
              className="flex h-[52px] items-center rounded-[14px] bg-brand px-6 font-bold text-on-brand shadow-saffron hover:bg-brand-dark"
            >
              Browse restaurants
            </Link>
            <Link
              href="/join"
              className="flex h-[52px] items-center rounded-[14px] border-[1.5px] border-border bg-surface px-6 font-semibold hover:bg-muted"
            >
              Add your restaurant
            </Link>
          </div>
        </div>
        <div className="relative mx-auto grid size-[260px] place-items-center sm:size-[340px] lg:size-[420px]">
          <div className="absolute inset-[6%] rounded-full bg-amber-50" aria-hidden />
          <div className="pe-ring absolute inset-[14%] rounded-full bg-brand/20" aria-hidden />
          <Image
            src="/brand/paliaeats-logo.png"
            alt="The PaliaEats logo: a steaming bowl of curry and rice with a spoon"
            width={440}
            height={440}
            priority
            className="anim-float relative w-[82%] drop-shadow-[0_18px_30px_rgba(120,70,0,.18)]"
          />
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="kicker">How it works</span>
          <h2 id="how-title" className="font-display text-[32px] leading-none sm:text-[40px]">
            Your kind of delicious, coming right up
          </h2>
        </div>
        <ol className="stagger grid gap-4 md:grid-cols-3 lg:gap-6">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="lift relative flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card">
              <span className="absolute right-5 top-4 font-display text-[56px] leading-none text-stone-300" aria-hidden>
                {i + 1}
              </span>
              <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-accent">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-[15px] leading-relaxed text-stone-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Promises */}
      <section aria-labelledby="promise-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <span className="kicker">Why PaliaEats</span>
          <h2 id="promise-title" className="font-display text-[32px] leading-none sm:text-[40px]">
            Small town, big flavour
          </h2>
        </div>
        <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3.5 rounded-[18px] bg-surface p-5 shadow-card">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-0.5 block text-sm leading-relaxed text-stone-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tagline band */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#16120D] px-6 py-12 text-center text-white sm:px-12 lg:py-16 dark:bg-[#1F1A14]">
        <p className="mx-auto max-w-3xl font-display text-[34px] leading-[1.1] sm:text-[48px]">
          Your happy bite is just a tap away.
        </p>
        <p className="mt-4 text-[15px] text-[#D8D2C8]">
          Bringing your little slice of joy to you, one order at a time.
        </p>
      </section>

      {/* For restaurants + help */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card sm:p-8">
          <span className="kicker">For restaurants</span>
          <h2 className="font-display text-[28px] leading-tight">Run a kitchen in Palia?</h2>
          <p className="text-[15px] leading-relaxed text-stone-600">
            Get your own restaurant page, orders straight to your email and your orders panel, and a simple way to
            update your menu, mark dishes sold out and see your sales. No app to install.
          </p>
          <Link href="/join" className="mt-1 self-start font-semibold text-accent hover:underline">
            Add your restaurant →
          </Link>
        </div>
        <div className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card sm:p-8">
          <span className="kicker">Need help?</span>
          <h2 className="font-display text-[28px] leading-tight">We&apos;re right here</h2>
          <p className="text-[15px] leading-relaxed text-stone-600">
            Questions about an order? Open it under My orders to see every step live. If it&apos;s taking longer than
            usual, the restaurant&apos;s phone number shows up right there.
          </p>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/orders" className="font-semibold text-accent hover:underline">
              My orders →
            </Link>
            {whatsapp && (
              <a href={whatsapp} className="font-semibold text-accent hover:underline">
                Chat with us on WhatsApp →
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-display text-[36px] leading-none sm:text-[48px]">Hungry? Let&apos;s fix that.</h2>
        <p className="text-stone-600">
          Made with <Heart /> in Palia, Uttar Pradesh.
        </p>
        <Link
          href="/#restaurants"
          className="flex h-[52px] items-center rounded-[14px] bg-brand px-7 font-bold text-on-brand shadow-saffron hover:bg-brand-dark"
        >
          Order now
        </Link>
      </section>
    </main>
  );
}
