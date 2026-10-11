import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

// Helpers for the link-preview pictures (what WhatsApp, Facebook and Google show when a PaliaEats
// link is shared).

export const OG_SIZE = { width: 1200, height: 630 } as const;

// The PaliaEats logo as a data address, or null if the file can't be read (the picture is then
// made without it).
export async function logoDataUrl(): Promise<string | null> {
  try {
    const bytes = await readFile(join(process.cwd(), "public", "brand", "paliaeats-logo.png"));
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

// A restaurant's cover photo, cut to the preview's shape and turned into a JPEG data address
// (the picture maker can't read every format). Only our own photo storage is fetched. Returns
// null on any problem, and the preview is made with a plain colour instead.
export async function coverDataUrl(url: string | null): Promise<string | null> {
  try {
    if (!url) return null;
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) return null;

    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    const input = Buffer.from(await response.arrayBuffer());
    if (input.length > 6 * 1024 * 1024) return null;

    const jpeg = await sharp(input)
      .resize(OG_SIZE.width, OG_SIZE.height, { fit: "cover" })
      .jpeg({ quality: 78 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}
