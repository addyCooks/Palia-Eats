import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleOrderEvent } from "@/lib/orders/events";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { REFRESH_CART_CODES, orderErrorMessage } from "@/lib/orders/errors";
import { formatPrice } from "@/lib/utils/format";
import type { OrderStatus } from "@/types/app";
import {
  findRestaurantBySlug,
  getItems,
  getRestaurant,
  listCategories,
  listItems,
  listRestaurants,
  type BotItem,
  type BotRestaurant,
} from "@/lib/whatsapp/catalog";
import { sendWhatsApp, type OutMessage, type SendResult } from "@/lib/whatsapp/client";
import {
  createAddress,
  getLastAddress,
  getOrCreateCustomer,
  setCustomerName,
  type BotCustomer,
} from "@/lib/whatsapp/customers";
import type { Inbound } from "@/lib/whatsapp/inbound";
import { SESSION_IDLE_MS, getSession, saveSessionData } from "@/lib/whatsapp/sessions";

// The WhatsApp ordering bot: browse restaurants and menus, build a cart, check out with
// cash on delivery, and track the order. Orders are placed through the SAME database function
// as the website (place_order_core), so every price, availability, hours and minimum-order
// rule applies exactly the same way.

export type Send = (to: string, message: OutMessage) => Promise<SendResult>;

type Size = "full" | "half";
type CartLine = { id: string; qty: number; variant?: Size }; // no variant = full plate

type State = {
  step: "idle" | "size" | "qty" | "address" | "name" | "confirm";
  restaurantId?: string;
  categoryId?: string;
  itemId?: string;
  variant?: Size; // plate size chosen for itemId
  cart: CartLine[];
  address?: { text?: string; lat?: number; lng?: number; savedId?: string };
};

const MAX_LINES = 20;
const MAX_QTY = 20;
const ROWS_PER_PAGE = 9; // WhatsApp lists hold at most 10 rows; one is kept for "More"

const GREETINGS = ["hi", "hii", "hello", "hey", "hola", "namaste", "start", "menu", "order", "restaurants", "0"];

const text = (body: string): OutMessage => ({ type: "text", body });

function freshState(): State {
  return { step: "idle", cart: [] };
}

function loadState(session: Awaited<ReturnType<typeof getSession>>): State {
  if (!session) return freshState();
  if (Date.now() - new Date(session.updated_at).getTime() > SESSION_IDLE_MS) return freshState();
  const data = session.data as Partial<State>;
  return {
    step: data.step ?? "idle",
    restaurantId: data.restaurantId,
    categoryId: data.categoryId,
    itemId: data.itemId,
    variant: data.variant === "half" ? "half" : data.variant === "full" ? "full" : undefined,
    cart: Array.isArray(data.cart) ? data.cart.filter((l) => l && typeof l.id === "string" && l.qty > 0) : [],
    address: data.address,
  };
}

type Ctx = { to: string; send: Send; customer: BotCustomer; msg: Inbound };

// ------------------------------------------------------------------ list helpers

function pageOf<T>(all: T[], page: number): { slice: T[]; more: number | null } {
  if (all.length <= 10) return { slice: all, more: null };
  const start = Math.max(0, page) * ROWS_PER_PAGE;
  const slice = all.slice(start, start + ROWS_PER_PAGE);
  return { slice, more: start + ROWS_PER_PAGE < all.length ? page + 1 : null };
}

const itemDescription = (item: BotItem) =>
  `${formatPrice(item.price)}${item.half_price !== null ? ` (half ${formatPrice(item.half_price)})` : ""} · ${
    item.is_veg ? "Veg" : item.contains_egg ? "Egg" : "Non-veg"
  }${item.description ? ` · ${item.description}` : ""}`;

const sizeOf = (line: { variant?: Size }): Size => (line.variant === "half" ? "half" : "full");
const plateName = (item: BotItem, size: Size) => (size === "half" ? `${item.name} (Half)` : item.name);
const platePrice = (item: BotItem, size: Size) => (size === "half" ? item.half_price : item.price);

// ------------------------------------------------------------------ messages

