import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Tells search engines to index the public pages and stay out of private ones.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/panel", "/checkout", "/cart", "/account", "/orders", "/login", "/signup", "/auth", "/support"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
