import { NextResponse, type NextRequest } from "next/server";
import { PANEL_COOKIE, PANEL_COOKIE_MAX_AGE, resolvePanelToken } from "@/lib/panel/session";

// The link in the restaurant's email lands here. If the token is good we remember it
// in a cookie, so the restaurant doesn't need the link again on this device.
export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/panel/enter/[token]">,
) {
  const { token } = await ctx.params;
  const restaurant = await resolvePanelToken(token);

  if (!restaurant) {
    return NextResponse.redirect(new URL("/panel/locked", request.url));
  }

  const response = NextResponse.redirect(new URL("/panel", request.url));
  response.cookies.set(PANEL_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/panel",
    maxAge: PANEL_COOKIE_MAX_AGE,
  });
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
