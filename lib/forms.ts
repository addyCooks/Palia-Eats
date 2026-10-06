"use client";

import { startTransition, type FormEvent } from "react";

// React clears a form after its server action runs, so a rejected save ("Price must be…")
// would also wipe what the person typed. Submitting this way keeps their input on screen;
// the action and its pending state work exactly as with <form action={…}>.
export function keepValues(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter instanceof HTMLElement ? submitter : null);
    startTransition(() => action(formData));
  };
}
