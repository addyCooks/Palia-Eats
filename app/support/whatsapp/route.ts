import { NextResponse, type NextRequest } from "next/server";
import { whatsappTarget } from "@/lib/utils/support";

// Opens WhatsApp with PaliaEats support. The support number lives only on the server
// (SUPPORT_PHONE), so no page ever contains it: the "WhatsApp us" buttons point here and
// this sends people on to WhatsApp, with the message already written.
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const target = whatsappTarget(request.nextUrl.searchParams);
  // No number set (yet): send people to the About page, which shows the email instead.
  if (!target) return NextResponse.redirect(new URL("/about", request.url));
  const response = NextResponse.redirect(target, 307);
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}