async function showRestaurants(ctx: Ctx, state: State, page = 0): Promise<State> {
  const all = await listRestaurants();
  const open = all.filter((r) => r.status.canOrder);

  if (open.length === 0) {
    const closed = all.map((r) => `• ${r.name}: ${r.status.label}`).join("\n");
    await ctx.send(
      ctx.to,
      text(`Welcome to PaliaEats 👋\nNo restaurant is taking orders right now.${closed ? `\n\n${closed}` : ""}\n\nPlease try again a little later.`),
    );
    return { ...state, step: "idle" };
  }

  const { slice, more } = pageOf(open, page);
  const rows = slice.map((r) => ({
    id: `r:${r.id}`,
    title: r.name,
    description: `${r.cuisine_tags.slice(0, 2).join(", ") || r.tagline || "Order now"} · Delivery ${formatPrice(r.delivery_fee)}`,
  }));
  if (more !== null) rows.push({ id: `rp:${more}`, title: "More restaurants…", description: "" });

  await ctx.send(ctx.to, {
    type: "list",
    header: "PaliaEats",
    body: "Welcome 👋 Pick a restaurant to order from. You pay cash on delivery.",
    buttonLabel: "Choose restaurant",
    rows,
  });
  return { ...state, step: "idle" };
}

async function showCategories(ctx: Ctx, state: State, page = 0): Promise<State> {
  const restaurant = state.restaurantId ? await getRestaurant(state.restaurantId) : null;
  if (!restaurant) return showRestaurants(ctx, { ...state, restaurantId: undefined });
  if (!restaurant.status.canOrder) return closedNotice(ctx, state, restaurant);

  const categories = await listCategories(restaurant.id);
  if (categories.length === 0) {
    await ctx.send(ctx.to, text(`${restaurant.name} has no dishes available right now. Send *menu* to pick another restaurant.`));
    return { ...state, step: "idle", restaurantId: undefined, cart: [] };
  }
  if (categories.length === 1) return showItems(ctx, state, categories[0].id, 0);

  const { slice, more } = pageOf(categories, page);
  const rows = slice.map((c) => ({ id: `c:${c.id}`, title: c.name, description: "" }));
  if (more !== null) rows.push({ id: `cp:${more}`, title: "More…", description: "" });

  await ctx.send(ctx.to, {
    type: "list",
    header: restaurant.name,
    body: `Delivery ${formatPrice(restaurant.delivery_fee)}${restaurant.min_order_amount > 0 ? ` · Minimum order ${formatPrice(restaurant.min_order_amount)}` : ""}\nWhat would you like?`,
    buttonLabel: "See menu",
    rows,
  });
  return { ...state, step: "idle" };
}

async function showItems(ctx: Ctx, state: State, categoryId: string, page: number): Promise<State> {
  if (!state.restaurantId) return showRestaurants(ctx, state);
  const [restaurant, categories, items] = await Promise.all([
    getRestaurant(state.restaurantId),
    listCategories(state.restaurantId),
    listItems(state.restaurantId, categoryId),
  ]);
  const category = categories.find((c) => c.id === categoryId);
  if (!restaurant || !category || items.length === 0) return showCategories(ctx, { ...state, categoryId: undefined });

  const { slice, more } = pageOf(items, page);
  const rows = slice.map((item) => ({ id: `i:${item.id}`, title: item.name, description: itemDescription(item) }));
  if (more !== null) rows.push({ id: `ip:${more}`, title: "More dishes…", description: "" });

  await ctx.send(ctx.to, {
    type: "list",
    header: `${restaurant.name} · ${category.name}`,
    body: "Tap a dish to add it to your cart.",
    buttonLabel: "Choose a dish",
    rows,
  });
  return { ...state, step: "idle", categoryId };
}

async function closedNotice(ctx: Ctx, state: State, restaurant: BotRestaurant): Promise<State> {
  const why =
    restaurant.status.state === "paused"
      ? `${restaurant.name} isn't taking orders right now.`
      : `${restaurant.name} is closed right now (${restaurant.status.label.replace(/^Closed\s*·?\s*/i, "").trim() || "closed today"}).`;
  await ctx.send(ctx.to, text(`${why} Send *menu* to see who is open.`));
  return { ...state, step: "idle" };
}

// ------------------------------------------------------------------ cart

type Priced = {
  restaurant: BotRestaurant;
  lines: { item: BotItem; qty: number; size: Size; total: number }[];
  subtotal: number;
  fee: number;
  total: number;
  notices: string[];
};

