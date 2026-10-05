import { EMPTY_CART, parseCart, type Cart } from "@/lib/cart/cart";

// Keeps the cart in localStorage and tells React when it changes.
// Used through the useCart() hook (components/cart/useCart.ts).

const STORAGE_KEY = "paliaeats-cart";

const listeners = new Set<() => void>();

// getSnapshot must return the SAME object until the data really changes,
// so we remember the last raw string and the cart parsed from it.
let lastRaw: string | null = null;
let lastCart: Cart = EMPTY_CART;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage blocked (private mode etc.) -> behave as an empty cart
  }
}

export function getCartSnapshot(): Cart {
  const raw = readRaw();
  if (raw !== lastRaw) {
    lastRaw = raw;
    lastCart = parseCart(raw);
  }
  return lastCart;
}

// On the server there is no browser storage: always an empty cart.
export function getServerCartSnapshot(): Cart {
  return EMPTY_CART;
}

export function subscribeToCart(onChange: () => void): () => void {
  listeners.add(onChange);

  // Another browser tab changed the cart.
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveCart(cart: Cart): void {
  try {
    if (cart.items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    }
  } catch {
    // storage full or blocked: ignore, the cart just won't persist
  }
  listeners.forEach((listener) => listener());
}
