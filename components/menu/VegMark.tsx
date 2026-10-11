"use client";

import { useT } from "@/lib/i18n/client";

// The square diet mark used by Indian food apps: green for veg, burnt orange for non-veg,
// amber for egg (v2 colors: veg #15803D, non-veg #C2410C).
export function VegMark({ isVeg, egg = false }: { isVeg: boolean; egg?: boolean }) {
  const t = useT();
  const kind = isVeg ? "veg" : egg ? "egg" : "nonveg";
  const color = { veg: "#15803D", egg: "#CA8A04", nonveg: "#C2410C" }[kind];
  const label = { veg: t("veg.label.veg"), egg: t("veg.label.egg"), nonveg: t("veg.label.nonveg") }[kind];

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
