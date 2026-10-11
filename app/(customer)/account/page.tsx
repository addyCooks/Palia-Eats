import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { getT } from "@/lib/i18n/server";
import { AccountCard } from "@/components/account/AccountCard";
import { DeleteAccountCard } from "@/components/account/DeleteAccountCard";
import { ChangePasswordForm } from "@/components/forms/ChangePasswordForm";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { InstallButton } from "@/components/notifications/InstallButton";
import { PushToggle } from "@/components/notifications/PushToggle";
import { pushEnabled } from "@/lib/push/client-config";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SubmitButton } from "@/components/ui/SubmitButton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.meta_title") };
}

// Account (v2 6f on phones: dark name card and a list of links; 5e on laptops: the
// account card on the left).
export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const t = await getT();
  const profile = await requireUser("/account");
  const user = await getCurrentUser();
  const notice = (await searchParams).notice;
  const name = profile.full_name?.trim() || t("account.default_name");
  // People who signed in only with Google have no password of their own to change.
  const hasPassword = user?.app_metadata?.providers
    ? (user.app_metadata.providers as string[]).includes("email")
    : true;

  const links = [
    { href: "/orders", label: t("account.nav.orders") },
    { href: "/account/addresses", label: t("account.nav.addresses") },
    { href: "/account/favourites", label: t("account.nav.favourites") },
    { href: "/help", label: t("account.nav.help") },
  ];

  return (
    <main className="mx-auto grid w-full max-w-[1280px] flex-1 items-start gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-12 lg:pb-14 lg:pt-8">
      <div className="hidden lg:block">
        <AccountCard profile={profile} active="/account" />
      </div>

      <div className="flex flex-col gap-[18px]">
        {notice === "password" && (
          <p role="status" className="rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-900">
            {t("account.notice.password_set")}
          </p>
        )}

        {/* Phones: dark name card and quick links */}
        <section className="flex items-center gap-3.5 rounded-[22px] bg-[#16120D] p-[22px] text-white lg:hidden dark:bg-[#1F1A14]">
          <span className="grid size-[60px] shrink-0 place-items-center rounded-full bg-brand font-display text-[28px] text-on-brand">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-display text-2xl">{name}</span>
            <span className="text-[13px] text-[#D8D2C8]">{profile.phone ? `+91 ${profile.phone}` : (user?.email ?? "")}</span>
          </span>
        </section>
        <nav aria-label={t("account.nav.label")} className="rounded-[18px] bg-surface p-1.5 shadow-card lg:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-[54px] items-center gap-3 border-b border-muted px-3.5 text-[15px] font-medium"
            >
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              <span className="flex-1">{link.label}</span>
              <span className="-mt-1.5 text-[44px] font-light leading-none text-accent" aria-hidden>
                ›
              </span>
            </Link>
          ))}
          <form action={logout}>
            <SubmitButton
              pendingText={t("account.nav.logging_out")}
              className="flex h-[54px] w-full items-center gap-3 px-3.5 text-left text-[15px] font-medium text-accent"
            >
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              <span className="flex-1">{t("account.nav.logout")}</span>
              <span className="-mt-1.5 text-[44px] font-light leading-none" aria-hidden>›</span>
            </SubmitButton>
          </form>
        </nav>

        <h1 className="hidden font-display text-[44px] leading-none lg:block">{t("account.h1")}</h1>
        <section className="flex flex-col gap-4 rounded-[22px] bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold lg:hidden">{t("account.section.details")}</h2>
          <ProfileForm profile={profile} email={user?.email ?? ""} />
        </section>

        <section className="flex items-center justify-between gap-3 rounded-[18px] bg-surface p-4 shadow-card">
          <span className="text-[15px] font-medium">{t("account.language")}</span>
          <LanguageSwitch />
        </section>

        <section className="flex items-center justify-between gap-3 rounded-[18px] bg-surface p-4 shadow-card">
          <span className="text-[15px] font-medium">{t("account.theme")}</span>
          <ThemeToggle />
        </section>

        {pushEnabled() && (
          <section className="flex flex-col gap-3 rounded-[22px] bg-surface p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-semibold">{t("app.title")}</h2>
            <p className="text-sm text-stone-600">{t("app.intro")}</p>
            <InstallButton />
            <PushToggle />
          </section>
        )}

        <section className="flex flex-col gap-4 rounded-[22px] bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold">{t("account.password.title")}</h2>
          {hasPassword ? (
            <>
              <p className="-mt-2 text-sm text-stone-600">{t("account.password.intro")}</p>
              <ChangePasswordForm />
            </>
          ) : (
            <p className="-mt-2 text-sm text-stone-600">{t("account.password.google_only")}</p>
          )}
        </section>

        <section className="flex flex-col gap-4 rounded-[22px] bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold">{t("account.data.title")}</h2>
          <DeleteAccountCard />
        </section>
      </div>
    </main>
  );
}
