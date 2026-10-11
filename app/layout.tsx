import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Noto_Sans_Devanagari, Noto_Serif_Devanagari, Outfit } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { OfflineNotice } from "@/components/OfflineNotice";
import { NavProgress } from "@/components/ui/NavProgress";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { SkipLink } from "@/components/ui/SkipLink";
import { SplashScreen } from "@/components/ui/SplashScreen";
import { PressFeedback } from "@/components/ui/PressFeedback";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FunnelBeacon } from "@/components/analytics/FunnelBeacon";
import { I18nProvider } from "@/lib/i18n/client";
import { makeT } from "@/lib/i18n/messages";
import { getLang } from "@/lib/i18n/server";

// Design system v2: Outfit for all interface text, DM Serif Display for headings.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

// Hindi letters. Only downloaded when a page actually shows Hindi text (the browser fetches a
// font file only for characters it needs), so English visitors never pay for it.
const devaSans = Noto_Sans_Devanagari({
  variable: "--font-deva",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

const devaSerif = Noto_Serif_Devanagari({
  variable: "--font-deva-serif",
  subsets: ["devanagari"],
  weight: ["400", "600"],
  display: "swap",
  preload: false,
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DESCRIPTION = "Hungry? Let's fix that. Order from Palia's own kitchens: your happy bite is just a tap away.";

export const metadata: Metadata = {
  // Makes the link-preview picture addresses absolute (WhatsApp and Facebook need that).
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PaliaEats",
    template: "%s | PaliaEats",
  },
  description: DESCRIPTION,
  applicationName: "PaliaEats",
  openGraph: {
    type: "website",
    siteName: "PaliaEats",
    locale: "en_IN",
    title: "PaliaEats",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: "PaliaEats", description: DESCRIPTION },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f3" },
    { media: "(prefers-color-scheme: dark)", color: "#14110d" },
  ],
};

// Runs before the page is painted so a saved "dark" or "light" choice never flashes the
// other theme. With no saved choice the phone's own setting is used (see globals.css).
const THEME_SCRIPT = `try{var t=localStorage.getItem("pe-theme");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

// The opening screen is shown once per visit, and never in the admin or the restaurant panel.
const SPLASH_SCRIPT = `try{if(sessionStorage.getItem("pe-splash")||/^[/](admin|panel)/.test(location.pathname)){document.documentElement.setAttribute("data-splash","off")}else{sessionStorage.setItem("pe-splash","1")}}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html
      lang={lang}
      suppressHydrationWarning
      className={`${outfit.variable} ${dmSerif.variable} ${devaSans.variable} ${devaSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <SplashScreen tagline={makeT(lang)("about.band1")} />
        <I18nProvider lang={lang}>
          <SkipLink />
          <Suspense fallback={null}>
            <NavProgress />
            <ScrollToTop />
          </Suspense>
          <PressFeedback />
          <OfflineNotice />
          {children}
          <FunnelBeacon event="visit" />
        </I18nProvider>
        {/* Page views and speed, without cookies or tracking (Vercel) */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
