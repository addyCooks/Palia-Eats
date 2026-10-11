import { NextResponse } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { allow } from "@/lib/utils/rate-limit";

// "Download my data" (Account -> Your data): everything PaliaEats holds about the signed-in
// customer, as one file. Row Level Security means the queries below can only ever return this
// person's own rows.
export const dynamic = "force-dynamic";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function GET() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile() : null;
  if (!user || !profile) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  if (!(await allow(`export:${user.id}`, 6, 3600))) {
    return NextResponse.json({ error: "Too many downloads. Please try again later." }, { status: 429 });
  }

  const supabase = await createClient();
  const [addresses, orders, favRestaurants, favDishes, help, devices] = await Promise.all([
    supabase.from("customer_addresses").select("*").order("created_at"),
    supabase
      .from("orders")
      .select(
        "order_number, placed_at, status, channel, customer_name, customer_phone, delivery_address, customer_notes, subtotal, delivery_fee, total, payment_method, rejection_reason, cancelled_by, restaurants(name), order_items(item_name, quantity, unit_price, line_total), order_status_events(status, at), order_ratings(stars, comment, created_at)",
      )
      .order("placed_at", { ascending: false })
      .limit(5000),
    supabase.from("favourite_restaurants").select("created_at, restaurants(name)"),
    supabase.from("favourite_dishes").select("created_at, menu_items(name)"),
    supabase.from("support_requests").select("created_at, topic, message, status").order("created_at"),
    supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
  ]);

  const data = {
    about: "Everything PaliaEats holds about you, exported on request.",
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email ?? null,
      name: profile.full_name,
      phone: profile.phone,
      whatsappUpdates: profile.whatsapp_opt_in,
      joined: user.created_at,
    },
    addresses: (addresses.data ?? []).map((address) => ({
      label: address.label,
      address: address.address_line,
      landmark: address.landmark,
      phone: address.phone,
      isDefault: address.is_default,
      latitude: address.latitude ?? null,
      longitude: address.longitude ?? null,
    })),
    orders: (orders.data ?? []).map((order) => ({
      orderNumber: order.order_number,
      placedAt: order.placed_at,
      status: order.status,
      restaurant: one(order.restaurants as { name: string } | { name: string }[] | null)?.name ?? null,
      items: order.order_items,
      subtotal: order.subtotal,
      deliveryFee: order.delivery_fee,
      total: order.total,
      payment: order.payment_method,
      deliveredTo: { name: order.customer_name, phone: order.customer_phone, address: order.delivery_address },
      note: order.customer_notes,
      cancelledBy: order.cancelled_by,
      cancelReason: order.rejection_reason,
      statusHistory: order.order_status_events,
      rating: one(order.order_ratings as unknown as { stars: number; comment: string | null; created_at: string }[] | null),
    })),
    favourites: {
      restaurants: (favRestaurants.data ?? []).map((row) => one(row.restaurants as { name: string } | { name: string }[] | null)?.name),
      dishes: (favDishes.data ?? []).map((row) => one(row.menu_items as { name: string } | { name: string }[] | null)?.name),
    },
    helpRequests: help.data ?? [],
    phonesWithNotificationsOn: devices.count ?? 0,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="paliaeats-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