// Prices the cart from the live menu. Dishes that sold out or disappeared are dropped.
async function priceCart(state: State): Promise<Priced | null> {
  if (!state.restaurantId || state.cart.length === 0) return null;
  const restaurant = await getRestaurant(state.restaurantId);
  if (!restaurant) return null;

  const items = await getItems(restaurant.id, state.cart.map((l) => l.id));
  const byId = new Map(items.map((i) => [i.id, i]));
  const notices: string[] = [];
  const lines: Priced["lines"] = [];
  const kept: CartLine[] = [];

  for (const line of state.cart) {
    const item = byId.get(line.id);
    const size = sizeOf(line);
    if (!item || !item.is_available) {
      notices.push(`${item?.name ?? "A dish"} is no longer available, so it was removed.`);
      continue;
    }
    const price = platePrice(item, size);
    if (price === null) {
      notices.push(`${item.name} no longer comes as a half plate, so it was removed.`);
      continue;
    }
    kept.push(line);
    lines.push({ item, qty: line.qty, size, total: Math.round(price * line.qty * 100) / 100 });
  }
  state.cart = kept; // mutate: the caller saves the cleaned cart

  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.total, 0) * 100) / 100;
  const fee = restaurant.delivery_fee;
  return { restaurant, lines, subtotal, fee, total: Math.round((subtotal + fee) * 100) / 100, notices };
}

function summaryText(priced: Priced): string {
  const lines = priced.lines.map((l) => `${l.qty} × ${plateName(l.item, l.size)} — ${formatPrice(l.total)}`);
  return (
    `*${priced.restaurant.name}*\n${lines.join("\n")}\n\n` +
    `Items ${formatPrice(priced.subtotal)}\nDelivery ${formatPrice(priced.fee)}\n*Total ${formatPrice(priced.total)}* (cash on delivery)`
  );
}

async function showCart(ctx: Ctx, state: State, intro = ""): Promise<State> {
  const priced = await priceCart(state);
  if (!priced || priced.lines.length === 0) {
    await ctx.send(ctx.to, text(`${intro}${intro ? "\n\n" : ""}Your cart is empty. Send *menu* to start ordering.`));
    return { ...state, step: "idle", cart: [] };
  }
  const notice = priced.notices.length ? `${priced.notices.join("\n")}\n\n` : "";
  const minimum =
    priced.subtotal < priced.restaurant.min_order_amount
      ? `\n\nMinimum order is ${formatPrice(priced.restaurant.min_order_amount)}: add ${formatPrice(priced.restaurant.min_order_amount - priced.subtotal)} more.`
      : "";
  await ctx.send(ctx.to, {
    type: "buttons",
    body: `${intro}${intro ? "\n\n" : ""}${notice}${summaryText(priced)}${minimum}`,
    buttons: [
      { id: "a:checkout", title: "Checkout" },
      { id: "a:menu", title: "Add more" },
      { id: "a:clear", title: "Clear cart" },
    ],
  });
  return { ...state, step: "idle" };
}

// A dish with a half plate: ask "Half or Full?" first.
async function askSize(ctx: Ctx, state: State, itemId: string): Promise<State> {
  if (!state.restaurantId) return showRestaurants(ctx, state);
  const [item] = await getItems(state.restaurantId, [itemId]);
  if (!item || !item.is_available) {
    await ctx.send(ctx.to, text("Sorry, that dish just sold out."));
    return state.categoryId ? showItems(ctx, state, state.categoryId, 0) : showCategories(ctx, state);
  }
  if (item.half_price === null) return askQuantity(ctx, { ...state, variant: "full" }, itemId);
  await ctx.send(ctx.to, {
    type: "buttons",
    body: `${item.name}\nHalf plate or full plate?`,
    buttons: [
      { id: "s:half", title: `Half ${formatPrice(item.half_price)}`.slice(0, 20) },
      { id: "s:full", title: `Full ${formatPrice(item.price)}`.slice(0, 20) },
    ],
  });
  return { ...state, step: "size", itemId, variant: undefined };
}

async function askQuantity(ctx: Ctx, state: State, itemId: string): Promise<State> {
  if (!state.restaurantId) return showRestaurants(ctx, state);
  const [item] = await getItems(state.restaurantId, [itemId]);
  if (!item || !item.is_available) {
    await ctx.send(ctx.to, text("Sorry, that dish just sold out."));
    return state.categoryId ? showItems(ctx, state, state.categoryId, 0) : showCategories(ctx, state);
  }
  const size = sizeOf(state);
  const price = platePrice(item, size) ?? item.price;
  await ctx.send(ctx.to, {
    type: "buttons",
    body: `${plateName(item, size)} — ${formatPrice(price)}\nHow many would you like? Tap a number, or type one (up to ${MAX_QTY}).`,
    buttons: [
      { id: "q:1", title: "1" },
      { id: "q:2", title: "2" },
      { id: "q:3", title: "3" },
    ],
  });
  return { ...state, step: "qty", itemId, variant: size };
}

