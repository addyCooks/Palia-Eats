"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import type { ActiveOrderSummary } from "@/lib/queries/orders";
import { LiveUpdates } from "@/components/LiveUpdates";
import { hidesTabBar } from "@/components/layout/BottomTabBar";

// "Your order is Cooking · Blue Cafe · Track": follows the customer around the site until the
// order is delivered. On phones it floats above the tab bar (or takes the tab bar's spot at
// the very bottom on pages without one, like the cart); on laptops it is a strip under the
// header. It updates live as the restaurant moves the order along.
export function ActiveOrderBanner({
  order,
  customerId,
  accessToken,
}: {
  order: ActiveOrderSummary | null;
  customerId: string;
  accessToken: string | null;
}) {
  const pathname = usePathname();
  // Already looking at orders, or busy paying: no need to point at it.
  const hidden = pathname.startsWith("/orders") || pathname.startsWith("/checkout");
  const noTabBar = hidesTabBar(pathname);

  return (
    <>
      {/* The order pages listen for themselves */}
      {!hidden && (
        <LiveUpdates tables={[{ table: "orders", filter: `customer_id=eq.${customerId}` }]} accessToken={accessToken} />
      )}
      {order && !hidden && (
        <div
          className={`fixed inset-x-3.5 z-20 lg:static ${noTabBar ? "bottom-6" : "bottom-[100px]"} lg:mx-auto lg:mt-2 lg:w-full lg:max-w-[1280px] lg:px-12`}
        >
          <Link
            href={`/orders/${order.id}`}
            className="press anim-pop-in flex items-center gap-3 rounded-2xl bg-[#16120D] px-4 py-3 text-white shadow-float dark:bg-[#2A241C]"
          >
            <span className="relative size-2.5 shrink-0 rounded-full bg-brand" aria-hidden>
              <span className="pe-ring absolute inset-0 rounded-full bg-brand" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm">
              <b>Order #{order.order_number} · {ORDER_STATUS_LABELS[order.status]}</b>{" "}
              <span className="text-[#D8D2C8]">· {order.restaurantName}</span>
            </span>
            <span className="shrink-0 text-sm font-bold text-brand">Track →</span>
          </Link>
        </div>
      )}
    </>
  );
}
