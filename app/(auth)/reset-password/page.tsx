import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getT } from "@/lib/i18n/server";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("auth.title.reset"), robots: { index: false } };
}

// Opened from the emailed link, which has already logged the person in (see
// app/auth/callback/route.ts). Anyone arriving without that is sent to ask for a new link.
export default async function ResetPasswordPage() {
  const t = await getT();
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <div className="flex flex-col gap-1.5 sm:text-center">
          <h1 className="font-display text-[34px] leading-[1.05]">{t("auth.reset.expired_title")}</h1>
          <p className="text-[15px] text-stone-600">{t("auth.reset.expired_body")}</p>
        </div>
        <Link
          href="/forgot-password"
          className="press flex h-[54px] items-center justify-center rounded-xl bg-brand text-[15px] font-semibold text-on-brand"
        >
          {t("auth.reset.ask_again")}
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1.5 sm:text-center">
        <h1 className="font-display text-[34px] leading-[1.05]">{t("auth.reset.title")}</h1>
        <p className="text-[15px] text-stone-600">{t("auth.reset.subtitle")}</p>
      </div>
      <ResetPasswordForm />
    </>
  );
}
