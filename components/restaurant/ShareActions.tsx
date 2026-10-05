"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type ShareActionsProps = { url: string; name: string; slug: string };

function save(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

// Builds the QR as an SVG string in the browser (same library, loaded only when needed).
async function makeSvg(url: string): Promise<string> {
  const QRCode = (await import("qrcode")).default;
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2, width: 1024 });
}

export function ShareActions({ url, name, slug }: ShareActionsProps) {
  const [note, setNote] = useState<string | null>(null);

  function flash(message: string) {
    setNote(message);
    window.setTimeout(() => setNote(null), 2500);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    } catch {
      flash("Couldn't copy. Select the link and copy it.");
    }
  }

  async function shareLink() {
    if (typeof navigator.share !== "function") return copyLink();
    try {
      await navigator.share({ title: name, text: `Order from ${name}`, url });
    } catch {
      // The person closed the share sheet; nothing to do.
    }
  }

  async function downloadSvg() {
    save(new Blob([await makeSvg(url)], { type: "image/svg+xml" }), `${slug}-qr.svg`);
  }

  async function downloadPng() {
    try {
      const svg = await makeSvg(url);
      const image = new Image();
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("image"));
        image.src = svgUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      canvas.getContext("2d")!.drawImage(image, 0, 0, 1024, 1024);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => blob && save(blob, `${slug}-qr.png`), "image/png");
    } catch {
      flash("Couldn't make the PNG. Try the SVG download.");
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <input
        readOnly
        value={url}
        aria-label="Ordering link"
        onFocus={(e) => e.currentTarget.select()}
        className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={copyLink}>
          Copy link
        </Button>
        <Button size="sm" variant="secondary" onClick={shareLink}>
          Share
        </Button>
        <Button size="sm" variant="secondary" onClick={downloadPng}>
          Download QR (PNG)
        </Button>
        <Button size="sm" variant="secondary" onClick={downloadSvg}>
          Download QR (SVG, for print)
        </Button>
      </div>
      <p role="status" className="min-h-5 text-sm text-green-700">
        {note}
      </p>
    </div>
  );
}
