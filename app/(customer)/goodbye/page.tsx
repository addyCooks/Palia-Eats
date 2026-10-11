import type { Metadata } from "next";
import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

export const metadata: Metadata = { robots: { index: false } };

// Where someone lands right after deleting their account.
export default async function GoodbyePage() {
  const t = await getT();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ProblemScreen
        glyph="✓"
        title={t("goodbye.title")}
        action={
          <Link href="/" className={problemActionClass}>
            {t("goodbye.home")}
          </Link>
        }
      >
        {t("goodbye.body")}
      </ProblemScreen>
    </main>
  );
}
