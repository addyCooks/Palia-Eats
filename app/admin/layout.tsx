import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

// Every page under /admin goes through this check. Non-admins are redirected.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/admin" className="font-bold">
            Palia<span className="text-brand">Eats</span>{" "}
            <span className="text-sm font-medium text-stone-500">Admin</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/admin/orders" className="rounded-lg px-3 py-2 hover:bg-muted">
              Orders
            </Link>
            <Link href="/admin/restaurants" className="rounded-lg px-3 py-2 hover:bg-muted">
              Restaurants
            </Link>
            <Link href="/admin/customers" className="rounded-lg px-3 py-2 hover:bg-muted">
              Customers
            </Link>
            <Link href="/admin/notifications" className="rounded-lg px-3 py-2 hover:bg-muted">
              Emails
            </Link>
            <span className="hidden text-stone-500 sm:inline">
              {profile.full_name ?? "Admin"}
            </span>
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
