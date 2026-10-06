"use client";

// The v2 switch: 40 × 22, saffron when on, warm grey when off.
export function Toggle({
  checked,
  onChange,
  disabled,
  label,
  knob = "light",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label: string;
  knob?: "light" | "dark";
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
        checked ? "bg-brand" : "bg-[#D8D2C8] dark:bg-[#4A4136]"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[3px] size-4 rounded-full transition-[left] ${
          checked ? "left-[21px]" : "left-[3px]"
        } ${knob === "dark" && checked ? "bg-[#16120D]" : "bg-white"}`}
      />
    </button>
  );
}

// The same switch for plain HTML forms (posts "on" when checked, like a checkbox).
export function FormToggle({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
}) {
  return (
    <span className="relative inline-flex h-[22px] w-10 shrink-0">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        aria-label={label}
        className="peer absolute inset-0 z-10 cursor-pointer appearance-none rounded-full"
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full bg-[#D8D2C8] transition-colors peer-checked:bg-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40 dark:bg-[#4A4136]"
      />
      <span
        aria-hidden
        className="absolute left-[3px] top-[3px] size-4 rounded-full bg-white transition-[left] peer-checked:left-[21px]"
      />
    </span>
  );
}
