// The square diet mark used by Indian food apps: green for veg, burnt orange for non-veg,
// amber for egg (v2 colors: veg #15803D, non-veg #C2410C).
export function VegMark({ isVeg, egg = false }: { isVeg: boolean; egg?: boolean }) {
  const kind = isVeg ? "veg" : egg ? "egg" : "nonveg";
  const color = { veg: "#15803D", egg: "#CA8A04", nonveg: "#C2410C" }[kind];
  const label = { veg: "Vegetarian", egg: "Contains egg", nonveg: "Non-vegetarian" }[kind];

  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      style={{ borderColor: color }}
      className="inline-grid size-3.5 shrink-0 place-items-center rounded-[3px] border-[1.5px]"
    >
      <span style={{ backgroundColor: color }} className="size-1.5 rounded-full" />
    </span>
  );
}