async function addToCart(ctx: Ctx, state: State, qty: number): Promise<State> {
  if (!state.restaurantId || !state.itemId) return showRestaurants(ctx, state);
  const [item] = await getItems(state.restaurantId, [state.itemId]);
  if (!item || !item.is_available) {
    await ctx.send(ctx.to, text("Sorry, that dish just sold out."));
    return showCategories(ctx, { ...state, itemId: undefined });
  }

  const size = sizeOf(state);
  if (size === "half" && item.half_price === null) {
    await ctx.send(ctx.to, text(`${item.name} doesn't come as a half plate any more.`));
    return askQuantity(ctx, { ...state, variant: "full" }, item.id);
  }
  const cart = state.cart.map((l) => ({ ...l }));
  const line = cart.find((l) => l.id === item.id && sizeOf(l) === size);
  if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
  else if (cart.length >= MAX_LINES) {
    await ctx.send(ctx.to, text(`Your cart is full (${MAX_LINES} different dishes). Send *checkout* to order what's in it.`));
    return { ...state, step: "idle" };
  } else cart.push({ id: item.id, qty, variant: size });

  const next: State = { ...state, step: "idle", itemId: undefined, variant: undefined, cart };
  const priced = await priceCart(next);
  await ctx.send(ctx.to, {
    type: "buttons",
    body: `Added ${qty} × ${plateName(item, size)} ✅\n\n${priced ? summaryText(priced) : ""}`,
    buttons: [
      { id: "a:menu", title: "Add more" },
      { id: "a:cart", title: "View cart" },
      { id: "a:checkout", title: "Checkout" },
    ],
  });
  return next;
}

// ------------------------------------------------------------------ checkout

async function startCheckout(ctx: Ctx, state: State): Promise<State> {
  const priced = await priceCart(state);
  if (!priced || priced.lines.length === 0) return showCart(ctx, state);
  if (!priced.restaurant.status.canOrder) return closedNotice(ctx, state, priced.restaurant);
  if (priced.notices.length > 0) return showCart(ctx, state); // something changed: show it first
  if (priced.subtotal < priced.restaurant.min_order_amount) return showCart(ctx, state);

  const saved = await getLastAddress(ctx.customer.id);
  if (saved) {
    await ctx.send(ctx.to, {
      type: "buttons",
      body: `Deliver to:\n${saved.address_line}\n\nUse this address?`,
      buttons: [
        { id: "ad:use", title: "Use this address" },
        { id: "ad:new", title: "New address" },
      ],
    });
    return { ...state, step: "address", address: { savedId: saved.id } };
  }
  return askNewAddress(ctx, state);
}

async function askNewAddress(ctx: Ctx, state: State): Promise<State> {
  await ctx.send(
    ctx.to,
    text("Please type your full delivery address with a landmark. You can also share your location pin 📍."),
  );
  return { ...state, step: "address", address: {} };
}

async function afterAddress(ctx: Ctx, state: State): Promise<State> {
  if (!ctx.customer.name) {
    await ctx.send(ctx.to, text("What name should the restaurant use for this order?"));
    return { ...state, step: "name" };
  }
  return showConfirm(ctx, state);
}

async function addressLineFor(ctx: Ctx, state: State): Promise<string | null> {
  const address = state.address;
  if (!address) return null;
  if (address.savedId) {
    const { data } = await createAdminClient()
      .from("customer_addresses")
      .select("address_line")
      .eq("id", address.savedId)
      .eq("user_id", ctx.customer.id)
      .maybeSingle();
    return data?.address_line ?? null;
  }
  if (!address.text) return null;
  const pin = address.lat !== undefined && address.lng !== undefined
    ? `\n📍 https://maps.google.com/?q=${address.lat},${address.lng}`
    : "";
  return `${address.text}${pin}`;
}

