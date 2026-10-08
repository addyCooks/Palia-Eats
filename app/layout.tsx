import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Outfit } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { OfflineNotice } from "@/components/OfflineNotice";
import { NavProgress } from "@/components/ui/NavProgress";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { PressFeedback } from "@/components/ui/PressFeedback";

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

export const metadata: Metadata = {
  title: {
    default: "PaliaEats",
    template: "%s | PaliaEats",
  },
  description: "Hungry? Let's fix that. Order from Palia's own kitchens: your happy bite is just a tap away.",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${dmSerif.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <NavProgress />
          <ScrollToTop />
        </Suspense>
        <PressFeedback />
        <OfflineNotice />
        {children}
      </body>
    </html>
  );
}
