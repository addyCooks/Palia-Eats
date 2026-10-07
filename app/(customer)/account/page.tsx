import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { AccountCard } from "@/components/account/AccountCard";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "My account" };

const LINKS = [
  { href: "/orders", label: "My orders" },
  { href: "/account/addresses", label: "Saved addresses" },
  { href: "/account/favourites", label: "Favourites" },
] as const;

// Account (v2 6f on phones: dark name card and a list of links; 5e on laptops: the
// account card on the left).
export default async function AccountPage() {
  const profile = await requireUser("/account");
  const user = await getCurrentUser();
  const name = profile.full_name?.trim() || "Your account";

  return (
    <main className="mx-auto grid w-full max-w-[1280px] flex-1 items-start gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-12 lg:pb-14 lg:pt-8">
      <div className="hidden lg:block">
        <AccountCard profile={profile} active="/account" />
      </div>

      <div className="flex flex-col gap-[18px]">
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
        <nav aria-label="Account" className="rounded-[18px] bg-surface p-1.5 shadow-card lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-[54px] items-center gap-3 border-b border-muted px-3.5 text-[15px] font-medium"
            >
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              <span className="flex-1">{link.label}</span>
              <span className="text-accent" aria-hidden>
                ›
              </span>
            </Link>
          ))}
          <form action={logout}>
            <button
              type="submit"
              className="flex h-[54px] w-full items-center gap-3 px-3.5 text-left text-[15px] font-medium text-accent"
            >
              <span className="size-2 rounded-full bg-brand" aria-hidden />
              <span className="flex-1">Log out</span>
              <span aria-hidden>›</span>
            </button>
          </form>
        </nav>

        <h1 className="hidden font-display text-[44px] leading-none lg:block">My details</h1>
        <section className="flex flex-col gap-4 rounded-[22px] bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold lg:hidden">Your details</h2>
          <ProfileForm profile={profile} email={user?.email ?? ""} />
        </section>

        <section className="flex items-center justify-between gap-3 rounded-[18px] bg-surface p-4 shadow-card">
          <span className="text-[15px] font-medium">Light or dark look</span>
          <ThemeToggle />
        </section>
      </div>
    </main>
  );
}
