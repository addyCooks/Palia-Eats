"use client";

import { useState, useTransition } from "react";
import { setErrorResolved } from "@/lib/actions/errors";
import { Button } from "@/components/ui/Button";

export function ErrorResolveButton({ id, resolved }: { id: number; resolved: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-3">
      <Button
        size="sm"
        variant={resolved ? "secondary" : "primary"}
        loading={pending}
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setErrorResolved({ id, resolved: !resolved });
            if (result.error) setError(result.error);
          });
        }}
      >
        {resolved ? "Reopen" : "Mark fixed"}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}
