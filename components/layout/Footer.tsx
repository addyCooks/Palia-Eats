import Link from "next/link";
import { Wordmark } from "@/components/layout/Wordmark";
import { Banknote, MessageCircle, Radio, Store } from "lucide-react";

function whatsappChatUrl(): string | null {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  return number.length >= 8 ? `https://wa.me/${number}?text=${encodeURIComponent("hi")}` : null;
}

// Four promises, then the footer. The WhatsApp points only show once WhatsApp is switched on.
export function Footer() {
  const whatsapp = whatsappChatUrl();

  const promises = [
    { icon: Banknote, title: "Cash on Delivery", sub: "Pay at your door" },
    { icon: Store, title: "Local restaurants", sub: "All from Palia" },
    { icon: Radio, title: "Live tracking", sub: "Every step, in real time" },
    ...(whatsapp ? [{ icon: MessageCircle, title: "Order on WhatsApp", sub: "No app needed" }] : []),
  ];

  return (
    <footer className="border-t border-border bg-surface pb-28 lg:pb-0">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-12">
        <ul className="grid grid-cols-2 gap-4 border-b border-border py-6 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-[13px] text-stone-500">{sub}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="grid gap-8 py-8 text-sm sm:grid-cols-[1.5fr_1fr_1fr]">
          <div className="flex flex-col gap-3">
            <div className="self-start">
              <Wordmark size="sm" />
            </div>
            <p className="font-display text-lg italic leading-snug text-accent">Made fresh for moments worth savoring.</p>
            <p className="max-w-xs text-stone-600">
              Palia&apos;s own food app. Made in Palia, Uttar Pradesh. Delivered by the restaurants that cook it.
            </p>
          </div>
          <div className="flex flex-col gap-2.5">
            <b>Explore</b>
            <Link href="/#restaurants" className="text-stone-600 hover:text-foreground">
              Restaurants
            </Link>
            <Link href="/orders" className="text-stone-600 hover:text-foreground">
              My orders
            </Link>
            <Link href="/account" className="text-stone-600 hover:text-foreground">
              My account
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <b>Help</b>
            {whatsapp ? (
              <a href={whatsapp} className="text-stone-600 hover:text-foreground">
                Chat with us on WhatsApp
              </a>
            ) : (
              <span className="text-stone-600">Pay cash or UPI on delivery</span>
            )}
            <span className="text-stone-600">Delivered by the restaurant</span>
            <Link href="/join" className="font-semibold text-accent hover:underline">
              Own a restaurant? Join PaliaEats
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
