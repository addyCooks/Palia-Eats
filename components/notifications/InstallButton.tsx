"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/Button";

// The browser's own "install" prompt, as a button. (Chrome and Edge on Android and laptops offer
// it; iPhone has no such prompt, which the push card explains instead.) Hidden once installed.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallButton() {
  const t = useT();
  const [event, setEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event) return null;
  return (
    <Button
      variant="secondary"
      className="self-start"
      onClick={async () => {
        await event.prompt();
        await event.userChoice;
        setEvent(null);
      }}
    >
      {t("app.install")}
    </Button>
  );
}
