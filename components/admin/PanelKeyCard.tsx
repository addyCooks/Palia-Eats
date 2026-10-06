"use client";

import { useActionState, useState } from "react";
import {
  generateRestaurantPanelKey,
  type PanelKeyState,
} from "@/lib/actions/restaurants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type PanelKeyCardProps = {
  restaurantId: string;
  createdAt: string | null;
};

export function PanelKeyCard({ restaurantId, createdAt }: PanelKeyCardProps) {
  const [state, formAction, pending] = useActionState<PanelKeyState, FormData>(
    generateRestaurantPanelKey,
    undefined,
  );
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!state?.link) return;
    await navigator.clipboard.writeText(state.link);
    setCopied(true);
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-semibold">Restaurant panel link</h2>
      <p className="text-sm text-stone-600">
        The restaurant uses a private link (no password) to see orders, update their status
        and open or close for orders. Each new-order email also contains a fresh link, so
        this one is mainly for bookmarking.{" "}
        {createdAt
          ? `All links before ${new Date(createdAt).toLocaleDateString("en-IN")} are cancelled.`
          : "You can create one here at any time."}
      </p>

      {state?.link && (
        <div className="flex flex-col gap-2 rounded-xl bg-amber-50 p-3 text-sm">
          <p className="font-medium text-amber-900">
            Copy this link now. For security it can&apos;t be shown again.
          </p>
          <code className="break-all rounded-[10px] bg-surface p-2.5 text-xs">{state.link}</code>
          <Button type="button" size="sm" variant="secondary" onClick={copyLink}>
            {copied ? "Copied!" : "Copy link"}
          </Button>
        </div>
      )}
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <form
        action={formAction}
        onSubmit={(event) => {
          if (createdAt && !window.confirm("This cancels ALL earlier panel links, including those in old emails. Continue?")) {
            event.preventDefault();
          }
          setCopied(false);
        }}
      >
        <input type="hidden" name="restaurantId" value={restaurantId} />
        <Button type="submit" variant={createdAt ? "secondary" : "primary"} disabled={pending}>
          {pending ? "Creating..." : createdAt ? "Cancel old links and generate a new one" : "Generate panel link"}
        </Button>
      </form>
    </Card>
  );
}