async function showConfirm(ctx: Ctx, state: State): Promise<State> {
  const priced = await priceCart(state);
  if (!priced || priced.lines.length === 0) return showCart(ctx, state);
  const line = await addressLineFor(ctx, state);
  if (!line) return askNewAddress(ctx, state);

  await ctx.send(ctx.to, {
    type: "buttons",
    body: `${summaryText(priced)}\n\nDeliver to:\n${line}\n\nShall I place this order?`,
    buttons: [
      { id: "o:yes", title: "Place order" },
      { id: "o:addr", title: "Change address" },
      { id: "o:no", title: "Cancel" },
    ],
  });
  return { ...state, step: "confirm" };
}

async function placeOrder(ctx: Ctx, state: State): Promise<State> {
  const priced = await priceCart(state);
  if (!priced || priced.lines.length === 0) return showCart(ctx, state);
  if (priced.notices.length > 0) return showCart(ctx, state);

  const line = await addressLineFor(ctx, state);
  if (!line) return askNewAddress(ctx, state);

  let addressId = state.address?.savedId ?? null;
  if (!addressId) {
    addressId = await createAddress(ctx.customer.id, line, ctx.customer.phone);
    if (!addressId) {
      await ctx.send(ctx.to, text("Sorry, I couldn't save your address. Please try again in a moment."));
      return { ...state, step: "confirm" };
    }
  }

  const { data, error } = await createAdminClient().rpc("place_order_core", {
    p_uid: ctx.customer.id,
    p_channel: "whatsapp",
    p_restaurant_id: priced.restaurant.id,
    p_items: state.cart.map((l) => ({ id: l.id, quantity: l.qty, variant: sizeOf(l) })),
    p_address_id: addressId,
    p_notes: null,
    p_expected_total: priced.total,
  });

  if (error || !data) {
    const code = error?.message ?? "";
    const message = orderErrorMessage(code, error?.details);
    if (REFRESH_CART_CODES.includes(code)) return showCart(ctx, state, message);
    await ctx.send(ctx.to, text(message));
    return { ...state, step: code === "restaurant_closed" || code === "restaurant_paused" ? "idle" : "confirm" };
  }

  const orderId = data as string;
  const { data: order } = await createAdminClient()
    .from("orders")
    .select("order_number, total")
    .eq("id", orderId)
    .maybeSingle();

  await ctx.send(
    ctx.to,
    text(
      `Order #${order?.order_number ?? ""} placed ✅\n${priced.restaurant.name} has received your order.\n\n` +
        `${priced.lines.map((l) => `${l.qty} × ${plateName(l.item, l.size)}`).join("\n")}\n\n` +
        `Total ${formatPrice(Number(order?.total ?? priced.total))}, pay cash on delivery.\n\n` +
        `I'll message you here when it's being cooked, on its way, and delivered. Send *status* any time.`,
    ),
  );

  // Tells the restaurant (email) and keeps the notification log; never throws.
  await handleOrderEvent({ type: "placed", orderId, customerEmail: null });
  return freshState();
}

// ------------------------------------------------------------------ tracking & help

async function showStatus(ctx: Ctx, state: State): Promise<State> {
  const { data: order } = await createAdminClient()
    .from("orders")
    .select("order_number, status, total, rejection_reason, restaurants(name)")
    .eq("customer_id", ctx.customer.id)
    .order("placed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!order) {
    await ctx.send(ctx.to, text("You haven't placed an order yet. Send *menu* to start."));
    return state;
  }
  const restaurant = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;
  const label = ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status;
  const reason = order.status === "cancelled" && order.rejection_reason ? `\nReason: ${order.rejection_reason}` : "";
  await ctx.send(
    ctx.to,
    text(`Order #${order.order_number} from ${restaurant?.name ?? "the restaurant"}: *${label}*${reason}\nTotal ${formatPrice(Number(order.total))}, cash on delivery.`),
  );
  return state;
}

async function showHelp(ctx: Ctx, state: State): Promise<State> {
  await ctx.send(
    ctx.to,
    text(
      "Here's what you can send me:\n" +
        "• *menu* — see restaurants and order\n" +
        "• *cart* — view your cart\n" +
        "• *checkout* — place your order\n" +
        "• *status* — track your latest order\n" +
        "• *clear* — empty your cart\n" +
        "• *stop* — stop WhatsApp updates",
    ),
  );
  return state;
}

// ------------------------------------------------------------------ the router

