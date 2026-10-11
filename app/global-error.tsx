"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/monitoring/report-client";

// The last safety net: shown only if the page's outermost layout itself crashes (app/error.tsx
// handles everything inside it). It replaces the whole page, so it brings its own <html> and
// plain styles.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f6f3",
          color: "#16120d",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: 360 }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 20px", color: "#57534e", lineHeight: 1.5 }}>
            We couldn&apos;t load PaliaEats just now. Check your connection and try again. Your cart is saved.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#ea580c",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              padding: "12px 22px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
