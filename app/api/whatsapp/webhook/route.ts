import { timingSafeEqual } from "node:crypto";
import { after, NextResponse, type NextRequest } from "next/server";
import { whatsappConfig } from "@/lib/whatsapp/config";
import { verifyWebhookSignature } from "@/lib/whatsapp/signature";
import { parseInbound } from "@/lib/whatsapp/inbound";
import { processInbound } from "@/lib/whatsapp/handler";

// The address WhatsApp (Meta) calls with new messages.
//  GET  -> one-time check when you set the webhook up in the Meta dashboard
//  POST -> every message from a customer; must be signed by Meta (we verify it)

export const dynamic = "force-dynamic";

function sameText(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: NextRequest) {
  const { verifyToken } = whatsappConfig();
  const params = request.nextUrl.searchParams;
  const challenge = params.get("hub.challenge");

  if (
    verifyToken &&
    params.get("hub.mode") === "subscribe" &&
    sameText(params.get("hub.verify_token") ?? "", verifyToken) &&
    challenge
  ) {
    return new NextResponse(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const { appSecret } = whatsappConfig();
  if (!appSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  // The signature covers the exact raw body, so read it as text before parsing.
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const messages = parseInbound(payload);
  // Answer WhatsApp straight away; do the real work afterwards.
  if (messages.length > 0) after(() => processInbound(messages));
  return NextResponse.json({ received: messages.length });
}
