import { ImageResponse } from "next/og";
import { createPublicClient } from "@/lib/supabase/public";
import { OG_SIZE, coverDataUrl, logoDataUrl } from "@/lib/seo/og-image";
import { publicRating } from "@/lib/utils/rating";

// The picture shown when a restaurant's link is shared on WhatsApp and elsewhere: its cover photo,
// name, cuisines and (once it has 5 or more ratings) its stars. Built once and kept for an hour.
export const alt = "A restaurant on PaliaEats";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: restaurant } = await createPublicClient()
    .from("restaurants")
    .select("name, cuisine_tags, area, cover_url, theme, rating_avg, rating_count")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  const [cover, logo] = await Promise.all([coverDataUrl(restaurant?.cover_url ?? null), logoDataUrl()]);
  const name = restaurant?.name ?? "PaliaEats";
  const brand = (restaurant?.theme as { brand?: string } | null)?.brand ?? "#F5A524";
  const rating = restaurant ? publicRating(restaurant) : null;
  const line = [((restaurant?.cuisine_tags as string[] | undefined) ?? []).slice(0, 3).join(" · "), restaurant?.area]
    .filter(Boolean)
    .join("   |   ");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: brand,
          color: "#FFFFFF",
        }}
      >
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} width={OG_SIZE.width} height={OG_SIZE.height} alt="" style={{ position: "absolute", inset: 0 }} />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: "linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.82) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 64px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#FBF3E4",
                color: "#16120D",
                borderRadius: 999,
                padding: logo ? "8px 28px 8px 10px" : "14px 28px",
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} width={56} height={56} alt="" style={{ marginRight: 14, borderRadius: 999 }} />
              )}
              Order on PaliaEats
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: name.length > 26 ? 66 : 84, lineHeight: 1.05, fontWeight: 700 }}>{name}</div>
            {line && <div style={{ display: "flex", fontSize: 34, marginTop: 18, color: "#FFE2A8" }}>{line}</div>}
            {rating && (
              <div
                style={{
                  display: "flex",
                  alignSelf: "flex-start",
                  marginTop: 22,
                  background: "rgba(255,255,255,0.92)",
                  color: "#16120D",
                  borderRadius: 999,
                  padding: "8px 24px",
                  fontSize: 30,
                  fontWeight: 700,
                }}
              >
                ★ {rating.avg}
                <span style={{ marginLeft: 12, fontWeight: 400, color: "#57534E" }}>{rating.count} ratings</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
