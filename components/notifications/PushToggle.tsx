"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, saveFcmToken, savePushSubscription } from "@/lib/actions/push";
import { fcmEnabled, firebaseVapidKey, firebaseWebConfig, pushEnabled } from "@/lib/push/client-config";
import { useLang, useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/Button";

type State = "checking" | "unsupported" | "ios-install" | "denied" | "off" | "on";

// The push address wants its key as bytes, but we keep it as text.
function keyToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=").replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

// This phone's Firebase token is remembered here, so turning notifications off knows how it was set up.
const FCM_TOKEN_KEY = "pe-fcm-token";

function savedFcmToken(): string | null {
  try {
    return window.localStorage.getItem(FCM_TOKEN_KEY);
  } catch {
    return null;
  }
}

function rememberFcmToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(FCM_TOKEN_KEY, token);
    else window.localStorage.removeItem(FCM_TOKEN_KEY);
  } catch {
    // storage blocked: turning off still works, it just can't tell how this phone was set up
  }
}

// The Firebase code (large) is only downloaded when someone actually turns notifications on or off.
async function loadMessaging() {
  const [{ getApps, initializeApp }, { getMessaging, isSupported }] = await Promise.all([
    import("firebase/app"),
    import("firebase/messaging"),
  ]);
  if (!(await isSupported())) throw new Error("unsupported");
  const app = getApps()[0] ?? initializeApp(firebaseWebConfig);
  return getMessaging(app);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true;
}

// Turn order notifications on or off for THIS phone. Uses Firebase when its settings are in place,
// otherwise our own web push (needs the VAPID public key, set on Vercel); with neither, nothing is shown.
export function PushToggle() {
  const t = useT();
  const lang = useLang();
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const [state, setState] = useState<State>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) {
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
        if (!cancelled) setState(ios && !isStandalone() ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setState("denied");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (!cancelled) setState(subscription ? "on" : "off");
    }
    void check();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!pushEnabled() || state === "checking") return null;

  async function turnOn() {
    setBusy(true);
    setError(false);
    try {
      const registration =
        (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      if (fcmEnabled()) {
        const { getToken } = await import("firebase/messaging");
        const messaging = await loadMessaging();
        // A phone set up the old way holds a subscription for our own key: replace it with Firebase's.
        const old = await registration.pushManager.getSubscription();
        if (old && !savedFcmToken()) {
          await removePushSubscription(old.endpoint);
          await old.unsubscribe();
        }
        const token = await getToken(messaging, { vapidKey: firebaseVapidKey, serviceWorkerRegistration: registration });
        if (!token) throw new Error("no token");
        const saved = await saveFcmToken(token, lang);
        if (saved.error) throw new Error(saved.error);
        rememberFcmToken(token);
        setState("on");
        return;
      }

      if (!publicKey) throw new Error("not set up");
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("incomplete subscription");

      const result = await savePushSubscription(
        { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
        lang,
      );
      if (result.error) throw new Error(result.error);
      setState("on");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    setBusy(true);
    setError(false);
    try {
      const token = savedFcmToken();
      if (token) {
        const { deleteToken } = await import("firebase/messaging");
        await removePushSubscription(token);
        await deleteToken(await loadMessaging());
        rememberFcmToken(null);
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscription(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState("off");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (state === "unsupported") return <p className="text-sm text-stone-500">{t("push.unsupported")}</p>;
  if (state === "ios-install") return <p className="text-sm text-stone-600">{t("app.ios_install")}</p>;
  if (state === "denied") return <p className="text-sm text-stone-600">{t("push.denied")}</p>;

  return (
    <div className="flex flex-col gap-2">
      {state === "on" ? (
        <>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{t("push.on")}</p>
          <Button variant="secondary" size="sm" className="self-start" onClick={turnOff} loading={busy} disabled={busy}>
            {busy ? t("push.working") : t("push.turn_off")}
          </Button>
        </>
      ) : (
        <Button className="self-start" onClick={turnOn} loading={busy} disabled={busy}>
          {busy ? t("push.working") : t("push.turn_on")}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {t("push.failed")}
        </p>
      )}
    </div>
  );
}
