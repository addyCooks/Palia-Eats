"use client";

import { useActionState } from "react";
import { keepValues } from "@/lib/forms";
import { sendPanelHelpRequest, type HelpState } from "@/lib/actions/support";
import { PANEL_TOPICS } from "@/lib/support/topics";
import { BotTraps } from "@/components/forms/BotTraps";
import { selectClass } from "@/components/support/HelpForm";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

// "Send us a message" for restaurants, on the panel's Settings page. The panel link already tells
// us which restaurant this is, so there is nothing to retype. (The panel is English only.)
export function PanelHelpForm() {
  const [state, formAction, pending] = useActionState<HelpState, FormData>(sendPanelHelpRequest, undefined);

  if (state?.done) {
    return (
      <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-900">
        Message sent. Thank you! We&apos;ll reply on the email or phone number we have for your restaurant.
      </p>
    );
  }

  return (
    <form onSubmit={keepValues(formAction)} className="relative flex flex-col gap-3">
      <BotTraps />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="panel-topic" className="text-[13px] font-semibold text-stone-600">
          What is it about?
        </label>
        <select id="panel-topic" name="topic" required defaultValue="" className={selectClass}>
          <option value="" disabled>
            Choose one
          </option>
          {PANEL_TOPICS.map((topic) => (
            <option key={topic.code} value={topic.code}>
              {topic.label.replace("Restaurant panel: ", "")}
            </option>
          ))}
        </select>
      </div>
      <Textarea label="Your message" name="message" rows={4} maxLength={1000} required />
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
