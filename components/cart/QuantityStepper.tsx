"use client";

type QuantityStepperProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  itemName: string;
  // "solid": filled saffron, as on the menu. "outline": the quieter bordered version
  // used inside the cart (v2: border #ECE7DF, burnt-orange − and +).
  variant?: "solid" | "outline";
  className?: string;
};

// The  [ − 2 + ]  control used on the menu and in the cart.
export function QuantityStepper({
  quantity,
  onChange,
  itemName,
  variant = "outline",
  className = "",
}: QuantityStepperProps) {
  const solid = variant === "solid";
  const buttonClass = solid
    ? "press flex h-full w-9 items-center justify-center text-xl font-semibold text-on-brand hover:bg-black/10"
    : "press flex h-full w-8 items-center justify-center text-lg font-semibold text-accent hover:bg-muted";

  return (
    <div
      className={`inline-flex h-8 items-center justify-between overflow-hidden rounded-lg ${
        solid ? "bg-brand text-on-brand" : "border border-border bg-surface"
      } ${className}`}
    >
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(quantity - 1)}
        aria-label={`Remove one ${itemName}`}
      >
        −
      </button>
      <span className="min-w-6 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {/* Re-mounts on every change, so the number gives a little bump */}
        <span key={quantity} className="anim-bump inline-block">
          {quantity}
        </span>
      </span>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(quantity + 1)}
        aria-label={`Add one more ${itemName}`}
      >
        +
      </button>
    </div>
  );
}
