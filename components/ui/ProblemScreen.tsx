import type { ReactNode } from "react";

type GlyphTone = "dark" | "warm" | "error" | "saffron";

const TONES: Record<GlyphTone, string> = {
  dark: "bg-[#16120D] text-brand dark:bg-[#2A241C]",
  warm: "bg-amber-100 text-amber-800",
  error: "bg-[#C2410C] text-white",
  saffron: "bg-brand text-on-brand",
};

// The small "plate" picture of the v2 problem screens: white plate, dashed inner ring,
// a glyph tile in the middle and a saffron dot.
export function ProblemPlate({ glyph, tone = "saffron", small = false }: { glyph: ReactNode; tone?: GlyphTone; small?: boolean }) {
  return (
    <div aria-hidden className={`relative shrink-0 ${small ? "size-[88px]" : "size-[200px]"}`}>
      <div className="absolute inset-0 rounded-full bg-surface shadow-[0_20px_40px_rgba(120,70,0,.12)] dark:shadow-none" />
      <div className={`absolute rounded-full border-2 border-dashed border-[#E5DCCB] dark:border-[#3A3228] ${small ? "inset-3" : "inset-[26px]"}`} />
      <div
        className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center font-display ${
          small ? "size-9 rounded-[11px] text-xl" : "size-[76px] rounded-[22px] text-[42px]"
        } ${TONES[tone]}`}
      >
        {glyph}
      </div>
      <span
        className={`absolute rounded-full bg-brand shadow-[0_0_0_6px_#FDE7BC] dark:shadow-[0_0_0_6px_#3A2C14] ${
          small ? "right-1 top-1.5 size-3 shadow-[0_0_0_3px_#FDE7BC]" : "right-3.5 top-[18px] size-[26px]"
        }`}
      />
    </div>
  );
}

// Full problem screen (v2 8e–8h): plate, serif title, short explanation, a saffron action
// and an optional quieter second action.
export function ProblemScreen({
  glyph,
  tone,
  title,
  children,
  action,
  secondary,
}: {
  glyph: ReactNode;
  tone?: GlyphTone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-col items-center gap-[18px] px-2 py-6 text-center">
      <div className="mb-3">
        <ProblemPlate glyph={glyph} tone={tone} />
      </div>
      <h1 className="font-display text-[32px] leading-[1.1]">{title}</h1>
      {children && <div className="text-pretty text-[15px] leading-[1.55] text-stone-600">{children}</div>}
      {action && <div className="mt-2.5 flex w-full flex-col">{action}</div>}
      {secondary && <div className="text-sm font-semibold text-accent">{secondary}</div>}
    </div>
  );
}

// The saffron full-width button used as a problem screen's main action.
export const problemActionClass =
  "flex h-[54px] w-full items-center justify-center rounded-[14px] bg-brand text-base font-bold text-on-brand hover:bg-brand-dark";