async function openRestaurant(ctx: Ctx, state: State, restaurant: BotRestaurant | null): Promise<State> {
  if (!restaurant) {
    await ctx.send(ctx.to, text("I couldn't find that restaurant."));
    return showRestaurants(ctx, state);
  }
  if (!restaurant.status.canOrder) return closedNotice(ctx, state, restaurant);

  let next: State = { ...state, step: "idle", restaurantId: restaurant.id, categoryId: undefined };
  if (state.cart.length > 0 && state.restaurantId && state.restaurantId !== restaurant.id) {
    next = { ...next, cart: [] };
    await ctx.send(ctx.to, text("I cleared your previous cart: you can only order from one restaurant at a time."));
  }
  return showCategories(ctx, next);
}

async function handleReply(ctx: Ctx, state: State, id: string): Promise<State> {
  const [kind, value = ""] = [id.slice(0, id.indexOf(":")), id.slice(id.indexOf(":") + 1)];
  const isId = /^[0-9a-f-]{36}$/i.test(value);
  const num = Number(value);

  switch (kind) {
    case "r":
      return isId ? openRestaurant(ctx, state, await getRestaurant(value)) : showRestaurants(ctx, state);
    case "rp":
      return showRestaurants(ctx, state, Number.isInteger(num) ? num : 0);
    case "cp":
      return showCategories(ctx, state, Number.isInteger(num) ? num : 0);
    case "c":
      return isId ? showItems(ctx, state, value, 0) : showCategories(ctx, state);
    case "ip":
      return state.categoryId ? showItems(ctx, state, state.categoryId, Number.isInteger(num) ? num : 0) : showCategories(ctx, state);
    case "i":
      return isId ? askSize(ctx, state, value) : showCategories(ctx, state);
    case "s":
      return (value === "half" || value === "full") && state.step === "size" && state.itemId
        ? askQuantity(ctx, { ...state, variant: value }, state.itemId)
        : showCart(ctx, state);
    case "q":
      return Number.isInteger(num) && num >= 1 && num <= MAX_QTY && state.step === "qty"
        ? addToCart(ctx, state, num)
        : showCart(ctx, state);
    case "a":
      if (value === "menu") return state.restaurantId ? showCategories(ctx, state) : showRestaurants(ctx, state);
      if (value === "cart") return showCart(ctx, state);
      if (value === "checkout") return startCheckout(ctx, state);
      if (value === "clear") {
        await ctx.send(ctx.to, text("Cart cleared. Send *menu* to start again."));
        return { ...freshState() };
      }
      break;
    case "ad":
      if (state.step !== "address") break;
      if (value === "use" && state.address?.savedId) return afterAddress(ctx, state);
      if (value === "new") return askNewAddress(ctx, state);
      break;
    case "o":
      if (value === "yes") {
        if (state.step === "confirm") return placeOrder(ctx, state);
        await ctx.send(ctx.to, text("That order was already placed. Send *status* to check on it."));
        return state;
      }
      if (value === "addr" && state.step === "confirm") return askNewAddress(ctx, state);
      if (value === "no") {
        await ctx.send(ctx.to, text("Okay, I haven't placed anything. Your cart is saved: send *cart* to review it."));
        return { ...state, step: "idle" };
      }
      break;
  }

  await ctx.send(ctx.to, text("That option has expired. Send *menu* to start again."));
  return state;
}

