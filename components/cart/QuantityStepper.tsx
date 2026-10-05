"use client";

type QuantityStepperProps = {
  quantity: number;
  onChange: (quantity: number) => void;
  itemName: string;
};

// The  [ − 2 + ]  control used on the menu and in the cart.
export function QuantityStepper({ quantity, onChange, itemName }: QuantityStepperProps) {
  const buttonClass =
    "flex size-9 items-center justify-center text-lg font-semibold text-brand hover:bg-brand/10 disabled:opacity-40";

  return (
    <div className="inline-flex items-center overflow-hidden rounded-xl border border-brand">
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(quantity - 1)}
        aria-label={`Remove one ${itemName}`}
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-semibold" aria-live="polite">
        {quantity}
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
