import type { NextConfig } from "next";

// The browser's rulebook for what a PaliaEats page may load or do (Content-Security-Policy). Anything
// not listed here is blocked, so even if someone managed to slip a script into a page it could not
// load code from, or send data to, a stranger's website.
//
// What we allow, and why:
//   Supabase (https + wss)   our database, login, photos and live order updates
//   OpenStreetMap            the small map preview when a customer shares their location
//   'unsafe-inline'          Next.js writes small inline scripts and styles into every page; blocking
//                            them would break the site (the stricter "nonce" way makes every page
//                            slower to serve, which is not worth it for this site)
//   data: / blob:            the 2-step-login QR picture, and photo previews before upload
// Vercel Analytics and Speed Insights load from our own address, so they need no extra entry.
// Only switched on for the real site: Next.js's development mode needs looser rules.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  // Firebase: the phone signs up for notifications (installations + registrations)
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://fcm.googleapis.com",
  "frame-src https://www.openstreetmap.org",
  "worker-src 'self'",
  "manifest-src 'self'",
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com https://*.supabase.co",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

// Safe-by-default browser rules for every page.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }, // nobody can embed our pages in a frame
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    // Restaurant and menu photos are stored in Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The notification script must always be the latest one, never an old copy from a cache.
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
