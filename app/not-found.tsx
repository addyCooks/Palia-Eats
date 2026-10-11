import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

export default async function NotFound() {
  const t = await getT();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ProblemScreen
        glyph="?"
        title={t("nf.title")}
        action={
          <Link href="/" className={problemActionClass}>
            {t("goodbye.home")}
          </Link>
        }
      >
        {t("nf.body")}
      </ProblemScreen>
    </main>
  );
}
