import { CookingPot } from "@/components/ui/FoodLoader";

// The short opening screen: the steaming pot, the PaliaEats name and the tagline, about 2.5
// seconds, then it fades away by itself (pure CSS, see ".splash" in globals.css). It is only shown
// once per visit: an inline script in the page head marks the <html> tag when this visit has
// already seen it (or when the page is the admin or the restaurant panel), and the CSS hides it.
// It is decoration only, so screen readers skip it.
export function SplashScreen({ tagline }: { tagline: string }) {
  return (
    <div className="splash" aria-hidden>
      <div className="splash-inner">
        <CookingPot className="splash-pot size-32" />
        <div className="splash-name">
          <span className="text-[11px] font-semibold tracking-[4px] text-accent">PALIA</span>
          <span className="flex items-center gap-1 font-display text-[44px] leading-none">
            Eats
            <span className="size-[11px] rounded-full bg-brand shadow-[0_0_0_4px_#FDE7BC] dark:shadow-[0_0_0_4px_#3A2C14]" />
          </span>
        </div>
        <p className="splash-tagline">{tagline}</p>
        <span className="splash-bar" />
      </div>
    </div>
  );
}
