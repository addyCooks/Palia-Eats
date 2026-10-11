import { ImageResponse } from "next/og";
import { OG_SIZE, logoDataUrl } from "@/lib/seo/og-image";

// The picture shown when the PaliaEats link itself is shared (WhatsApp, Facebook, Google ...).
export const alt = "PaliaEats: Palia's own food app";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const logo = await logoDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#16120D",
          padding: "70px 80px",
          color: "#FFFFFF",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 660 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 8, color: "#F5A524", fontWeight: 700 }}>PALIA</div>
          <div style={{ display: "flex", fontSize: 150, lineHeight: 1, marginTop: 4, fontWeight: 700 }}>
            Eats<span style={{ color: "#F5A524" }}>●</span>
          </div>
          <div style={{ display: "flex", fontSize: 44, lineHeight: 1.25, marginTop: 36, color: "#F7E9CF" }}>
            Your happy bite is just a tap away.
          </div>
          <div style={{ display: "flex", fontSize: 28, marginTop: 26, color: "#BFB6A8" }}>
            Order from Palia&apos;s own kitchens. Pay cash or UPI at your door.
          </div>
        </div>
        {logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={380} height={380} alt="" style={{ borderRadius: 32 }} />
        )}
      </div>
    ),
    { ...size },
  );
}
