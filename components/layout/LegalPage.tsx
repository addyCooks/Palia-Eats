import type { ReactNode } from "react";
import Link from "next/link";
import { LEGAL } from "@/lib/utils/legal";

// Shared frame for the Privacy, Terms and Refund pages: a readable column, a "last updated"
// line and links to the sibling pages.
export function LegalPage({
  title,
  intro,
  current,
  children,
}: {
  title: string;
  intro: string;
  current: "privacy" | "terms" | "refunds";
  children: ReactNode;
}) {
  const siblings = [
    { key: "privacy", href: "/privacy", label: "Privacy Policy" },
    { key: "terms", href: "/terms", label: "Terms of Use" },
    { key: "refunds", href: "/refunds", label: "Cancellations & Refunds" },
  ] as const;

  return (
    <main className="mx-auto flex w-full max-w-[860px] flex-1 flex-col gap-6 px-4 pb-28 pt-8 sm:px-6 lg:pb-16 lg:pt-12">
      <header className="flex flex-col gap-3">
        <span className="kicker">PaliaEats</span>
        <h1 className="font-display text-[38px] leading-[1.05] sm:text-[48px]">{title}</h1>
        <p className="text-[15px] leading-relaxed text-stone-600">{intro}</p>
        <p className="text-[13px] text-stone-500">Last updated: {LEGAL.updated}</p>
      </header>

      <nav aria-label="Legal pages" className="flex flex-wrap gap-2">
        {siblings.map((page) => (
          <Link
            key={page.key}
            href={page.href}
            aria-current={page.key === current ? "page" : undefined}
            className={`press rounded-full border px-4 py-2 text-[13px] font-semibold ${
              page.key === current ? "border-brand bg-amber-50 text-accent" : "border-border bg-surface hover:bg-muted"
            }`}
          >
            {page.label}
          </Link>
        ))}
      </nav>

      <article className="legal flex flex-col gap-4 rounded-[22px] bg-surface p-5 shadow-card sm:p-8">{children}</article>
    </main>
  );
}
