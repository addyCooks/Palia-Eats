import Image from "next/image";
import { isPlaceholder } from "@/lib/utils/placeholder";

// A photo that fills its (relative, sized) parent. Our five stand-in photos go through
// Next's image resizing; uploaded photos are already small and load as they are.
export function Photo({
  src,
  alt,
  sizes,
  priority,
  className = "object-cover",
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!isPlaceholder(src)}
      className={className}
    />
  );
}
