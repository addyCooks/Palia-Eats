"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";
import { reportClientError } from "@/lib/monitoring/report-client";

// Shown when something unexpected breaks while loading a page (often a patchy connection).
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ProblemScreen
        glyph="!"
        tone="dark"
        title={t("err.page_title")}
        action={
          <button type="button" onClick={reset} className={problemActionClass}>
            {t("err.page_retry")}
          </button>
        }
        secondary={<Link href="/">{t("err.page_home")}</Link>}
      >
        {t("err.page_body")}
      </ProblemScreen>
    </main>
  );
}
