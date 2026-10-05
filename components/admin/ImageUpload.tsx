"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const BUCKET = "restaurant-media";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB (the bucket enforces this too)
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type ImageUploadProps = {
  name: string; // the hidden form field that receives the image URL
  label: string;
  restaurantId: string;
  folder: string; // e.g. "logo", "cover", "menu"
  defaultUrl?: string | null;
};

// Uploads straight from the browser to Supabase Storage (admins only, enforced by
// storage policies), then puts the public URL into a hidden field for the form.
export function ImageUpload({ name, label, restaurantId, folder, defaultUrl }: ImageUploadProps) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    const extension = EXTENSIONS[file.type];
    if (!extension) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large. Maximum size is 2 MB.");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const path = `${restaurantId}/${folder}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError("Upload failed. Please try again.");
    } else {
      setUrl(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <input type="hidden" name={name} value={url} />

      {url && (
        <div className="relative h-32 w-full max-w-xs overflow-hidden rounded-xl border border-border bg-muted">
          <Image src={url} alt={label} fill unoptimized className="object-cover" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex h-9 cursor-pointer items-center rounded-xl border border-border bg-surface px-3 text-sm font-medium hover:bg-muted">
          {uploading ? "Uploading..." : url ? "Change image" : "Upload image"}
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
        {url && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setUrl("")}>
            Remove
          </Button>
        )}
      </div>
      <p className="text-xs text-stone-500">JPG, PNG or WebP, up to 2 MB.</p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
