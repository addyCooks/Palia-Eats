import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { countRecentNotificationProblems } from "@/lib/queries/admin";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PageHeader, Panel } from "@/components/ui/page";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const [profile, problems] = await Promise.all([requireAdmin(), countRecentNotificationProblems()]);

  const links = [
    {
      href: "/admin/notifications",
      title: "Message log",
      text:
        problems > 0
          ? `${problems} email / WhatsApp ${problems === 1 ? "problem" : "problems"} in the last 24 hours`
          : "Every email and WhatsApp message about orders. No problems in the last 24 hours.",
    },
    { href: "/admin/restaurants/new", title: "Add a restaurant", text: "Create a new partner and send them their panel link." },
    { href: "/admin/riders", title: "Riders", text: "Add riders, mark them on or off duty." },
  ];

  return (
    <>
      <PageHeader title="Settings" sub={`Logged in as ${profile.full_name ?? "Admin"}`} />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Panel title="Tools">
          <ul className="-mt-1 flex flex-col">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between gap-4 border-b border-muted py-3 last:border-b-0 hover:opacity-80"
                >
                  <span className="flex flex-col">
                    <span className="font-semibold">{link.title}</span>
                    <span className="text-sm text-stone-600">{link.text}</span>
                  </span>
                  <span className="text-accent" aria-hidden>
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="This device">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>Light or dark look</span>
            <ThemeToggle />
          </div>
          <form action={logout}>
            <SubmitButton pendingText="Logging out…" className="h-11 rounded-xl bg-deep px-5 text-sm font-semibold text-brand">
              Log out
            </SubmitButton>
          </form>
          <p className="text-xs text-stone-500">
            Payment on PaliaEats is cash or UPI on delivery only, paid straight to the restaurant.
            {/* COMMISSION OFF: Weekly payouts are worked out from delivered orders after each restaurant's commission. */}
          </p>
        </Panel>
      </div>
    </>
  );
}
