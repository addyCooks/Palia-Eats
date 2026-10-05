// The green / red square used in Indian food apps to mark veg and non-veg items.
export function VegMark({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      role="img"
      aria-label={isVeg ? "Vegetarian" : "Non-vegetarian"}
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-sm border-2 ${
        isVeg ? "border-green-600" : "border-red-600"
      }`}
    >
      <span className={`size-2 rounded-full ${isVeg ? "bg-green-600" : "bg-red-600"}`} />
    </span>
  );
}
