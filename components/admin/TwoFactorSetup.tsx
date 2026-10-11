"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  confirmTotpEnrollment,
  disableTotp,
  startTotpEnrollment,
  type TotpStart,
} from "@/lib/actions/mfa";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Admin -> Security. Off: scan a QR code with an authenticator app and type the first code.
// On: shows that it is protecting the login, and lets the admin turn it off again.
export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [setup, setSetup] = useState<TotpStart | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmOff, setConfirmOff] = useState(false);

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await startTotpEnrollment();
      if (result.error) setError(result.error);
      else setSetup(result);
    });
  }

  function confirm() {
    if (!setup?.factorId) return;
    setError(null);
    startTransition(async () => {
      const result = await confirmTotpEnrollment({ factorId: setup.factorId!, code });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSetup(null);
      setCode("");
      router.refresh();
    });
  }

  function turnOff() {
    setError(null);
    startTransition(async () => {
      const result = await disableTotp();
      if (result.error) {
        setError(result.error);
        return;
      }
      setConfirmOff(false);
      router.refresh();
    });
  }

  if (enabled) {
    return (
      <div className="flex flex-col gap-4">
        <p className="rounded-xl bg-amber-50 p-4 text-sm font-medium text-amber-900">
          2-step login is ON. After your password, the admin asks for the 6-digit code from your authenticator app.
        </p>
        <p className="text-sm text-stone-600">
          Lost your phone? You can still get in: open your Supabase project, go to Authentication → Users, open your
          account and remove its authenticator. Then log in with your password and set it up again.
        </p>
        {confirmOff ? (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium">Turn 2-step login off?</span>
            <Button variant="danger" size="sm" onClick={turnOff} loading={pending} disabled={pending}>
              Yes, turn it off
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirmOff(false)} disabled={pending}>
              Keep it on
            </Button>
          </div>
        ) : (
          <Button variant="secondary" className="self-start" onClick={() => setConfirmOff(true)}>
            Turn off 2-step login
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  if (!setup) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-stone-600">
          The admin can see every customer&apos;s name, phone number and address. A second step at login means a stolen
          password alone is not enough to get in. You need a free authenticator app on your phone (Google
          Authenticator, Microsoft Authenticator or similar).
        </p>
        <Button className="self-start" onClick={start} loading={pending} disabled={pending}>
          Turn on 2-step login
        </Button>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ol className="flex list-decimal flex-col gap-4 pl-5 text-sm">
        <li>
          Open your authenticator app and choose “Add” or “Scan a QR code”, then scan this:
          <div className="mt-3 inline-block rounded-2xl bg-white p-3">
            {/* A QR code made by Supabase, shown as a picture */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setup.qr} alt="QR code for your authenticator app" width={200} height={200} />
          </div>
          {setup.secret && (
            <p className="mt-2 text-[13px] text-stone-500">
              Can&apos;t scan? Type this key into the app instead:{" "}
              <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{setup.secret}</code>
            </p>
          )}
        </li>
        <li>
          Type the 6-digit code the app now shows:
          <div className="mt-2 max-w-[220px]">
            <Input
              label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </div>
        </li>
      </ol>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <Button onClick={confirm} loading={pending} disabled={pending || code.replace(/\s/g, "").length !== 6}>
          Turn it on
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setSetup(null);
            setCode("");
            setError(null);
          }}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
