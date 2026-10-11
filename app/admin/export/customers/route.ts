import { requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/admin/audit";
import { getAdminCustomers } from "@/lib/queries/admin";
import { toCsv } from "@/lib/utils/csv";
import { istDateKey } from "@/lib/utils/time";

// Admin -> Customers -> Download CSV: every customer account with their order count and what they
// spent. Admins only; every download is written to Activity.
export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  const { customers } = await getAdminCustomers({ filter: "all", search: "", page: 1, everyone: true });

  const csv = toCsv(
    ["Name", "Email", "Phone", "WhatsApp number", "Role", "Joined", "Orders", "Spent (not counting cancelled)", "Last order", "Blocked"],
    customers.map((customer) => [
      customer.full_name ?? "",
      customer.email ?? "",
      customer.phone ?? "",
      customer.whatsapp_phone ?? "",
      customer.role,
      customer.created_at ? istDateKey(customer.created_at) : "",
      customer.orderCount,
      customer.spent,
      customer.lastOrderAt ? istDateKey(customer.lastOrderAt) : "",
      customer.is_blocked ? "yes" : "",
    ]),
  );

  await logAdminAction(admin, {
    action: "export.customers",
    summary: `Downloaded the customer list (${customers.length} people)`,
    details: { count: customers.length },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="paliaeats-customers-${istDateKey(new Date().toISOString())}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
