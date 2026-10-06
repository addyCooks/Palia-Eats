"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Photo } from "@/components/ui/Photo";

const BUCKET = "restaurant-media";
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

type ServerUpload = (formData: FormData) => Promise<{ url?: string; error?: string }>;

type ImageUploadProps = {
  name: string; // the hidden form field that receives the image URL
  label: string;
  restaurantId: string;
  folder: string; // e.g. "logo", "cover", "menu"
  defaultUrl?: string | null;
  // "plate": a round dish photo, cropped square. "wide": covers and logos as they are.
  shape?: "plate" | "wide";
  // Shown in the empty plate (e.g. a stand-in photo) until a real one is uploaded.
  previewFallback?: string;
  // The restaurant panel uploads through the server (it has no login); admins upload
  // straight to storage.
  serverUpload?: ServerUpload;
};

// Shrinks the photo in the browser before upload (max 1200px, JPEG), so uploads are quick
// on mobile data. Plates are cropped to a centred square.
async function shrink(file: File, square: boolean): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const sx = square ? (bitmap.width - side) / 2 : 0;
  const sy = square ? (bitmap.height - side) / 2 : 0;
  const sw = square ? side : bitmap.width;
  const sh = square ? side : bitmap.height;
  const scale = Math.min(1, 1200 / Math.max(sw, sh));

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * scale);
  canvas.height = Math.round(sh * scale);
  canvas.getContext("2d")?.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("resize failed"))), "image/jpeg", 0.85),
  );
}

export function ImageUpload({
  name,
  label,
  restaurantId,
  folder,
  defaultUrl,
  shape = "wide",
  previewFallback,
  serverUpload,
}: ImageUploadProps) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) {
      setError("Please choose a JPG, PNG or WebP photo.");
      return;
    }

    setUploading(true);
    try {
      const blob = await shrink(file, shape === "plate");
      if (blob.size > 900 * 1024) {
        setError("That photo is too large even after shrinking. Please try another.");
        return;
      }

      if (serverUpload) {
        const formData = new FormData();
        formData.append("file", new File([blob], "photo.jpg", { type: "image/jpeg" }));
        const result = await serverUpload(formData);
        if (result.error || !result.url) setError(result.error ?? "Upload failed. Please try again.");
        else setUrl(result.url);
      } else {
        const supabase = createClient();
        const path = `${restaurantId}/${folder}/${crypto.randomUUID()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: "image/jpeg" });
        if (uploadError) setError("Upload failed. Please try again.");
        else setUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }
    } catch {
      setError("Couldn't read that photo. Please choose a JPG, PNG or WebP photo.");
    } finally {
      setUploading(false);
    }
  }

  const picker = (text: string, className: string) => (
    <label className={className}>
      {uploading ? "Uploading…" : text}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        disabled={uploading}
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </label>
  );

  const shown = url || previewFallback;

  if (shape === "plate") {
    return (
      <div className="flex flex-col items-center gap-3.5">
        <input type="hidden" name={name} value={url} />
        <div className="relative size-[180px] overflow-hidden rounded-full bg-muted shadow-[0_16px_34px_rgba(0,0,0,.2)] sm:size-[220px]">
          {shown ? (
            <Photo src={shown} alt={label} sizes="220px" />
          ) : (
            <span className="flex size-full items-center justify-center text-stone-500">
              <Camera className="size-10" aria-hidden />
            </span>
          )}
          {!url && shown && (
            <span className="absolute inset-x-0 bottom-0 bg-black/55 py-1.5 text-center text-[11px] font-semibold text-white">
              Sample photo
            </span>
          )}
        </div>
        <span className="max-w-[240px] text-center text-[13px] text-stone-500">
          Square photo, shot from above, at least 800 × 800 px
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {picker(
            url ? "Change photo" : "Upload photo",
            "inline-flex h-10 cursor-pointer items-center rounded-xl bg-deep px-4 text-sm font-semibold text-brand hover:opacity-90",
          )}
          {url && (
            <button
              type="button"
              onClick={() => setUrl("")}
              className="h-10 rounded-xl px-3 text-sm font-medium text-stone-600 hover:bg-muted"
            >
              Remove
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="text-center text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-stone-600">{label}</span>
      <input type="hidden" name={name} value={url} />

      {url && (
        <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-xl border border-border bg-muted">
          <Photo src={url} alt={label} sizes="320px" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {picker(
          url ? "Change image" : "Upload image",
          "inline-flex h-10 cursor-pointer items-center rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-medium hover:bg-muted",
        )}
        {url && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="h-10 rounded-xl px-3 text-sm font-medium text-stone-600 hover:bg-muted"
          >
            Remove
          </button>
        )}
      </div>
      <p className="text-xs text-stone-500">JPG, PNG or WebP. Big photos are shrunk automatically.</p>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
