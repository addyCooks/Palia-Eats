import type { ReactNode } from "react";

// PaliaEats spot illustrations: the plate-and-cloche family from the design system.
// Built from the logo's shapes (plate, cloche, turmeric rim). Colors are fixed brand colors
// on purpose, so they look the same in light and dark mode.

const CHILI = "#C2410C";
const SAFFRON = "#E8590C";
const GOLD = "#F4B942";
const CREAM = "#FFFAF3";
const MAROON = "#7A1F1F";

type IllustrationProps = {
  className?: string;
  // Read out by screen readers. Illustrations are decorative when this is left out.
  label?: string;
};

function Svg({ className, label, children }: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 170 150"
      className={className ?? "h-[150px] w-[170px]"}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}

// A plate seen from a slight angle: an ellipse made by squashing a circle to 42% height.
function Plate({ x, y, size, fill, border }: { x: number; y: number; size: number; fill: string; border?: number }) {
  const r = size / 2;
  return (
    <g transform={`translate(${x} ${y}) scale(1 .42)`}>
      <circle
        cx={r}
        cy={r}
        r={border ? r - border / 2 : r}
        fill={fill}
        stroke={border ? GOLD : undefined}
        strokeWidth={border}
      />
    </g>
  );
}

export function EmptyCartIllustration(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <Plate x={15} y={30} size={140} fill="#FFE9DB" />
      <Plate x={30} y={40} size={110} fill="#fff" border={6} />
      <rect x={6} y={20} width={8} height={70} rx={4} fill={CHILI} />
      <rect x={156} y={20} width={8} height={70} rx={4} fill={CHILI} />
      <rect x={152} y={14} width={16} height={22} rx={7} fill={CHILI} />
      <circle cx={85} cy={115} r={7} fill={SAFFRON} opacity={0.35} />
    </Svg>
  );
}

export function NoInternetIllustration(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <path d="M25 100 A60 60 0 0 1 145 100 Z" fill={CHILI} />
      <circle cx={85} cy={33} r={7} fill={CHILI} />
      <rect x={12} y={100} width={146} height={10} rx={5} fill={GOLD} />
      <rect x={60} y={58} width={50} height={6} rx={3} fill={CREAM} transform="rotate(-35 85 61)" />
      <circle cx={71} cy={67} r={5} fill={CREAM} />
      <circle cx={101} cy={121} r={5} fill={CHILI} opacity={0.3} />
      <circle cx={68} cy={126} r={4} fill={CHILI} opacity={0.2} />
    </Svg>
  );
}

export function OrderDelayedIllustration(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <circle cx={85} cy={75} r={51} fill="#fff" stroke={GOLD} strokeWidth={8} />
      <rect x={81} y={40} width={8} height={40} rx={4} fill={MAROON} />
      <rect x={83} y={74} width={34} height={8} rx={4} fill={CHILI} />
      <circle cx={85} cy={79} r={8} fill={MAROON} />
      <circle cx={144} cy={34} r={18} fill={SAFFRON} />
      <text x={144} y={39} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff" fontFamily="inherit">
        +10
      </text>
    </Svg>
  );
}

export function CancelledIllustration(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <Plate x={20} y={56} size={130} fill="#FDECEC" />
      <Plate x={35} y={62} size={100} fill="#fff" border={6} />
      <circle cx={85} cy={39} r={25} fill="#D63031" />
      <rect x={69} y={36} width={32} height={6} rx={3} fill="#fff" transform="rotate(45 85 39)" />
      <rect x={69} y={36} width={32} height={6} rx={3} fill="#fff" transform="rotate(-45 85 39)" />
    </Svg>
  );
}

export function OutsideAreaIllustration(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <g transform="translate(15 20) scale(1 .6)">
        <circle cx={70} cy={70} r={68.5} fill="none" stroke={SAFFRON} strokeWidth={3} strokeDasharray="9 6" opacity={0.5} />
      </g>
      <g transform="translate(61 22) rotate(-45 24 24)">
        <path d="M24 0 A24 24 0 0 1 48 24 A24 24 0 0 1 24 48 L0 48 L0 24 A24 24 0 0 1 24 0 Z" fill={CHILI} />
      </g>
      <circle cx={85} cy={46} r={8} fill={CREAM} />
      <ellipse cx={85} cy={92} rx={23} ry={6} fill="#1F1B16" opacity={0.12} />
      <circle cx={149} cy={111} r={11} fill={GOLD} />
    </Svg>
  );
}

// The "spilled bowl" for pages that can't be found. Designed for a maroon background.
export function SpilledIllustration(props: IllustrationProps) {
  return (
    <Svg {...props}>
      <path d="M30 40 L140 40 A55 55 0 0 1 30 40 Z" fill={GOLD} transform="rotate(-18 85 67.5)" />
      <rect x={24} y={30} width={120} height={10} rx={5} fill={CREAM} transform="rotate(-18 84 35)" />
      <circle cx={50} cy={114} r={6} fill={CREAM} />
      <circle cx={74.5} cy={122.5} r={4.5} fill={CREAM} opacity={0.7} />
      <circle cx={99.5} cy={115.5} r={3.5} fill={CREAM} opacity={0.5} />
      <circle cx={120.5} cy={126.5} r={2.5} fill={CREAM} opacity={0.4} />
    </Svg>
  );
}

// A plate under a cloche with steam: used in the homepage hero.
export function HeroPlateIllustration(props: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={props.className ?? "h-44 w-56"}
      role={props.label ? "img" : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : true}
      focusable="false"
    >
      <ellipse cx={110} cy={150} rx={92} ry={16} fill="#000" opacity={0.18} />
      <ellipse cx={110} cy={138} rx={96} ry={18} fill="#F6E3CF" />
      <ellipse cx={110} cy={134} rx={96} ry={18} fill="#fff" stroke={GOLD} strokeWidth={6} />
      <path d="M44 132 A66 66 0 0 1 176 132 Z" fill={CHILI} />
      <rect x={38} y={128} width={144} height={9} rx={4.5} fill={GOLD} />
      <circle cx={110} cy={58} r={9} fill={CHILI} />
      <path d="M72 108 A44 44 0 0 1 92 80" fill="none" stroke={CREAM} strokeWidth={6} strokeLinecap="round" opacity={0.7} />
      <path d="M96 40c-8-10 6-16-2-26M120 44c-8-10 6-16-2-26M144 40c-8-10 6-16-2-26" fill="none" stroke={CREAM} strokeWidth={4} strokeLinecap="round" opacity={0.55} />
    </svg>
  );
}

// An illustration with a heading, a sentence and an optional button: the standard way to
// show "nothing here", "no connection", and "can't find that".
export function EmptyState({
  illustration,
  title,
  children,
  action,
  tone = "cream",
  className = "",
}: {
  illustration: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  tone?: "cream" | "maroon";
  className?: string;
}) {
  const maroon = tone === "maroon";
  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-col items-center gap-4 rounded-3xl px-6 py-8 text-center ${
        maroon ? "bg-[#7A1F1F] text-[#FFFAF3]" : "bg-[#FFFAF3] text-[#1F1B16]"
      } ${className}`}
    >
      {illustration}
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-2xl font-bold">{title}</h2>
        {children && (
          <div className={`text-sm leading-relaxed ${maroon ? "text-[#F4D9C4]" : "text-[#6B6258]"}`}>{children}</div>
        )}
      </div>
      {action}
    </div>
  );
}
