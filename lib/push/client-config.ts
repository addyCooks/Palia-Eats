// What the browser needs to know to turn notifications on. Safe to import anywhere (these are the
// public Firebase settings that every website using Firebase shows in its page; none is a secret).

export const firebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseVapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// Notifications through Firebase are used once all of its settings are in place.
export function fcmEnabled(): boolean {
  return Boolean(
    firebaseWebConfig.apiKey &&
      firebaseWebConfig.projectId &&
      firebaseWebConfig.messagingSenderId &&
      firebaseWebConfig.appId &&
      firebaseVapidKey,
  );
}

// Any way of sending notifications is set up (Firebase, or our own web push).
export function pushEnabled(): boolean {
  return fcmEnabled() || Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}
