// "Add" for a new dish: a little picture of it swirls up from the button into the cart,
// and the cart gives one small wiggle. Runs in the browser only; anything missing
// (no cart on screen, reduced motion) just skips the flight.

const SIZE = 56;
const DURATION = 1150;
const STEPS = 40;

// The cart icons on the page that a dish can fly into. The one nearest the top of the
// screen wins (header cart on laptops, cover / menu-bar cart on a restaurant page),
// falling back to the cart tab or cart bar at the bottom.
function findCart(): HTMLElement | null {
  const visible = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")]
    .map((element) => ({ element, rect: element.getBoundingClientRect() }))
    .filter(
      ({ rect }) =>
        rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth,
    )
    .sort((a, b) => a.rect.top - b.rect.top);
  return visible[0]?.element ?? null;
}

export function shakeCart(target: HTMLElement) {
  target.classList.remove("pe-cart-shake");
  void target.offsetWidth; // restart the animation if it is already running
  target.classList.add("pe-cart-shake");
  window.setTimeout(() => target.classList.remove("pe-cart-shake"), 700);
}

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function flyToCart(from: Element | null | undefined, imageSrc?: string | null) {
  if (typeof window === "undefined" || !from) return;
  const start = from.getBoundingClientRect();
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Two frames, so a cart that appears with the first dish (the cart bar) is in place.
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const target = findCart();
      if (!target) return;
      if (reduce || typeof document.body.animate !== "function") {
        shakeCart(target);
        return;
      }

      const end = target.getBoundingClientRect();
      const sx = start.left + start.width / 2;
      const sy = start.top + start.height / 2;
      const ex = end.left + end.width / 2;
      const ey = end.top + end.height / 2;
      // The arc bends up and to the side, then sweeps into the cart.
      const cx = (sx + ex) / 2 + (sx < ex ? -70 : 70);
      const cy = Math.max(Math.min(sy, ey) - 110, 36);

      const flyer = document.createElement("div");
      flyer.setAttribute("aria-hidden", "true");
      Object.assign(flyer.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: `${SIZE}px`,
        height: `${SIZE}px`,
        borderRadius: "9999px",
        overflow: "hidden",
        zIndex: "9999",
        pointerEvents: "none",
        background: "var(--brand)",
        boxShadow: "0 12px 26px rgba(0,0,0,.3), 0 0 0 3px #fff",
        display: "grid",
        placeItems: "center",
        font: "700 15px var(--font-outfit), system-ui, sans-serif",
        color: "#1A1206",
        willChange: "transform, opacity",
      } satisfies Partial<CSSStyleDeclaration>);
      if (imageSrc) {
        const img = document.createElement("img");
        img.src = imageSrc;
        img.alt = "";
        Object.assign(img.style, { width: "100%", height: "100%", objectFit: "cover" });
        flyer.appendChild(img);
      } else {
        flyer.textContent = "+1";
      }
      document.body.appendChild(flyer);

      const frames: Keyframe[] = [];
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const u = easeInOut(t);
        // Point on the arc...
        const bx = (1 - u) ** 2 * sx + 2 * (1 - u) * u * cx + u ** 2 * ex;
        const by = (1 - u) ** 2 * sy + 2 * (1 - u) * u * cy + u ** 2 * ey;
        // ...plus a loop around it that grows and then closes up: the swirl.
        const radius = 44 * Math.sin(Math.PI * t);
        const angle = 2 * Math.PI * 1.25 * t;
        const x = bx + radius * Math.sin(angle);
        const y = by - radius * (1 - Math.cos(angle)) * 0.6;
        const scale = t < 0.18 ? 1 + 0.3 * (t / 0.18) : 1.3 - 1.02 * ((t - 0.18) / 0.82);
        frames.push({
          transform: `translate(${x - SIZE / 2}px, ${y - SIZE / 2}px) rotate(${Math.round(560 * u)}deg) scale(${scale.toFixed(3)})`,
          opacity: t > 0.88 ? 1 - ((t - 0.88) / 0.12) * 0.5 : 1,
        });
      }

      let landed = false;
      const land = () => {
        if (landed) return;
        landed = true;
        flyer.remove();
        shakeCart(target);
      };
      const flight = flyer.animate(frames, { duration: DURATION, easing: "linear", fill: "forwards" });
      flight.onfinish = land;
      flight.oncancel = land;
      // Backup: a tab in the background may never report "finished".
      window.setTimeout(land, DURATION + 400);
    }),
  );
}
