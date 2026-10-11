import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Banknote, Bike, ChefHat, MessageCircle, Radio, ReceiptText, Store, UtensilsCrossed } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { whatsAppChatUrl } from "@/lib/utils/site";
import { supportLinks } from "@/lib/utils/support";
import { localHours } from "@/lib/utils/support-text";
import { Heart } from "@/components/ui/Heart";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("about.meta_title"), description: t("about.meta_desc") };
}

// Public "About PaliaEats" page. Linked only from the footer.
export default async function AboutPage() {
  const t = await getT();
  const whatsapp = whatsAppChatUrl();
  const support = supportLinks();

  const steps = [
    { icon: UtensilsCrossed, title: t("about.step1.title"), text: t("about.step1.text") },
    { icon: ChefHat, title: t("about.step2.title"), text: t("about.step2.text") },
    { icon: Bike, title: t("about.step3.title"), text: t("about.step3.text") },
  ];

  const promises = [
    { icon: Store, title: t("about.p1.title"), text: t("about.p1.text") },
    { icon: Banknote, title: t("about.p2.title"), text: t("about.p2.text") },
    { icon: Radio, title: t("about.p3.title"), text: t("about.p3.text") },
    { icon: ReceiptText, title: t("about.p4.title"), text: t("about.p4.text") },
    ...(whatsapp ? [{ icon: MessageCircle, title: t("about.p5.title"), text: t("about.p5.text") }] : []),
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-14 px-4 pb-28 pt-6 sm:px-6 lg:gap-20 lg:px-12 lg:pb-16 lg:pt-12">
      {/* Hero */}
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
        <div className="flex flex-col gap-5">
          <span className="kicker">{t("about.kicker")}</span>
          <h1 className="font-display text-[42px] leading-[1.03] tracking-[-0.5px] sm:text-[56px] lg:text-[68px]">
            {t("about.h1")}
          </h1>
          <p className="font-display text-2xl italic text-accent sm:text-[28px]">
            {t("about.made_a")} <Heart /> {t("about.made_b")}
          </p>
          <p className="max-w-xl text-pretty text-[16px] leading-[1.7] text-stone-600 sm:text-[17px]">{t("about.intro")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/#restaurants"
              className="flex h-[52px] items-center rounded-[14px] bg-brand px-6 font-bold text-on-brand shadow-saffron hover:bg-brand-dark"
            >
              {t("cart.browse")}
            </Link>
            <Link
              href="/join"
              className="flex h-[52px] items-center rounded-[14px] border-[1.5px] border-border bg-surface px-6 font-semibold hover:bg-muted"
            >
              {t("join.title")}
            </Link>
          </div>
        </div>
        <div className="relative mx-auto grid size-[260px] place-items-center sm:size-[340px] lg:size-[420px]">
          <div className="absolute inset-[6%] rounded-full bg-amber-50" aria-hidden />
          <div className="pe-ring absolute inset-[14%] rounded-full bg-brand/20" aria-hidden />
          <Image
            src="/brand/paliaeats-logo.png"
            alt={t("about.logo_alt")}
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
          <span className="kicker">{t("about.how_kicker")}</span>
          <h2 id="how-title" className="font-display text-[32px] leading-none sm:text-[40px]">
            {t("ord.tagline.pending")}
          </h2>
        </div>
        <ol className="stagger grid gap-4 md:grid-cols-3 lg:gap-6">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <li key={i} className="lift relative flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card">
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
          <span className="kicker">{t("about.why_kicker")}</span>
          <h2 id="promise-title" className="font-display text-[32px] leading-none sm:text-[40px]">
            {t("about.why_title")}
          </h2>
        </div>
        <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }, i) => (
            <li key={i} className="flex items-start gap-3.5 rounded-[18px] bg-surface p-5 shadow-card">
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
        <p className="mx-auto max-w-3xl font-display text-[34px] leading-[1.1] sm:text-[48px]">{t("about.band1")}</p>
        <p className="mt-4 text-[15px] text-[#D8D2C8]">{t("about.band2")}</p>
      </section>

      {/* For restaurants + help */}
      <section className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card sm:p-8">
          <span className="kicker">{t("join.kicker")}</span>
          <h2 className="font-display text-[28px] leading-tight">{t("about.rest_title")}</h2>
          <p className="text-[15px] leading-relaxed text-stone-600">{t("about.rest_text")}</p>
          <Link href="/join" className="mt-1 self-start font-semibold text-accent hover:underline">
            {t("about.rest_link")}
          </Link>
        </div>
        <div className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card sm:p-8">
          <span className="kicker">{t("about.help_kicker")}</span>
          <h2 className="font-display text-[28px] leading-tight">{t("about.help_title")}</h2>
          <p className="text-[15px] leading-relaxed text-stone-600">
            {t("about.help_text", { hours: localHours(t, support.hours) })}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/orders" className="font-semibold text-accent hover:underline">
              {t("about.help_orders")}
            </Link>
            {support.whatsappHref && (
              <a href={support.whatsappHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent hover:underline">
                {t("about.help_whatsapp")}
              </a>
            )}
            <a href={support.emailHref} className="font-semibold text-accent hover:underline">
              {t("about.help_email", { email: support.email })}
            </a>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="flex flex-col items-center gap-4 text-center">
        <h2 className="font-display text-[36px] leading-none sm:text-[48px]">{t("cart.empty_title")}</h2>
        <p className="text-stone-600">
          {t("about.close_made_a")} <Heart /> {t("about.close_made_b")}
        </p>
        <Link
          href="/#restaurants"
          className="flex h-[52px] items-center rounded-[14px] bg-brand px-7 font-bold text-on-brand shadow-saffron hover:bg-brand-dark"
        >
          {t("about.order_now")}
        </Link>
      </section>
    </main>
  );
}
