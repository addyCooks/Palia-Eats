// Read-only star rating, e.g. ★★★★☆ for 4.
export function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const rounded = Math.round(value);
  return (
    <span
      role="img"
      aria-label={`${value} out of 5 stars`}
      className={`inline-flex gap-0.5 ${size === "sm" ? "text-sm" : "text-xl"} leading-none`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={n <= rounded ? "text-brand" : "text-stone-300"}>
          ★
        </span>
      ))}
    </span>
  );
}