async function handleText(ctx: Ctx, state: State, raw: string): Promise<State> {
  const input = raw.trim();
  const lower = input.toLowerCase().replace(/[.!?]+$/g, "").trim();

  // ---- "order blue-cafe": the link/QR a restaurant shares opens its menu directly
  const direct = lower.match(/^order\s+(?:from\s+)?([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (direct) {
    const found = await findRestaurantBySlug(direct[1]);
    if (found) return openRestaurant(ctx, state, found);
  }

  // ---- commands that work at any time
  if (["restart", "reset"].includes(lower) || (lower === "cancel" && state.step !== "confirm")) {
    return showRestaurants(ctx, freshState());
  }
  if (lower === "help" || lower === "?") return showHelp(ctx, state);
  if (["cart", "view cart", "my cart"].includes(lower)) return showCart(ctx, state);
  if (["clear", "clear cart", "empty cart", "empty"].includes(lower)) {
    await ctx.send(ctx.to, text("Cart cleared. Send *menu* to start again."));
    return freshState();
  }
  if (["status", "track", "orders", "my order", "my orders", "where is my order"].includes(lower)) {
    return showStatus(ctx, state);
  }
  if (["checkout", "pay", "place order"].includes(lower)) return startCheckout(ctx, state);

  // ---- answers to what we just asked
  if (state.step === "size" && state.itemId) {
    if (["half", "half plate", "h"].includes(lower)) return askQuantity(ctx, { ...state, variant: "half" }, state.itemId);
    if (["full", "full plate", "f"].includes(lower)) return askQuantity(ctx, { ...state, variant: "full" }, state.itemId);
    await ctx.send(ctx.to, text("Please tap Half or Full (or send *half* / *full*)."));
    return state;
  }

  if (state.step === "qty") {
    const qty = Number(lower);
    if (Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY) return addToCart(ctx, state, qty);
    await ctx.send(ctx.to, text(`Please send a number from 1 to ${MAX_QTY}.`));
    return state;
  }

  if (state.step === "address") {
    if (input.length < 8) {
      await ctx.send(ctx.to, text("That looks too short. Please send your full address with a landmark."));
      return state;
    }
    const next = { ...state, address: { ...(state.address?.savedId ? {} : state.address), text: input.slice(0, 250) } };
    return afterAddress(ctx, next);
  }

  if (state.step === "name") {
    if (input.length < 2 || input.length > 60 || /[<>@]/.test(input)) {
      await ctx.send(ctx.to, text("Please send just your name, like Rahul."));
      return state;
    }
    await setCustomerName(ctx.customer.id, input);
    ctx.customer.name = input;
    return showConfirm(ctx, state);
  }

  if (state.step === "confirm") {
    if (["yes", "y", "ok", "confirm", "place"].includes(lower)) return placeOrder(ctx, state);
    if (["no", "n", "cancel"].includes(lower)) return handleReply(ctx, state, "o:no");
  }

  // ---- greetings and the menu
  if (lower === "menu" && state.restaurantId) return showCategories(ctx, state);
  if (GREETINGS.includes(lower)) return showRestaurants(ctx, state);

  await ctx.send(
    ctx.to,
    text("Sorry, I didn't get that. Send *menu* to order, *cart* to see your cart, *status* to track an order, or *help*."),
  );
  return state;
}

async function handleLocation(ctx: Ctx, state: State): Promise<State> {
  const location = ctx.msg.location;
  if (state.step !== "address" || !location) {
    await ctx.send(ctx.to, text("Thanks for the location! Send *menu* to start an order."));
    return state;
  }
  const address = {
    ...(state.address?.savedId ? {} : state.address),
    lat: Math.round(location.latitude * 1e6) / 1e6,
    lng: Math.round(location.longitude * 1e6) / 1e6,
  } as NonNullable<State["address"]>;

  if (!address.text) {
    const named = [location.name, location.address].filter(Boolean).join(", ");
    if (named) address.text = named.slice(0, 250);
  }
  if (!address.text) {
    await ctx.send(ctx.to, text("Got your location 📍. Please also type your address or a landmark so the rider can find you."));
    return { ...state, address };
  }
  return afterAddress(ctx, { ...state, address });
}

// Entry point: one incoming WhatsApp message. Never throws.
export async function handleBotMessage(msg: Inbound, send: Send = sendWhatsApp): Promise<void> {
  try {
    const customer = await getOrCreateCustomer(msg.from, msg.profileName);
    if (!customer) {
      await send(msg.from, text("Sorry, PaliaEats delivers only in Palia, India, and takes orders from Indian mobile numbers."));
      return;
    }

    const ctx: Ctx = { to: msg.from, send, customer, msg };
    let state = loadState(await getSession(msg.from));

    try {
      if (msg.kind === "reply" && msg.replyId) state = await handleReply(ctx, state, msg.replyId);
      else if (msg.kind === "location") state = await handleLocation(ctx, state);
      else if (msg.kind === "text" && msg.text) state = await handleText(ctx, state, msg.text);
      else await send(msg.from, text("Sorry, I can only read typed messages, button taps and location pins."));
    } catch (error) {
      console.error("[whatsapp] Bot error:", error instanceof Error ? error.message : error);
      await send(msg.from, text("Sorry, something went wrong on our side. Please send *menu* to start again."));
    }

    await saveSessionData(msg.from, state);
  } catch (error) {
    console.error("[whatsapp] Bot failed:", error instanceof Error ? error.message : error);
  }
}
