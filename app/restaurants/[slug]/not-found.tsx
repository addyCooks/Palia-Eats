import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

export default async function RestaurantNotFound() {
  const t = await getT();
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ProblemScreen
        glyph="z"
        tone="warm"
        title={t("nf.restaurant_title")}
        action={
          <Link href="/#restaurants" className={problemActionClass}>
            {t("closed.see_open")}
          </Link>
        }
      >
        {t("nf.restaurant_body")}
      </ProblemScreen>
    </main>
  );
}
