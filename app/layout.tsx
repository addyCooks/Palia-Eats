import type { Metadata, Viewport } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { OfflineNotice } from "@/components/OfflineNotice";

// Body text: Plus Jakarta Sans. Headings and the wordmark: Playfair Display (warm, a little
// premium). Both come from the design system.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "PaliaEats",
    template: "%s | PaliaEats",
  },
  description: "Order food online from your favourite local restaurants in Palia.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf3" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1512" },
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
      className={`${jakarta.variable} ${playfair.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <OfflineNotice />
        {children}
      </body>
    </html>
  );
}
