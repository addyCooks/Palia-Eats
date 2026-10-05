import type { Metadata } from "next";

// The panel is private: keep it out of search engines.
export const metadata: Metadata = {
  title: "Restaurant panel",
  robots: { index: false, follow: false },
};

export default function PanelRootLayout({ children }: LayoutProps<"/panel">) {
  return <div className="flex min-h-full flex-1 flex-col bg-background">{children}</div>;
}
