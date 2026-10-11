import type { Metadata } from "next";
import { Banknote, LayoutDashboard, Mail, Store } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import { JoinForm } from "@/components/forms/JoinForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("join.title"), description: t("join.meta_desc") };
}

const POINTS = [
  { icon: Store, title: "join.p1.title", sub: "join.p1.sub" },
  { icon: Mail, title: "join.p2.title", sub: "join.p2.sub" },
  { icon: LayoutDashboard, title: "join.p3.title", sub: "join.p3.sub" },
  { icon: Banknote, title: "join.p4.title", sub: "join.p4.sub" },
] as const;

// Public "Add your restaurant" page: the request goes to the admin for approval.
export default async function JoinPage() {
  const t = await getT();
  return (
    <main className="mx-auto grid w-full max-w-[1280px] flex-1 items-start gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-14 lg:px-12 lg:pb-14 lg:pt-10">
      <section className="flex flex-col gap-5">
        <span className="kicker">{t("join.kicker")}</span>
        <h1 className="font-display text-[38px] leading-[1.05] sm:text-[52px]">{t("join.h1")}</h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-stone-600 sm:text-base">
          {t("join.intro")}
        </p>
        <ul className="grid gap-4 sm:grid-cols-2">
          {POINTS.map(({ icon: Icon, title, sub }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-accent">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold">{t(title)}</span>
                <span className="block text-[13px] text-stone-500">{t(sub)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[22px] bg-surface p-5 shadow-card sm:p-7">
        <h2 className="mb-4 font-display text-[28px] leading-none">{t("join.title")}</h2>
        <JoinForm />
      </section>
    </main>
  );
}
