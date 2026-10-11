"use client";

import { useEffect, useRef } from "react";

// Put inside any public form. Invisible to people. See lib/utils/bot-check.ts for what the
// server does with it.
export function BotTraps() {
  const fill = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const form = fill.current?.form;
    if (!form) return;
    const started = performance.now();
    // Capture phase: runs just before React reads the form, so the value is in time.
    const stamp = () => {
      if (fill.current) fill.current.value = String(Math.round(performance.now() - started));
    };
    form.addEventListener("submit", stamp, true);
    return () => form.removeEventListener("submit", stamp, true);
  }, []);

  return (
    <>
      <div aria-hidden className="absolute -left-[9999px] size-0 overflow-hidden">
        <label>
          Leave this empty
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
          />
        </label>
      </div>
      <input ref={fill} type="hidden" name="fillMs" defaultValue="" />
    </>
  );
}
