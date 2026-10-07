import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { countPendingApplications } from "@/lib/queries/applications";
import { Sidebar, SidebarWordmark, TopNav } from "@/components/shell/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SubmitButton } from "@/components/ui/SubmitButton";

// Every page under /admin goes through this check. Non-admins are redirected.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireAdmin();
  const waiting = await countPendingApplications();

  const ITEMS = [
    { href: "/admin", label: "Dashboard", match: "exact" as const },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/restaurants", label: "Restaurants" },
    { href: "/admin/requests", label: "Requests", badge: waiting > 0 ? String(waiting) : undefined },
    { href: "/admin/customers", label: "Customers" },
    { href: "/admin/riders", label: "Riders" },
    { href: "/admin/settings", label: "Settings", also: ["/admin/notifications"] },
  ];

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <Sidebar
        kicker="PALIA · ADMIN"
        homeHref="/admin"
        items={ITEMS}
        footer={
          <div className="flex flex-col gap-2 rounded-[14px] bg-[#2A241C] p-3.5 text-[13px]">
            <span className="truncate font-semibold text-white">{profile.full_name ?? "Admin"}</span>
            <div className="flex items-center justify-between gap-2">
              <form action={logout}>
                <SubmitButton pendingText="Logging out…" className="text-[#D8D2C8] hover:text-white hover:underline">
                  Log out
                </SubmitButton>
              </form>
              <ThemeToggle className="text-[#D8D2C8] hover:bg-white/10" />
            </div>
          </div>
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-chrome text-white lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-4">
            <SidebarWordmark kicker="PALIA · ADMIN" href="/admin" />
            <div className="flex items-center gap-1">
              <ThemeToggle className="text-white hover:bg-white/10" />
              <form action={logout}>
                <SubmitButton pendingText="Logging out…" className="h-9 rounded-lg px-3 text-sm text-[#D8D2C8] hover:bg-white/10">
                  Log out
                </SubmitButton>
              </form>
            </div>
          </div>
          <div className="px-4">
            <TopNav items={ITEMS} />
          </div>
        </header>
        <main className="flex w-full flex-1 flex-col gap-5 px-4 py-6 lg:gap-6 lg:px-8 lg:py-7">{children}</main>
      </div>
    </div>
  );
}
