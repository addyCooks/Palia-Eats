// Little animated food scenes (the movement lives in globals.css, "Loader pieces"):
//  pot      a cooking pot with a jiggling lid and rising steam (loading, cooking)
//  scooter  a delivery scooter riding along a moving road (on the way)
// Pure SVG + CSS, so it costs nothing to show and works without JavaScript.

export function CookingPot({ className = "size-28" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 110" className={className} aria-hidden>
      {/* steam */}
      {[34, 58, 82].map((x, i) => (
        <path
          key={x}
          className="pe-steam"
          style={{ animationDelay: `${i * 0.55}s` }}
          d={`M${x} 40 c-6 -6 6 -10 0 -16 c-6 -6 6 -10 0 -16`}
          fill="none"
          stroke="var(--color-stone-300)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
      {/* lid */}
      <g className="pe-lid">
        <ellipse cx="60" cy="50" rx="40" ry="7" fill="var(--deep)" />
        <rect x="54" y="38" width="12" height="9" rx="4" fill="var(--brand)" />
      </g>
      {/* pot */}
      <path d="M22 54 h76 v26 a18 18 0 0 1 -18 18 h-40 a18 18 0 0 1 -18 -18 z" fill="var(--brand)" />
      <rect x="22" y="60" width="76" height="6" fill="var(--brand-dark)" opacity="0.45" />
      <rect x="10" y="60" width="14" height="7" rx="3.5" fill="var(--deep)" />
      <rect x="96" y="60" width="14" height="7" rx="3.5" fill="var(--deep)" />
      {/* flame */}
      <g opacity="0.9">
        <ellipse cx="44" cy="104" rx="6" ry="3" fill="#F97316" className="pe-bubble" style={{ animationDelay: "0.1s" }} />
        <ellipse cx="60" cy="104" rx="7" ry="3.5" fill="#F59E0B" className="pe-bubble" style={{ animationDelay: "0.5s" }} />
        <ellipse cx="76" cy="104" rx="6" ry="3" fill="#F97316" className="pe-bubble" style={{ animationDelay: "0.9s" }} />
      </g>
    </svg>
  );
}

export function DeliveryScooter({ className = "w-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 96" className={className} aria-hidden>
      {/* speed lines */}
      {[34, 46, 58].map((y, i) => (
        <line key={y} className="pe-speed" style={{ animationDelay: `${i * 0.25}s` }} x1="14" y1={y} x2="30" y2={y} stroke="var(--color-stone-300)" strokeWidth="3" strokeLinecap="round" />
      ))}
      {/* road */}
      <line x1="0" y1="86" x2="160" y2="86" stroke="var(--color-stone-300)" strokeWidth="3" strokeLinecap="round" />
      <g className="pe-road">
        {Array.from({ length: 6 }, (_, i) => (
          <line key={i} x1={8 + i * 48} y1="93" x2={28 + i * 48} y2="93" stroke="var(--color-stone-300)" strokeWidth="3" strokeLinecap="round" />
        ))}
      </g>
      <g className="pe-ride">
        {/* food box */}
        <rect x="40" y="26" width="30" height="26" rx="5" fill="var(--brand)" />
        <path d="M46 36 h18" stroke="var(--on-brand)" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        {/* rider */}
        <circle cx="92" cy="20" r="9" fill="var(--deep)" />
        <path d="M84 20 a8 8 0 0 1 16 0" fill="var(--brand)" />
        <path d="M88 30 q4 12 -4 22 h14 l10 -14" fill="none" stroke="var(--deep)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        {/* scooter */}
        <path d="M38 62 h40 q8 0 12 -10 l8 -18 h10" fill="none" stroke="var(--deep)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 64 h56 a10 10 0 0 1 -10 10 h-36 a10 10 0 0 1 -10 -10 z" fill="var(--deep)" />
      </g>
      {/* wheels */}
      <g className="pe-wheel">
        <circle cx="44" cy="76" r="10" fill="var(--surface)" stroke="var(--deep)" strokeWidth="5" />
        <path d="M44 69 v14 M37 76 h14" stroke="var(--deep)" strokeWidth="2" />
      </g>
      <g className="pe-wheel">
        <circle cx="112" cy="76" r="10" fill="var(--surface)" stroke="var(--deep)" strokeWidth="5" />
        <path d="M112 69 v14 M105 76 h14" stroke="var(--deep)" strokeWidth="2" />
      </g>
    </svg>
  );
}

// A plate whose dome lifts to let the steam out ("Enjoy your meal!").
export function ServedPlate({ className = "size-40" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 120" className={className} aria-hidden>
      {[48, 70, 92].map((x, i) => (
        <path
          key={x}
          className="pe-steam"
          style={{ animationDelay: `${0.9 + i * 0.4}s` }}
          d={`M${x} 62 c-6 -6 6 -10 0 -16 c-6 -6 6 -10 0 -16`}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      ))}
      {/* food */}
      <ellipse cx="70" cy="86" rx="34" ry="9" fill="var(--brand)" />
      <circle cx="58" cy="82" r="5" fill="#C2410C" />
      <circle cx="74" cy="80" r="4" fill="#15803D" />
      <circle cx="84" cy="84" r="4.5" fill="#C2410C" />
      {/* plate */}
      <ellipse cx="70" cy="92" rx="56" ry="12" fill="var(--surface)" stroke="var(--color-stone-300)" strokeWidth="3" />
      {/* dome, lifting off */}
      <g className="pe-cloche">
        <path d="M24 84 a46 40 0 0 1 92 0 z" fill="var(--deep)" />
        <rect x="64" y="38" width="12" height="8" rx="4" fill="var(--brand)" />
      </g>
    </svg>
  );
}

// "Cooking up your page" with three pulsing dots.
export function LoadingLine({ label }: { label: string }) {
  return (
    <span className="text-sm font-medium text-stone-500">
      {label}
      <span aria-hidden>
        <span className="pe-dot">.</span>
        <span className="pe-dot">.</span>
        <span className="pe-dot">.</span>
      </span>
    </span>
  );
}
