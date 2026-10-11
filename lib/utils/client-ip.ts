import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

// A short anonymous label for "this visitor's connection", used for spam limits. The real
// address is mixed with a server secret and cut short, so it can't be turned back into an IP
// and nothing personal is stored.
export async function clientId(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  return createHash("sha256")
    .update(`${ip}|${process.env.PANEL_TOKEN_SECRET ?? "paliaeats"}`)
    .digest("hex")
    .slice(0, 24);
}
