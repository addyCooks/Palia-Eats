import Link from "next/link";
import type { Profile } from "@/types/app";
import { logout } from "@/lib/actions/auth";

const LINKS = [
  { href: "/orders", label: "My orders" },
  { href: "/account", label: "My details" },
  { href: "/account/addresses", label: "Saved addresses" },
  { href: "/account/favourites", label: "Favourites" },
] as const;

// The account card beside My orders / account pages on laptops (v2 5e) and on top of the
// account page on phones (6f).
export function AccountCard({ profile, active }: { profile: Profile; active: string }) {
  const name = profile.full_name?.trim() || "Your account";
  return (
    <aside className="flex flex-col gap-[18px] rounded-[20px] bg-surface p-6 shadow-card">
      <div className="flex items-center gap-3.5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-amber-100 font-display text-[26px] text-amber-800">
          {name.charAt(0).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-lg font-semibold">{name}</span>
          <span className="text-[13px] text-stone-500">{profile.phone ? `+91 ${profile.phone}` : "Add your phone number"}</span>
        </div>
      </div>
      <nav aria-label="Account" className="flex flex-col gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={link.href === active ? "page" : undefined}
            className={`flex h-11 items-center justify-between rounded-[10px] px-3.5 text-sm font-medium ${
              link.href === active ? "bg-amber-50" : "hover:bg-background"
            }`}
          >
            {link.label}
            <span className="text-accent" aria-hidden>
              ›
            </span>
          </Link>
        ))}
        <form action={logout}>
          <button
            type="submit"
            className="flex h-11 w-full items-center justify-between rounded-[10px] px-3.5 text-sm font-medium text-accent hover:bg-background"
          >
            Log out
            <span aria-hidden>›</span>
          </button>
        </form>
      </nav>
    </aside>
  );
}
