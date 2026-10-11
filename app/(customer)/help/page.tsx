import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Mail, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import type { MessageKey } from "@/lib/i18n/messages";
import { LEGAL } from "@/lib/utils/legal";
import { supportLinks } from "@/lib/utils/support";
import { localHours } from "@/lib/utils/support-text";
import { HelpForm } from "@/components/support/HelpForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("help.meta_title"),
    description: t("help.subtitle"),
  };
}

// The questions people ask most. The wording lives in lib/i18n (help.faq.<name>.q / .a).
const FAQ = [
  { name: "order", q: "help.faq.order.q", a: "help.faq.order.a" },
  { name: "pay", q: "help.faq.pay.q", a: "help.faq.pay.a" },
  { name: "time", q: "help.faq.time.q", a: "help.faq.time.a" },
  { name: "cancel", q: "help.faq.cancel.q", a: "help.faq.cancel.a" },
  { name: "wrong", q: "help.faq.wrong.q", a: "help.faq.wrong.a" },
  { name: "unanswered", q: "help.faq.unanswered.q", a: "help.faq.unanswered.a" },
  { name: "area", q: "help.faq.area.q", a: "help.faq.area.a" },
  { name: "account", q: "help.faq.account.q", a: "help.faq.account.a" },
  { name: "delete", q: "help.faq.delete.q", a: "help.faq.delete.a" },
  { name: "join", q: "help.faq.join.q", a: "help.faq.join.a" },
] as const satisfies readonly { name: string; q: MessageKey; a: MessageKey }[];

export default async function HelpPage({ searchParams }: PageProps<"/help">) {
  const t = await getT();
  const params = await searchParams;
  const orderParam = typeof params.order === "string" && /^\d{4,9}$/.test(params.order) ? params.order : "";

  const user = await getCurrentUser();
  const support = supportLinks();
  const hours = localHours(t, support.hours);

  return (
    <main className="mx-auto flex w-full max-w-[1000px] flex-1 flex-col gap-8 px-4 pb-28 pt-8 sm:px-6 lg:pb-16 lg:pt-12">
      <header className="flex flex-col gap-3">
        <span className="kicker">PaliaEats</span>
        <h1 className="font-display text-[38px] leading-[1.05] sm:text-[48px]">{t("help.title")}</h1>
        <p className="text-[15px] leading-relaxed text-stone-600">{t("help.subtitle")}</p>
      </header>

      <section aria-labelledby="faq-title" className="flex flex-col gap-3">
        <h2 id="faq-title" className="text-xl font-semibold">
          {t("help.faq.title")}
        </h2>
        <div className="flex flex-col gap-2.5">
          {FAQ.map(({ name, q: questionKey, a: answerKey }) => {
            const q = t(questionKey);
            const vars =
              name === "wrong"
                ? { n: LEGAL.reportWithinHours }
                : name === "unanswered"
                  ? { n: LEGAL.autoCancelMinutes }
                  : undefined;
            const a = t(answerKey, vars);
            return (
              <details key={name} className="group rounded-2xl bg-surface p-4 shadow-card open:pb-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold marker:content-none">
                  {q}
                  <ChevronDown className="size-5 shrink-0 text-accent transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-2.5 text-[15px] leading-relaxed text-stone-600">
                  {a}
                  {name === "join" && (
                    <>
                      {" "}
                      <Link href="/join" className="font-semibold text-accent hover:underline">
                        {t("help.faq.join_link")}
                      </Link>
                    </>
                  )}
                  {name === "cancel" && (
                    <>
                      {" "}
                      <Link href="/refunds" className="font-semibold text-accent hover:underline">
                        {t("help.links.refunds")}
                      </Link>
                    </>
                  )}
                </p>
              </details>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="contact-title" className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col gap-3 self-start rounded-[22px] bg-surface p-6 shadow-card">
          <h2 id="contact-title" className="text-xl font-semibold">
            {t("help.contact.title")}
          </h2>
          <p className="text-sm text-stone-600">{t("help.contact.reply", { hours })}</p>
          <div className="flex flex-wrap gap-2.5">
            {support.whatsappHref && (
              <a
                href={support.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-dark"
              >
                <MessageCircle className="size-[18px]" aria-hidden />
                {t("help.contact.whatsapp")}
              </a>
            )}
            <a
              href={support.emailHref}
              className="inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold hover:bg-muted"
            >
              <Mail className="size-[18px]" aria-hidden />
              {t("help.contact.email")}
            </a>
          </div>
          <p className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[13px]">
            <Link href="/refunds" className="font-semibold text-accent hover:underline">
              {t("help.links.refunds")}
            </Link>
            <Link href="/terms" className="font-semibold text-accent hover:underline">
              {t("help.links.terms")}
            </Link>
            <Link href="/privacy" className="font-semibold text-accent hover:underline">
              {t("help.links.privacy")}
            </Link>
          </p>
        </div>

        <div id="message" className="flex scroll-mt-24 flex-col gap-4 rounded-[22px] bg-surface p-6 shadow-card">
          <div>
            <h2 className="text-xl font-semibold">{t("help.form.title")}</h2>
            <p className="mt-1 text-sm text-stone-600">{t("help.form.intro")}</p>
          </div>
          <HelpForm signedInEmail={user?.email ?? null} defaultOrder={orderParam} hours={hours} />
        </div>
      </section>
    </main>
  );
}
