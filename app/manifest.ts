import type { MetadataRoute } from "next";

// What makes "Add to Home Screen" / "Install app" give PaliaEats its own icon and full-screen look.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PaliaEats",
    short_name: "PaliaEats",
    description: "Order from Palia's own kitchens. Your happy bite is just a tap away.",
    start_url: "/?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f6f3",
    theme_color: "#f7f6f3",
    lang: "en-IN",
    categories: ["food", "shopping"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
