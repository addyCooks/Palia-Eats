export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2 MB (the storage bucket enforces this too)

// Recognises JPG, PNG and WebP by their first bytes ("magic numbers"), so a file can't
// pretend to be a photo just by its name.
export function detectImageType(bytes: Uint8Array): { mime: string; extension: string } | null {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (bytes.length >= 3 && starts(0xff, 0xd8, 0xff)) return { mime: "image/jpeg", extension: "jpg" };
  if (bytes.length >= 8 && starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { mime: "image/png", extension: "png" };
  }
  if (
    bytes.length >= 12 &&
    starts(0x52, 0x49, 0x46, 0x46) && // RIFF
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // WEBP
  ) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}
