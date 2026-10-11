import Link from "next/link";
import { Wordmark } from "@/components/layout/Wordmark";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { Banknote, MessageCircle, Radio, Store } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { whatsAppChatUrl } from "@/lib/utils/site";
import { supportLinks } from "@/lib/utils/support";
import { localHours } from "@/lib/utils/support-text";
import { Heart } from "@/components/ui/Heart";

// Four promises, then the footer. The WhatsApp points only show once WhatsApp is switched on.
export async function Footer() {
  const t = await getT();
  const whatsapp = whatsAppChatUrl();
  const support = supportLinks();

  const promises = [
    { icon: Banknote, title: t("footer.promise.cod.title"), sub: t("footer.promise.cod.sub") },
    { icon: Store, title: t("footer.promise.local.title"), sub: t("footer.promise.local.sub") },
    { icon: Radio, title: t("footer.promise.live.title"), sub: t("footer.promise.live.sub") },
    ...(whatsapp
      ? [{ icon: MessageCircle, title: t("footer.promise.whatsapp.title"), sub: t("footer.promise.whatsapp.sub") }]
      : []),
  ];

  const link = "text-stone-600 hover:text-foreground";

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
            <p className="font-display text-lg italic leading-snug text-accent">{t("footer.tagline")}</p>
            <p className="max-w-xs text-stone-600">{t("footer.blurb")}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <b>{t("footer.explore")}</b>
            <Link href="/#restaurants" className={link}>
              {t("footer.restaurants")}
            </Link>
            <Link href="/about" className={link}>
              {t("footer.about")}
            </Link>
            <Link href="/orders" className={link}>
              {t("footer.my_orders")}
            </Link>
            <Link href="/account" className={link}>
              {t("footer.my_account")}
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <b>{t("footer.help")}</b>
            <Link href="/help" className={link}>
              {t("footer.help_center")}
            </Link>
            {support.whatsappHref && (
              <a href={support.whatsappHref} target="_blank" rel="noopener noreferrer" className={link}>
                {t("footer.whatsapp")}
              </a>
            )}
            <a href={support.emailHref} className={link}>
              {t("footer.email", { email: support.email })}
            </a>
            <span className="text-[13px] text-stone-500">
              {t("footer.reply_hours", { hours: localHours(t, support.hours) })}
            </span>
            <span className="text-stone-600">{t("footer.cod_line")}</span>
            <span className="text-stone-600">{t("footer.delivered_by")}</span>
            <Link href="/join" className="font-semibold text-accent hover:underline">
              {t("footer.join")}
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-border py-5 text-[13px] text-stone-500 sm:flex-row">
          <Link href="/about" className="hover:text-foreground hover:underline">
            {t("footer.made_before")} <Heart /> {t("footer.made_after")}
          </Link>
          <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              {t("footer.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-foreground hover:underline">
              {t("footer.terms")}
            </Link>
            <Link href="/refunds" className="hover:text-foreground hover:underline">
              {t("footer.refunds")}
            </Link>
            <LanguageSwitch variant="text" className="text-[13px]" />
          </nav>
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
        </div>
      </div>
    </footer>
  );
}
